import { mulberry32, type Rng } from '../shared/rng';

export type { Rng } from '../shared/rng';
export { mulberry32 } from '../shared/rng';

export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  vy: number;
  onGround: boolean;
}

export interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  active: boolean;
  passed: boolean;
  /** Purely cosmetic shape variant (0 = single crystal, 1 = twin crystals). Defaults to 0. */
  variant?: number;
}

export type GameStatus = 'running' | 'gameover';

export interface DinoState {
  player: Player;
  obstacles: Obstacle[];
  groundY: number;
  speed: number;
  elapsed: number;
  score: number;
  /** Best score seen so far this session, seeded from a persisted high score if any. */
  bestScore: number;
  status: GameStatus;
  rng: Rng;
  distanceSinceSpawn: number;
}

export const GROUND_MARGIN = 24;
export const PLAYER_SIZE = 32;
export const BASE_SPEED = 220;

export function createInitialState(
  width: number,
  height: number,
  seed = Date.now(),
  bestScore = 0,
): DinoState {
  const groundY = height - GROUND_MARGIN;
  return {
    player: {
      x: 32,
      y: groundY - PLAYER_SIZE,
      width: PLAYER_SIZE,
      height: PLAYER_SIZE,
      vy: 0,
      onGround: true,
    },
    obstacles: [],
    groundY,
    speed: BASE_SPEED,
    elapsed: 0,
    score: 0,
    bestScore,
    status: 'running',
    rng: mulberry32(seed),
    distanceSinceSpawn: 0,
  };
}
