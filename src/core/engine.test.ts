import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GameEngine } from './engine';
import type { Game, GameInitContext, InputState } from './types';

function makeNoopGame(): Game<{ ticks: number }> {
  return {
    id: 'noop',
    init(_ctx: GameInitContext) {
      return { ticks: 0 };
    },
    update(state, _dt, _input: InputState) {
      return { ticks: state.ticks + 1 };
    },
    render() {
      // no-op
    },
    destroy() {
      // no-op
    },
    getScore(state) {
      return state.ticks;
    },
    isGameOver() {
      return false;
    },
  };
}

describe('GameEngine', () => {
  let canvas: HTMLCanvasElement;
  let rafSpy: ReturnType<typeof vi.spyOn>;
  let cafSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    document.body.appendChild(canvas);
    rafSpy = vi.spyOn(window, 'requestAnimationFrame');
    cafSpy = vi.spyOn(window, 'cancelAnimationFrame');
  });

  afterEach(() => {
    canvas.remove();
    rafSpy.mockRestore();
    cafSpy.mockRestore();
  });

  it('start() requests an animation frame', () => {
    const engine = new GameEngine({ canvas, game: makeNoopGame(), width: 300, height: 150 });
    engine.start();
    expect(rafSpy).toHaveBeenCalled();
    engine.destroy();
  });

  it('stop() cancels the pending frame', () => {
    const engine = new GameEngine({ canvas, game: makeNoopGame(), width: 300, height: 150 });
    engine.start();
    engine.stop();
    expect(cafSpy).toHaveBeenCalled();
    engine.destroy();
  });

  it('destroy() is idempotent', () => {
    const engine = new GameEngine({ canvas, game: makeNoopGame(), width: 300, height: 150 });
    engine.start();
    expect(() => {
      engine.destroy();
      engine.destroy();
    }).not.toThrow();
  });

  it('start() after destroy() does nothing', () => {
    const engine = new GameEngine({ canvas, game: makeNoopGame(), width: 300, height: 150 });
    engine.destroy();
    rafSpy.mockClear();
    engine.start();
    expect(rafSpy).not.toHaveBeenCalled();
  });

  it('getScore() delegates to the game', () => {
    const engine = new GameEngine({ canvas, game: makeNoopGame(), width: 300, height: 150 });
    expect(engine.getScore()).toBe(0);
    engine.destroy();
  });

  it('resize() updates the canvas backing size', () => {
    const engine = new GameEngine({ canvas, game: makeNoopGame(), width: 300, height: 150 });
    engine.resize(400, 200);
    expect(canvas.style.width).toBe('400px');
    expect(canvas.style.height).toBe('200px');
    engine.destroy();
  });

  it('persists a new high score and a later engine picks it up', () => {
    rafSpy.mockRestore();
    cafSpy.mockRestore();
    vi.useFakeTimers();
    const key = 'boredload:engine-test-highscore';
    window.localStorage.removeItem(key);

    const engineA = new GameEngine({
      canvas,
      game: makeNoopGame(),
      width: 300,
      height: 150,
      highScoreKey: key,
    });
    expect(engineA.getHighScore()).toBe(0);
    engineA.start();
    vi.advanceTimersByTime(16 * 5); // a handful of ticks
    engineA.destroy();
    expect(engineA.getHighScore()).toBeGreaterThan(0);

    const engineB = new GameEngine({
      canvas,
      game: makeNoopGame(),
      width: 300,
      height: 150,
      highScoreKey: key,
    });
    expect(engineB.getHighScore()).toBe(engineA.getHighScore());
    engineB.destroy();

    vi.useRealTimers();
    rafSpy = vi.spyOn(window, 'requestAnimationFrame');
    cafSpy = vi.spyOn(window, 'cancelAnimationFrame');
  });

  it('does not persist when persistHighScore is false', () => {
    vi.useFakeTimers();
    const key = 'boredload:engine-test-nopersist';
    window.localStorage.removeItem(key);

    const engine = new GameEngine({
      canvas,
      game: makeNoopGame(),
      width: 300,
      height: 150,
      highScoreKey: key,
      persistHighScore: false,
    });
    engine.start();
    vi.advanceTimersByTime(16 * 5);
    engine.destroy();

    expect(window.localStorage.getItem(key)).toBeNull();
    vi.useRealTimers();
  });
});
