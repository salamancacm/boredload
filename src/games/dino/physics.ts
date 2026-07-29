import type { Player } from './state';

export const GRAVITY = 1400;
export const JUMP_VELOCITY = -520;

/** Applies a jump impulse if the player is grounded. Pure function. */
export function applyJump(player: Player): Player {
  if (!player.onGround) return player;
  return { ...player, vy: JUMP_VELOCITY, onGround: false };
}

/**
 * Steps player vertical physics by `dt` seconds: applies gravity, integrates
 * velocity/position, and clamps to `groundY` on landing. Pure function.
 */
export function stepPlayer(player: Player, dt: number, groundY: number): Player {
  let vy = player.vy + GRAVITY * dt;
  let y = player.y + vy * dt;

  const floorY = groundY - player.height;
  let onGround = false;

  if (y >= floorY) {
    y = floorY;
    vy = 0;
    onGround = true;
  }

  return { ...player, y, vy, onGround };
}
