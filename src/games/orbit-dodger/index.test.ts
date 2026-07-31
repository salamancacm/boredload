import { beforeEach, describe, expect, it } from 'vitest';
import { OrbitDodgerGame } from './index';
import { ORBIT_DEFAULT_THEME } from './theme';
import type { InputState } from '../../core/types';

const noInput: InputState = { primaryActionDown: false, primaryActionPressed: false };
const restartInput: InputState = { primaryActionDown: true, primaryActionPressed: true };

function makeGame(seed = 1) {
  const game = new OrbitDodgerGame();
  const canvas = document.createElement('canvas');
  const state = game.init({
    canvas,
    viewport: { width: 400, height: 300, dpr: 1 },
    theme: ORBIT_DEFAULT_THEME,
    seed,
  });
  return { game, state };
}

describe('OrbitDodgerGame', () => {
  let ctx: CanvasRenderingContext2D;
  beforeEach(() => {
    ctx = document.createElement('canvas').getContext('2d') as CanvasRenderingContext2D;
  });

  it('starts running, centered, with no fallers', () => {
    const { state } = makeGame();
    expect(state.status).toBe('running');
    expect(state.fallers).toHaveLength(0);
    expect(state.ship.x).toBeGreaterThan(0);
  });

  it('moves the ship via keyboard heldDirection', () => {
    const { game, state } = makeGame();
    const next = game.update(state, 0.1, { ...noInput, heldDirection: 1 });
    expect(next.ship.x).toBeGreaterThan(state.ship.x);
  });

  it('moves the ship via pointerX', () => {
    const { game, state } = makeGame();
    const next = game.update(state, 0.016, { ...noInput, pointerX: 10 });
    expect(next.ship.x).toBeLessThan(state.ship.x);
  });

  it('increments score over time while running', () => {
    const { game, state } = makeGame();
    const next = game.update(state, 1, noInput);
    expect(next.score).toBeGreaterThan(state.score);
  });

  it('spawns fallers as time accumulates', () => {
    const { game } = makeGame();
    let { state } = makeGame();
    for (let i = 0; i < 100; i++) {
      state = game.update(state, 0.05, noInput);
    }
    expect(state.fallers.length).toBeGreaterThan(0);
  });

  it('transitions to gameover on collision and getScore/isGameOver reflect it', () => {
    const { game } = makeGame();
    let state = makeGame().state;
    state = {
      ...state,
      fallers: [
        {
          x: state.ship.x,
          y: state.ship.y,
          width: state.ship.width,
          height: state.ship.height,
          vy: 90,
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

  it('does not update further once gameover, until restart input', () => {
    const { game, state: initial } = makeGame();
    const gameOverState = { ...initial, status: 'gameover' as const };
    const stillOver = game.update(gameOverState, 1, noInput);
    expect(stillOver.status).toBe('gameover');

    const restarted = game.update(gameOverState, 1, restartInput);
    expect(restarted.status).toBe('running');
  });

  it('seeds and tracks bestScore live from ctx.highScore', () => {
    const game = new OrbitDodgerGame();
    const canvas = document.createElement('canvas');
    const state = game.init({
      canvas,
      viewport: { width: 400, height: 300, dpr: 1 },
      theme: ORBIT_DEFAULT_THEME,
      seed: 1,
      highScore: 50,
    });
    expect(state.bestScore).toBe(50);
    const next = game.update(state, 10, noInput);
    expect(next.bestScore).toBeGreaterThanOrEqual(50);
  });

  it('render does not throw against the canvas stub', () => {
    const { game, state } = makeGame();
    expect(() => game.render(ctx, state, { width: 400, height: 300, dpr: 1 })).not.toThrow();
  });
});
