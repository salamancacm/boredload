import { describe, expect, it } from 'vitest';
import { moveFallers, nextSpawnDelay, shouldSpawn, spawnFaller } from './fallers';
import { mulberry32 } from '../shared/rng';

describe('nextSpawnDelay', () => {
  it('produces a deterministic value for a given seed', () => {
    const rng1 = mulberry32(42);
    const rng2 = mulberry32(42);
    expect(nextSpawnDelay(rng1, 90, 90)).toBe(nextSpawnDelay(rng2, 90, 90));
  });

  it('shrinks the delay as fall speed increases relative to base speed', () => {
    const delayAtBase = nextSpawnDelay(mulberry32(1), 90, 90);
    const delayAtDouble = nextSpawnDelay(mulberry32(1), 180, 90);
    expect(delayAtDouble).toBeLessThanOrEqual(delayAtBase);
  });
});

describe('spawnFaller', () => {
  it('spawns above the top of the viewport', () => {
    const rng = mulberry32(1);
    const faller = spawnFaller(rng, 400, 90);
    expect(faller.y).toBeLessThan(0);
    expect(faller.active).toBe(true);
    expect(faller.passed).toBe(false);
  });

  it('stays within the horizontal viewport bounds', () => {
    const rng = mulberry32(1);
    const faller = spawnFaller(rng, 400, 90);
    expect(faller.x).toBeGreaterThanOrEqual(0);
    expect(faller.x + faller.width).toBeLessThanOrEqual(400);
  });

  it('locks in a vy based on the fall speed at spawn time', () => {
    const rng = mulberry32(1);
    const faller = spawnFaller(rng, 400, 200);
    expect(faller.vy).toBeGreaterThan(0);
  });
});

describe('shouldSpawn', () => {
  it('is true once time reaches the delay', () => {
    expect(shouldSpawn(1, 1)).toBe(true);
    expect(shouldSpawn(0.9, 1)).toBe(false);
  });
});

describe('moveFallers', () => {
  it('advances each faller by its own vy * dt', () => {
    const fallers = [
      { x: 0, y: 0, width: 20, height: 20, vy: 100, active: true, passed: false },
    ];
    const moved = moveFallers(fallers, 0.5, 300);
    expect(moved[0]?.y).toBe(50);
  });

  it('drops fallers once they fall past the bottom of the viewport', () => {
    const fallers = [
      { x: 0, y: 400, width: 20, height: 20, vy: 100, active: true, passed: false },
    ];
    const moved = moveFallers(fallers, 1, 300);
    expect(moved.length).toBe(0);
  });
});
