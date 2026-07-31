import type { Game } from '../core/types';
import { DinoGame } from './dino';
import { OrbitDodgerGame } from './orbit-dodger';

export type GameFactory = () => Game;

const registry = new Map<string, GameFactory>([
  ['dino-runner', () => new DinoGame()],
  ['orbit-dodger', () => new OrbitDodgerGame()],
]);

/** Registers a custom game factory under `id`, enabling `game: id` in config. */
export function registerGame(id: string, factory: GameFactory): void {
  registry.set(id, factory);
}

export function createGame(id: string): Game {
  const factory = registry.get(id);
  if (!factory) {
    throw new Error(
      `boredload: unknown game "${id}". Registered games: ${[...registry.keys()].join(', ')}`,
    );
  }
  return factory();
}

export function hasGame(id: string): boolean {
  return registry.has(id);
}
