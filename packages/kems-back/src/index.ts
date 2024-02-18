import { Context, Hono } from 'hono';
import { cors } from 'hono/cors';
import { setCookie } from 'hono/cookie';
import { vValidator as valibot } from '@hono/valibot-validator';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { poweredBy } from 'hono/powered-by';
import { streamSSE } from 'hono/streaming';
import { EventEmitter } from 'node:events';
import type TypedEmitter from 'typed-emitter';

import { nanoid } from 'nanoid';
import { custom, length, minLength, object, string, transform } from 'valibot';

export type Events = {
  ['player-join']: (data: { player: string }) => void;
  ['player-left']: (data: { player: string }) => void;
  ['room-closed']: (data: {}) => void;
  ['game-stopped']: (data: { player: string }) => void;
  start: (data: {}) => void;
};

class Room {
  public readonly players = new Set<string>();
  private started = false;
  public readonly emitter = new EventEmitter() as TypedEmitter<Events>;

  public constructor(
    public readonly name: string,
    public readonly owner: string,
  ) {
    this.players.add(owner);
  }

  public didStart(): boolean {
    return this.started;
  }

  public addPlayer(player: string): void {
    this.players.add(player);

    this.emitter.emit('player-join', { player });
  }

  public removePlayer(player: string): void {
    this.players.delete(player);

    this.emitter.emit('player-left', { player });
  }

  public stop(playerWhoLeft: string): void {
    this.removePlayer(playerWhoLeft);
    this.emitter.emit('game-stopped', { player: playerWhoLeft });
  }

  public close(): void {
    this.players.clear();
    this.emitter.emit('room-closed', {});
  }

  public start(): void {
    this.emitter.emit('start', {});
  }
}

export const players = new Map<string, string>();
export const rooms = new Map<string, Room>();
export const PLAYER_ID_COOKIE = 'player';
export const ROOM_ID_COOKIE = 'room';

const PlayerId = transform(
  string([length(21), custom((id) => players.has(id))]),
  (id) => players.get(id)!,
);

const RoomId = transform(
  string([length(21), custom((id) => rooms.has(id))]),
  (id) => rooms.get(id)!,
);

const IS_PROD = process.env.NODE_ENV === 'production';

const middlewares = new Hono().use(cors()).use(poweredBy());

if (process.env.NODE_ENV !== 'test') {
  middlewares.use(logger());
}

if (IS_PROD) {
  middlewares.use(secureHeaders());
}

const routes = new Hono()
  .post(
    '/register',
    valibot('json', object({ name: string([minLength(2)]) })),
    (c) => {
      const { name: player } = c.req.valid('json');
      const id = nanoid().replace('-', '_');

      players.set(id, player);
      setCookie(c, PLAYER_ID_COOKIE, id, {
        httpOnly: true,
        secure: IS_PROD,
        sameSite: 'Strict',
      });

      return c.newResponse(null, 204);
    },
  )
  .post(
    '/rooms',
    valibot('cookie', object({ [PLAYER_ID_COOKIE]: PlayerId })),
    valibot('json', object({ roomName: string([minLength(2)]) })),
    (c) => {
      if (rooms.size >= 4 && IS_PROD) {
        return c.text('Max rooms limit reached', 400);
      }

      const { player } = c.req.valid('cookie');
      const { roomName } = c.req.valid('json');

      const roomId = nanoid().replace('-', '_');
      rooms.set(roomId, new Room(roomName, player));

      setCookie(c, ROOM_ID_COOKIE, roomId, {
        httpOnly: true,
        secure: IS_PROD,
        sameSite: 'Strict',
      });

      return c.text(roomId);
    },
  )
  .post(
    '/rooms/:room/join',
    valibot('cookie', object({ [PLAYER_ID_COOKIE]: PlayerId })),
    valibot('param', object({ [ROOM_ID_COOKIE]: RoomId })),
    (c) => {
      const { room } = c.req.valid('param');
      const { player } = c.req.valid('cookie');

      if (room.didStart()) {
        return c.text('This game already started, you cannot join it now!');
      }

      if (
        Array.from(room.players.values()).some(
          (roomPlayer) => roomPlayer === player,
        )
      ) {
        return c.text('You are already in this room.', 400);
      }

      room.addPlayer(player);

      return c.text(room.name);
    },
  )
  .post(
    '/rooms/leave',
    valibot(
      'cookie',
      object({ [PLAYER_ID_COOKIE]: PlayerId, [ROOM_ID_COOKIE]: RoomId }),
    ),
    (c) => {
      const { player, room } = c.req.valid('cookie');

      if (!room.players.has(player)) {
        return c.text('You are not a player of this room!', 400);
      }

      if (player === room.owner) {
        room.close();
      } else if (room.didStart()) {
        room.stop(player);
      } else {
        room.removePlayer(player);
      }

      return c.newResponse(null, 204);
    },
  )
  .post(
    '/rooms/start',
    valibot(
      'cookie',
      object({ [PLAYER_ID_COOKIE]: PlayerId, [ROOM_ID_COOKIE]: RoomId }),
    ),
    (c) => {
      const { player, room } = c.req.valid('cookie');

      if (player !== room.owner) {
        return c.text('You are not the owner of this room!', 400);
      }

      if (room.players.size % 2 !== 0) {
        return c.text('Cannot start a game without an even amount of players');
      }

      if (room.didStart()) {
        return c.text('Game has already started!');
      }

      room.start();

      return c.text('Starting...');
    },
  )
  .get(
    '/rooms/events',
    valibot(
      'cookie',
      object({ [PLAYER_ID_COOKIE]: PlayerId, [ROOM_ID_COOKIE]: RoomId }),
    ),
    async (c) => {
      const { room, player } = c.req.valid('cookie');

      if (room.players.has(player)) {
        return c.text('You are not a player of this room!', 400);
      }

      return streamSSE(c, async (stream) => {
        let shouldClose = false;

        room.emitter.on('player-join', async ({ player }) => {
          await stream.writeSSE({
            data: JSON.stringify({
              player,
            }),
            event: 'player-join',
          });
        });

        room.emitter.on('player-left', async ({ player }) => {
          await stream.writeSSE({
            data: JSON.stringify({
              player,
            }),
            event: 'player-left',
          });
        });

        room.emitter.on('start', async () => {
          await stream.writeSSE({
            data: '',
            event: 'start',
          });
        });

        room.emitter.on('game-stopped', async ({ player }) => {
          await stream.writeSSE({
            data: JSON.stringify({
              player,
            }),
            event: 'player-join',
          });
        });

        room.emitter.on('room-closed', async () => {
          shouldClose = true;
          await stream.writeSSE({
            data: '',
            event: 'player-join',
          });
        });

        while (true) {
          if (shouldClose) {
            break;
          }
          await stream.sleep(1000);
        }
      });
    },
  );

export const app = middlewares.route('/', routes);

export type Api = typeof app;

export default {
  port: Number.parseInt(process.env.API_PORT!) || 3000,
  fetch: app.fetch,
};
