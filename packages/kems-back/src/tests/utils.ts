import { app } from '../index';
import { expect } from 'bun:test';

export async function login(username: string): Promise<string> {
  const res = await app.request('/register', {
    method: 'post',
    body: JSON.stringify({ name: username }),
    headers: { 'content-type': 'application/json' },
  });

  expect(res.status).toBe(200);

  const playerId = await res.text();
  expect(playerId.length).toBe(21);

  return playerId;
}

export async function createRoom(
  ownerId: string,
  name: string,
): Promise<string> {
  const res = await app.request('/rooms', {
    method: 'post',
    body: JSON.stringify({ roomName: name }),
    headers: {
      'x-player': ownerId,
      'content-type': 'application/json',
    },
  });

  expect(res.status).toBe(200);
  const roomId = await res.text();
  expect(roomId.length).toBe(21);

  return roomId;
}

export async function joinRoom(
  playerId: string,
  roomId: string,
): Promise<Response> {
  return app.request(`/rooms/${roomId}/join`, {
    method: 'post',
    headers: {
      'x-player': playerId,
    },
  });
}

export async function leaveRoom(
  playerId: string,
  roomId: string,
): Promise<Response> {
  return app.request('/rooms/leave', {
    method: 'post',
    headers: {
      'x-player': playerId,
      'x-room': roomId,
    },
  });
}
