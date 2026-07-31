import type { Rng } from '../shared/rng';
import type { Faller } from './state';

export const MIN_SPAWN_DELAY_SEC = 0.5;
export const MAX_SPAWN_DELAY_SEC = 1.3;
export const FALLER_WIDTH_MIN = 18;
export const FALLER_WIDTH_MAX = 34;
export const FALLER_HEIGHT_MIN = 18;
export const FALLER_HEIGHT_MAX = 34;
export const FALL_SPEED_JITTER = 40; // px/s, +/- range added to the current fallSpeed at spawn

/**
 * Computes the next spawn delay in seconds. Delay shrinks as `fallSpeed`
 * grows (relative to the base speed) for progressive difficulty, clamped
 * to a sane minimum so fallers never spawn on top of each other.
 */
export function nextSpawnDelay(rng: Rng, fallSpeed: number, baseFallSpeed: number): number {
  const difficultyFactor = Math.min(1, baseFallSpeed / fallSpeed);
  const min = MIN_SPAWN_DELAY_SEC * difficultyFactor;
  const max = MAX_SPAWN_DELAY_SEC * difficultyFactor;
  const range = Math.max(0, max - min);
  return min + rng() * range;
}

export function spawnFaller(rng: Rng, viewportWidth: number, fallSpeed: number): Faller {
  const width = FALLER_WIDTH_MIN + rng() * (FALLER_WIDTH_MAX - FALLER_WIDTH_MIN);
  const height = FALLER_HEIGHT_MIN + rng() * (FALLER_HEIGHT_MAX - FALLER_HEIGHT_MIN);
  const x = rng() * Math.max(0, viewportWidth - width);
  const vy = fallSpeed + (rng() * 2 - 1) * FALL_SPEED_JITTER;
  return {
    x,
    y: -height,
    width,
    height,
    vy: Math.max(20, vy),
    active: true,
    passed: false,
    variant: rng() < 0.5 ? 0 : 1,
  };
}

export function shouldSpawn(timeSinceSpawn: number, delay: number): boolean {
  return timeSinceSpawn >= delay;
}

/** Advances each faller by its own `vy * dt` and drops off-screen ones. */
export function moveFallers(fallers: Faller[], dt: number, viewportHeight: number): Faller[] {
  return fallers
    .map((f) => ({ ...f, y: f.y + f.vy * dt }))
    .filter((f) => f.y < viewportHeight + 50);
}
