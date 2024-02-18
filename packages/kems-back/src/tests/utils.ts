import { app } from "../index";
import { expect } from 'bun:test';
import { parse as parseCookie, serialize as serializeCookie } from 'cookie';

export async function login(username: string): Promise<string> {
  const res = await app.request('/register', {
    method: 'post',
    body: JSON.stringify({ name: username }),
    headers: { 'content-type': 'application/json' },
  });

  expect(res.status).toBe(204);

  const cookies = res.headers
    .getSetCookie()
    .map((rawCookie) => parseCookie(rawCookie));
  expect(cookies.length).toBe(1);

  const [playerCookie] = cookies;

  expect(playerCookie.player).toBeString();
  expect(playerCookie.player.length).toBe(21);
  expect(playerCookie.Path).toBe('/');
  expect(playerCookie.SameSite).toBe('Strict');

  return playerCookie.player;
}

export async function createRoom(ownerId: string, name: string): Promise<string> {
  const res = await app.request('/rooms', {
    method: 'post',
    body: JSON.stringify({ roomName: name }),
    headers: {
      cookie: serializeCookie('player', ownerId),
      'content-type': 'application/json',
    },
  });

  expect(res.status).toBe(200);
  const roomId = await res.text();
  expect(roomId.length).toBe(21);

  return roomId;
}

export async function joinRoom(playerId: string, roomId: string): Promise<Response> {
  return app.request(`/rooms/${roomId}/join`, {
    method: 'post',
    headers: {
      cookie: serializeCookie('player', playerId),
    },
  });
}

export async function leaveRoom(playerId: string, roomId: string): Promise<Response> {
  return app.request(`/rooms/leave`, {
    method: 'post',
    headers: {
      cookie: serializeCookie('player', playerId)
        .concat('; ')
        .concat(serializeCookie('room', roomId)),
    },
  });
}
