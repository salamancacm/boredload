import { describe, expect, it } from 'vitest';
import { checkCollisions, getShipHitbox } from './collision';
import type { Faller, Ship } from './state';

function makeShip(overrides: Partial<Ship> = {}): Ship {
  return { x: 0, y: 0, width: 32, height: 32, ...overrides };
}

function makeFaller(overrides: Partial<Faller> = {}): Faller {
  return { x: 100, y: 0, width: 20, height: 20, vy: 90, active: true, passed: false, ...overrides };
}

describe('getShipHitbox', () => {
  it('shrinks the hitbox relative to the ship box', () => {
    const ship = makeShip({ width: 40, height: 40 });
    const hitbox = getShipHitbox(ship);
    expect(hitbox.width).toBeLessThan(ship.width);
    expect(hitbox.height).toBeLessThan(ship.height);
    expect(hitbox.x).toBeGreaterThan(ship.x);
    expect(hitbox.y).toBeGreaterThan(ship.y);
  });
});

describe('checkCollisions', () => {
  it('returns true when the ship overlaps an active faller', () => {
    const ship = makeShip({ x: 95, y: 0 });
    expect(checkCollisions(ship, [makeFaller({ x: 100, y: 0 })])).toBe(true);
  });

  it('ignores inactive fallers', () => {
    const ship = makeShip({ x: 95, y: 0 });
    expect(checkCollisions(ship, [makeFaller({ x: 100, y: 0, active: false })])).toBe(false);
  });

  it('returns false when nothing overlaps', () => {
    const ship = makeShip({ x: 0, y: 0 });
    expect(checkCollisions(ship, [makeFaller({ x: 500, y: 500 })])).toBe(false);
  });
});
