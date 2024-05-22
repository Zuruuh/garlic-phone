import { Hono } from 'hono';
import rooms from './routes/rooms';
import players from './routes/players';

export const routes = new Hono().route('/', players).route('/', rooms);
