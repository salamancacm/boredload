import type { Obstacle, Rng } from './state';

export const MIN_OBSTACLE_GAP_PX = 220;
export const MAX_OBSTACLE_GAP_PX = 420;
export const OBSTACLE_WIDTH = 20;
export const OBSTACLE_HEIGHT_MIN = 28;
export const OBSTACLE_HEIGHT_MAX = 52;

/**
 * Computes the next spawn gap in pixels. Gap shrinks as `speed` grows
 * (relative to the base speed) for progressive difficulty, clamped to a
 * sane minimum so obstacles never overlap.
 */
export function nextSpawnGap(rng: Rng, speed: number, baseSpeed: number): number {
  const difficultyFactor = Math.min(1, baseSpeed / speed);
  const min = MIN_OBSTACLE_GAP_PX * difficultyFactor;
  const max = MAX_OBSTACLE_GAP_PX * difficultyFactor;
  const range = Math.max(0, max - min);
  return min + rng() * range;
}

export function spawnObstacle(rng: Rng, groundY: number, viewportWidth: number): Obstacle {
  const height =
    OBSTACLE_HEIGHT_MIN + rng() * (OBSTACLE_HEIGHT_MAX - OBSTACLE_HEIGHT_MIN);
  return {
    x: viewportWidth + OBSTACLE_WIDTH,
    y: groundY - height,
    width: OBSTACLE_WIDTH,
    height,
    active: true,
    passed: false,
    variant: rng() < 0.5 ? 0 : 1,
  };
}

export function shouldSpawn(distanceSinceSpawn: number, gap: number): boolean {
  return distanceSinceSpawn >= gap;
}

/** Advances obstacles by `speed * dt` pixels and drops off-screen ones. */
export function moveObstacles(obstacles: Obstacle[], speed: number, dt: number): Obstacle[] {
  const delta = speed * dt;
  return obstacles
    .map((o) => ({ ...o, x: o.x - delta }))
    .filter((o) => o.x + o.width > -50);
}
