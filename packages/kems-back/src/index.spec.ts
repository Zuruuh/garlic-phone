import { players, rooms } from './index';
import { expect, test, beforeEach } from 'bun:test';
import { createRoom, joinRoom, leaveRoom, login } from './tests/utils';

beforeEach(() => {
  players.clear();
  rooms.clear();
});

test('I can login', async () => {
  expect(players.size).toBe(0);
  await login('zuruh');
  expect(players.size).toBe(1);
});

test('I can create a room', async () => {
  const playerId = await login('zuruh');
  expect(rooms.size).toBe(0);
  await createRoom(playerId, 'feur');
  expect(rooms.size).toBe(1);
});

test('I cannot join my own room', async () => {
  const playerId = await login('zuruh');
  expect(rooms.size).toBe(0);
  const roomId = await createRoom(playerId, 'feur');
  const res = await joinRoom(playerId, roomId);

  expect(rooms.size).toBe(1);
  expect(rooms.has(roomId)).toBeTrue();
  expect(rooms.get(roomId)?.players.size).toBe(1);
  expect(rooms.get(roomId)?.players.has('zuruh')).toBeTrue();
  expect(res.status).toBe(400);
});

test("I can join someone else's room", async () => {
  const ownerId = await login('zuruh');
  const playerId = await login('ruzuh');
  const roomId = await createRoom(ownerId, 'feur');
  const res = await joinRoom(playerId, roomId);

  expect(rooms.size).toBe(1);
  expect(rooms.has(roomId)).toBeTrue();
  expect(rooms.get(roomId)?.players.size).toBe(2);
  expect(rooms.get(roomId)?.players.has('zuruh')).toBeTrue();
  expect(rooms.get(roomId)?.players.has('ruzuh')).toBeTrue();

  expect(res.status).toBe(200);
  expect(await res.text()).toBe('feur');
});

test('I can close my own room', async () => {
  const playerId = await login('zuruh');
  const roomId = await createRoom(playerId, 'feur');
  const res = await leaveRoom(playerId, roomId);

  expect(rooms.get(roomId)?.players.size).toBe(0);

  expect(res.status).toBe(204);
});

test('I cannot leave a room I am not in', async () => {
  const ownerId = await login('zuruh');
  const playerId = await login('ruzuh');
  const roomId = await createRoom(ownerId, 'feur');
  const res = await leaveRoom(playerId, roomId);

  expect(res.status).toBe(400);
  expect(await res.text()).toBe('You are not a player of this room!');
});
