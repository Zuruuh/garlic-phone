import { Hono } from 'hono';
import { vValidator as valibot } from '@hono/valibot-validator';
import * as v from 'valibot';
import { nanoid } from 'nanoid';
import { players } from '../stores';
import { PlayerId } from '../validators';
import { bearerAuth } from 'hono/bearer-auth';

export default new Hono()
  .post(
    '/register',
    valibot(
      'json',
      v.object({
        name: v.string([
          v.minLength(2),
          v.custom((name) => !players.has(name)),
        ]),
      }),
    ),
    (c) => {
      const { name: player } = c.req.valid('json');
      const id = nanoid().replace('-', '_');

      players.set(id, player);

      return c.newResponse(id, 200);
    },
  )
  .get('/session', valibot('json', v.object({ id: PlayerId })), (c) =>
    c.newResponse(null, 204),
  )
  .get('/players', bearerAuth({ token: 'yes' }), (c) =>
    c.json(Object.fromEntries(players.entries())),
  );
