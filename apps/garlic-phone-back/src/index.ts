import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { poweredBy } from 'hono/powered-by';

import type { Serve } from 'bun';
import { IS_PROD } from './constants';
import { routes } from './router';
import { websocket } from './websocket';

const middlewares = new Hono().use(cors(/*TODO*/)).use(poweredBy());

if (process.env.NODE_ENV !== 'test') {
  middlewares.use(logger());
}

if (IS_PROD) {
  middlewares.use(secureHeaders());
}

export const app = middlewares.route('/', routes);
export type Api = typeof app;

export default {
  development: !IS_PROD,
  port: Number.parseInt(process.env.API_PORT!) || 3000,
  fetch: app.fetch,
  websocket,
  // biome-ignore lint/suspicious/noExplicitAny: too lazy to get this right
} satisfies Serve<any>;
