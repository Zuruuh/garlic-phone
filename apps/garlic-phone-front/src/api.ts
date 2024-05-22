import type { Api } from 'garlic-phone-back';
import { hc } from 'hono/client';

export const api = hc<Api>('http://localhost:8000');
