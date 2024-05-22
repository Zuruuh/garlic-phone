import { Hono } from 'hono';
import { vValidator as valibot } from '@hono/valibot-validator';
import { streamSSE } from 'hono/streaming';
import { PlayerId, RoomId } from '../validators';
import * as v from 'valibot';
import { IS_PROD } from '../constants';
import { rooms } from '../stores';
import { Room } from '../models/room';
import { nanoid } from 'nanoid';

export default new Hono()
  .get('/rooms', (c) => c.json(rooms.entries()))
  .post(
    '/rooms',
    valibot('header', v.object({ 'x-player': PlayerId })),
    valibot('json', v.object({ roomName: v.string([v.minLength(2)]) })),
    (c) => {
      if (rooms.size >= 4 && IS_PROD) {
        return c.text('Max rooms limit reached', 400);
      }

      const { 'x-player': player } = c.req.valid('header');
      const { roomName } = c.req.valid('json');

      const roomId = nanoid().replace('-', '_');
      rooms.set(roomId, new Room(roomName, player));

      return c.text(roomId);
    },
  )
  .post(
    '/rooms/:room/join',
    valibot('header', v.object({ 'x-player': PlayerId })),
    valibot('param', v.object({ room: RoomId })),
    (c) => {
      const { room } = c.req.valid('param');
      const { 'x-player': player } = c.req.valid('header');

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
    valibot('header', v.object({ 'x-player': PlayerId, 'x-room': RoomId })),
    (c) => {
      const { 'x-player': player, 'x-room': room } = c.req.valid('header');

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
    valibot('header', v.object({ 'x-player': PlayerId, 'x-room': RoomId })),
    (c) => {
      const { 'x-player': player, 'x-room': room } = c.req.valid('header');

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
    valibot('header', v.object({ 'x-player': PlayerId, 'x-room': RoomId })),
    async (c) => {
      const { 'x-room': room, 'x-player': player } = c.req.valid('header');

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
