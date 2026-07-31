import { describe, expect, it } from 'vitest';
import { SHIP_SPEED, stepShip } from './movement';
import type { Ship } from './state';
import type { InputState } from '../../core/types';

function makeShip(overrides: Partial<Ship> = {}): Ship {
  return { x: 100, y: 200, width: 28, height: 28, ...overrides };
}

const noInput: InputState = { primaryActionDown: false, primaryActionPressed: false };

describe('stepShip', () => {
  it('does nothing with no input', () => {
    const ship = makeShip();
    expect(stepShip(ship, 0.1, noInput, 400)).toEqual(ship);
  });

  it('moves right at a constant speed when heldDirection is 1', () => {
    const ship = makeShip({ x: 100 });
    const next = stepShip(ship, 0.1, { ...noInput, heldDirection: 1 }, 400);
    expect(next.x).toBeCloseTo(100 + SHIP_SPEED * 0.1);
  });

  it('moves left at a constant speed when heldDirection is -1', () => {
    const ship = makeShip({ x: 100 });
    const next = stepShip(ship, 0.1, { ...noInput, heldDirection: -1 }, 400);
    expect(next.x).toBeCloseTo(100 - SHIP_SPEED * 0.1);
  });

  it('clamps keyboard movement at the left edge', () => {
    const ship = makeShip({ x: 1 });
    const next = stepShip(ship, 1, { ...noInput, heldDirection: -1 }, 400);
    expect(next.x).toBe(0);
  });

  it('clamps keyboard movement at the right edge', () => {
    const ship = makeShip({ x: 370, width: 28 });
    const next = stepShip(ship, 1, { ...noInput, heldDirection: 1 }, 400);
    expect(next.x).toBe(400 - ship.width);
  });

  it('pointerX snaps the ship directly, centered on the pointer', () => {
    const ship = makeShip({ x: 0, width: 28 });
    const next = stepShip(ship, 0.1, { ...noInput, pointerX: 200 }, 400);
    expect(next.x).toBe(200 - ship.width / 2);
  });

  it('pointerX takes priority over heldDirection when both are present', () => {
    const ship = makeShip({ x: 100, width: 28 });
    const next = stepShip(
      ship,
      0.1,
      { ...noInput, pointerX: 50, heldDirection: 1 },
      400,
    );
    expect(next.x).toBe(50 - ship.width / 2);
  });

  it('clamps pointerX-driven movement to the viewport bounds', () => {
    const ship = makeShip({ width: 28 });
    const left = stepShip(ship, 0.1, { ...noInput, pointerX: -50 }, 400);
    expect(left.x).toBe(0);
    const right = stepShip(ship, 0.1, { ...noInput, pointerX: 900 }, 400);
    expect(right.x).toBe(400 - ship.width);
  });
});
