import { describe, expect, it } from 'vitest';
import { moveObstacles, nextSpawnGap, shouldSpawn, spawnObstacle } from './obstacles';
import { mulberry32 } from './state';

describe('nextSpawnGap', () => {
  it('produces a deterministic value for a given seed', () => {
    const rng1 = mulberry32(42);
    const rng2 = mulberry32(42);
    expect(nextSpawnGap(rng1, 220, 220)).toBe(nextSpawnGap(rng2, 220, 220));
  });

  it('shrinks the gap as speed increases relative to base speed', () => {
    const gapAtBase = nextSpawnGap(mulberry32(1), 220, 220);
    const gapAtDouble = nextSpawnGap(mulberry32(1), 440, 220);
    expect(gapAtDouble).toBeLessThanOrEqual(gapAtBase);
  });
});

describe('spawnObstacle', () => {
  it('spawns just past the right edge of the viewport', () => {
    const rng = mulberry32(1);
    const obstacle = spawnObstacle(rng, 300, 800);
    expect(obstacle.x).toBeGreaterThan(800);
    expect(obstacle.active).toBe(true);
    expect(obstacle.passed).toBe(false);
  });

  it('rests on the ground line', () => {
    const rng = mulberry32(1);
    const groundY = 300;
    const obstacle = spawnObstacle(rng, groundY, 800);
    expect(obstacle.y + obstacle.height).toBe(groundY);
  });
});

describe('shouldSpawn', () => {
  it('is true once distance reaches the gap', () => {
    expect(shouldSpawn(100, 100)).toBe(true);
    expect(shouldSpawn(99, 100)).toBe(false);
  });
});

describe('moveObstacles', () => {
  it('moves obstacles left by speed * dt', () => {
    const obstacles = [{ x: 100, y: 0, width: 20, height: 20, active: true, passed: false }];
    const moved = moveObstacles(obstacles, 100, 0.5);
    expect(moved[0]?.x).toBe(50);
  });

  it('drops obstacles once they are far off-screen', () => {
    const obstacles = [{ x: -100, y: 0, width: 20, height: 20, active: true, passed: false }];
    const moved = moveObstacles(obstacles, 100, 1);
    expect(moved.length).toBe(0);
  });
});
