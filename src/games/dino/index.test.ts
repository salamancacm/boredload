import { beforeEach, describe, expect, it } from 'vitest';
import { DinoGame } from './index';
import { DINO_DEFAULT_THEME } from './theme';
import type { InputState } from '../../core/types';

const noInput: InputState = { primaryActionDown: false, primaryActionPressed: false };
const jumpInput: InputState = { primaryActionDown: true, primaryActionPressed: true };

function makeGame(seed = 1) {
  const game = new DinoGame();
  const canvas = document.createElement('canvas');
  const state = game.init({
    canvas,
    viewport: { width: 800, height: 300, dpr: 1 },
    theme: DINO_DEFAULT_THEME,
    seed,
  });
  return { game, state };
}

describe('DinoGame', () => {
  let ctx: CanvasRenderingContext2D;
  beforeEach(() => {
    ctx = document.createElement('canvas').getContext('2d') as CanvasRenderingContext2D;
  });

  it('starts running with a grounded player and no obstacles', () => {
    const { state } = makeGame();
    expect(state.status).toBe('running');
    expect(state.player.onGround).toBe(true);
    expect(state.obstacles).toHaveLength(0);
  });

  it('jumps the player up off the ground', () => {
    const { game, state } = makeGame();
    const next = game.update(state, 0.016, jumpInput);
    expect(next.player.onGround).toBe(false);
    expect(next.player.vy).toBeLessThan(0);
  });

  it('increments score over time while running', () => {
    const { game, state } = makeGame();
    const next = game.update(state, 1, noInput);
    expect(next.score).toBeGreaterThan(state.score);
  });

  it('spawns obstacles as distance accumulates', () => {
    const { game } = makeGame();
    let state = makeGame().state;
    for (let i = 0; i < 500; i++) {
      state = game.update(state, 0.05, noInput);
    }
    expect(state.obstacles.length).toBeGreaterThan(0);
  });

  it('transitions to gameover on collision and getScore/isGameOver reflect it', () => {
    const { game } = makeGame();
    let state = makeGame().state;
    // Force an obstacle directly on top of the player to guarantee a hit.
    state = {
      ...state,
      obstacles: [
        {
          x: state.player.x,
          y: state.player.y,
          width: state.player.width,
          height: state.player.height,
          active: true,
          passed: false,
        },
      ],
    };
    const next = game.update(state, 0.016, noInput);
    expect(next.status).toBe('gameover');
    expect(game.isGameOver(next)).toBe(true);
    expect(typeof game.getScore(next)).toBe('number');
  });

  it('does not update player/obstacles further once gameover, until restart input', () => {
    const { game, state: initial } = makeGame();
    const gameOverState = { ...initial, status: 'gameover' as const };
    const stillOver = game.update(gameOverState, 1, noInput);
    expect(stillOver.status).toBe('gameover');

    const restarted = game.update(gameOverState, 1, jumpInput);
    expect(restarted.status).toBe('running');
  });

  it('render does not throw against the canvas stub', () => {
    const { game, state } = makeGame();
    expect(() => game.render(ctx, state, { width: 800, height: 300, dpr: 1 })).not.toThrow();
  });
});
