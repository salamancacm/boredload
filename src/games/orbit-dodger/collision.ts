import { intersects, type AABB } from '../shared/collision';
import type { Faller, Ship } from './state';

/** Ship hitbox shrunk to ~85% for a slightly more forgiving feel (matches dino-runner). */
const SHIP_HITBOX_SCALE = 0.85;

export function getShipHitbox(ship: Ship): AABB {
  const shrinkW = ship.width * (1 - SHIP_HITBOX_SCALE);
  const shrinkH = ship.height * (1 - SHIP_HITBOX_SCALE);
  return {
    x: ship.x + shrinkW / 2,
    y: ship.y + shrinkH / 2,
    width: ship.width - shrinkW,
    height: ship.height - shrinkH,
  };
}

/** Returns true if the ship's hitbox collides with any active faller. */
export function checkCollisions(ship: Ship, fallers: Faller[]): boolean {
  const hitbox = getShipHitbox(ship);
  return fallers.some((f) => f.active && intersects(hitbox, f));
}
