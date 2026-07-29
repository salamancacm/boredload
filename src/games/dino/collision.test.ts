import { describe, expect, it } from 'vitest';
import { checkCollisions, getPlayerHitbox, intersects } from './collision';
import type { Obstacle, Player } from './state';

function makePlayer(overrides: Partial<Player> = {}): Player {
  return { x: 0, y: 0, width: 32, height: 32, vy: 0, onGround: true, ...overrides };
}

function makeObstacle(overrides: Partial<Obstacle> = {}): Obstacle {
  return { x: 100, y: 0, width: 20, height: 40, active: true, passed: false, ...overrides };
}

describe('intersects', () => {
  it('detects overlap', () => {
    expect(intersects({ x: 0, y: 0, width: 10, height: 10 }, { x: 5, y: 5, width: 10, height: 10 })).toBe(true);
  });

  it('detects no overlap', () => {
    expect(intersects({ x: 0, y: 0, width: 10, height: 10 }, { x: 20, y: 20, width: 10, height: 10 })).toBe(false);
  });

  it('treats touching edges as non-overlapping', () => {
    expect(intersects({ x: 0, y: 0, width: 10, height: 10 }, { x: 10, y: 0, width: 10, height: 10 })).toBe(false);
  });
});

describe('getPlayerHitbox', () => {
  it('shrinks the hitbox relative to the player box', () => {
    const player = makePlayer({ x: 0, y: 0, width: 40, height: 40 });
    const hitbox = getPlayerHitbox(player);
    expect(hitbox.width).toBeLessThan(player.width);
    expect(hitbox.height).toBeLessThan(player.height);
    expect(hitbox.x).toBeGreaterThan(player.x);
    expect(hitbox.y).toBeGreaterThan(player.y);
  });
});

describe('checkCollisions', () => {
  it('returns true when player overlaps an active obstacle', () => {
    const player = makePlayer({ x: 95, y: 0 });
    const obstacles = [makeObstacle({ x: 100, y: 0 })];
    expect(checkCollisions(player, obstacles)).toBe(true);
  });

  it('ignores inactive obstacles', () => {
    const player = makePlayer({ x: 95, y: 0 });
    const obstacles = [makeObstacle({ x: 100, y: 0, active: false })];
    expect(checkCollisions(player, obstacles)).toBe(false);
  });

  it('returns false when nothing overlaps', () => {
    const player = makePlayer({ x: 0, y: 0 });
    const obstacles = [makeObstacle({ x: 500, y: 0 })];
    expect(checkCollisions(player, obstacles)).toBe(false);
  });
});
