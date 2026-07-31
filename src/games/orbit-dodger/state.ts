import { mulberry32, type Rng } from '../shared/rng';

export interface Ship {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Faller {
  x: number;
  y: number;
  width: number;
  height: number;
  /** Fixed at spawn time so the difficulty ramp doesn't retroactively speed up obstacles already falling. */
  vy: number;
  active: boolean;
  passed: boolean;
  /** Purely cosmetic shape variant (0 = single gem, 1 = shard cluster). Defaults to 0. */
  variant?: number;
}

export type GameStatus = 'running' | 'gameover';

export type { Rng } from '../shared/rng';
export { mulberry32 } from '../shared/rng';

export interface OrbitState {
  ship: Ship;
  fallers: Faller[];
  viewportWidth: number;
  viewportHeight: number;
  fallSpeed: number;
  elapsed: number;
  score: number;
  /** Best score seen so far this session, seeded from a persisted high score if any. */
  bestScore: number;
  status: GameStatus;
  rng: Rng;
  timeSinceSpawn: number;
}

export const SHIP_WIDTH = 28;
export const SHIP_HEIGHT = 28;
export const SHIP_BOTTOM_MARGIN = 18;
export const BASE_FALL_SPEED = 90;

export function createInitialState(
  width: number,
  height: number,
  seed = Date.now(),
  bestScore = 0,
): OrbitState {
  return {
    ship: {
      x: width / 2 - SHIP_WIDTH / 2,
      y: height - SHIP_BOTTOM_MARGIN - SHIP_HEIGHT,
      width: SHIP_WIDTH,
      height: SHIP_HEIGHT,
    },
    fallers: [],
    viewportWidth: width,
    viewportHeight: height,
    fallSpeed: BASE_FALL_SPEED,
    elapsed: 0,
    score: 0,
    bestScore,
    status: 'running',
    rng: mulberry32(seed),
    timeSinceSpawn: 0,
  };
}
