import { describe, expect, it } from 'vitest';
import { applyJump, GRAVITY, JUMP_VELOCITY, stepPlayer } from './physics';
import type { Player } from './state';

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    x: 0,
    y: 100,
    width: 32,
    height: 32,
    vy: 0,
    onGround: true,
    ...overrides,
  };
}

describe('applyJump', () => {
  it('applies jump velocity when grounded', () => {
    const player = makePlayer({ onGround: true });
    const jumped = applyJump(player);
    expect(jumped.vy).toBe(JUMP_VELOCITY);
    expect(jumped.onGround).toBe(false);
  });

  it('does nothing when airborne', () => {
    const player = makePlayer({ onGround: false, vy: -100 });
    const jumped = applyJump(player);
    expect(jumped).toBe(player);
  });
});

describe('stepPlayer', () => {
  it('applies gravity to velocity over dt', () => {
    const player = makePlayer({ onGround: false, y: 0, vy: -100 });
    const next = stepPlayer(player, 0.1, 1000);
    expect(next.vy).toBeCloseTo(-100 + GRAVITY * 0.1);
  });

  it('lands and clamps to the ground', () => {
    const groundY = 200;
    const player = makePlayer({ onGround: false, y: 195, vy: 500 });
    const next = stepPlayer(player, 0.1, groundY);
    expect(next.onGround).toBe(true);
    expect(next.vy).toBe(0);
    expect(next.y).toBe(groundY - player.height);
  });

  it('stays airborne mid-fall', () => {
    const groundY = 500;
    const player = makePlayer({ onGround: false, y: 0, vy: 0 });
    const next = stepPlayer(player, 0.05, groundY);
    expect(next.onGround).toBe(false);
    expect(next.y).toBeGreaterThan(0);
  });
});
