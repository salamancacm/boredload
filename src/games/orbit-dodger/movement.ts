import type { InputState } from '../../core/types';
import type { Ship } from './state';

export const SHIP_SPEED = 260; // px/s, keyboard-held-direction movement

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Steps the ship's horizontal position for one frame. Pure function.
 * A pointer/touch position (if active) wins over keyboard-held direction —
 * "follow the pointer" is meant to be direct and immediate, with no easing.
 */
export function stepShip(
  ship: Ship,
  dt: number,
  input: InputState,
  viewportWidth: number,
): Ship {
  const minX = 0;
  const maxX = viewportWidth - ship.width;

  if (input.pointerX !== undefined) {
    const x = clamp(input.pointerX - ship.width / 2, minX, maxX);
    return { ...ship, x };
  }

  if (input.heldDirection) {
    const x = clamp(ship.x + input.heldDirection * SHIP_SPEED * dt, minX, maxX);
    return { ...ship, x };
  }

  return ship;
}
