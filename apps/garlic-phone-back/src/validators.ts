import { players, rooms } from './stores';
import * as v from 'valibot';

export const PlayerId = v.transform(
  v.string([v.length(21), v.custom((id) => players.has(id))]),
  (id) => players.get(id)!,
);

export const RoomId = v.transform(
  v.string([v.length(21), v.custom((id) => rooms.has(id))]),
  (id) => rooms.get(id)!,
);
