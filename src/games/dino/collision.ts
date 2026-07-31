import { intersects, type AABB } from '../shared/collision';
import type { Obstacle, Player } from './state';

export type { AABB } from '../shared/collision';
export { intersects } from '../shared/collision';

/** Player hitbox shrunk to ~85% for a slightly more forgiving feel. */
const PLAYER_HITBOX_SCALE = 0.85;

export function getPlayerHitbox(player: Player): AABB {
  const shrinkW = player.width * (1 - PLAYER_HITBOX_SCALE);
  const shrinkH = player.height * (1 - PLAYER_HITBOX_SCALE);
  return {
    x: player.x + shrinkW / 2,
    y: player.y + shrinkH / 2,
    width: player.width - shrinkW,
    height: player.height - shrinkH,
  };
}

/** Returns true if the player's hitbox collides with any active obstacle. */
export function checkCollisions(player: Player, obstacles: Obstacle[]): boolean {
  const hitbox = getPlayerHitbox(player);
  return obstacles.some((o) => o.active && intersects(hitbox, o));
}
