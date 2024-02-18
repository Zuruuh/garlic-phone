import { EventEmitter } from 'node:events';
import type TypedEmitter from 'typed-emitter';

export type Events = {
  'player-join': (data: { player: string }) => void;
  'player-left': (data: { player: string }) => void;
  'room-closed': (data: Record<string, never>) => void;
  'game-stopped': (data: { player: string }) => void;
  start: (data: Record<string, never>) => void;
};

export class Room {
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
