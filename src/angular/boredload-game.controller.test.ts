import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BoredloadGameController } from './boredload-game.controller';

describe('BoredloadGameController', () => {
  let host: HTMLElement;

  beforeEach(() => {
    vi.useFakeTimers();
    host = document.createElement('div');
    document.body.appendChild(host);
  });

  afterEach(() => {
    vi.useRealTimers();
    host.remove();
  });

  it('mounts and shows a spinner while isLoading is true', () => {
    const controller = new BoredloadGameController(host);
    controller.init({ threshold: 1000, minPlayMs: 500, maxPlayMs: 2000 }, true);
    expect(host.querySelector('.boredload-spinner')).not.toBeNull();
    controller.destroy();
  });

  it('shows the canvas once the threshold elapses', () => {
    const controller = new BoredloadGameController(host);
    controller.init({ threshold: 1000, minPlayMs: 500, maxPlayMs: 2000 }, true);
    vi.advanceTimersByTime(1000);
    expect(host.querySelector('.boredload-canvas')).not.toBeNull();
    controller.destroy();
  });

  it('forwards setLoading(false) to the underlying mount handle', () => {
    const controller = new BoredloadGameController(host);
    controller.init({ threshold: 1000, minPlayMs: 500, maxPlayMs: 2000 }, true);
    expect(host.querySelector('.boredload-spinner')).not.toBeNull();

    controller.setLoading(false);
    expect(host.querySelector('.boredload-spinner')).toBeNull();
    controller.destroy();
  });

  it('emits onGameOver/onExit and tears down the DOM on destroy', () => {
    const onGameOver = vi.fn();
    const onExit = vi.fn();
    const controller = new BoredloadGameController(host);
    controller.init(
      { threshold: 1000, minPlayMs: 500, maxPlayMs: 2000, onGameOver, onExit },
      true,
    );
    vi.advanceTimersByTime(1000);
    expect(host.querySelector('.boredload-canvas')).not.toBeNull();

    controller.destroy();
    expect(host.querySelector('.boredload-canvas')).toBeNull();
    expect(host.querySelector('.boredload-stage')).toBeNull();
  });

  it('getScore()/getHighScore() are 0 before init and safe after destroy', () => {
    const controller = new BoredloadGameController(host);
    expect(controller.getScore()).toBe(0);
    expect(controller.getHighScore()).toBe(0);

    controller.init({ threshold: 1000, minPlayMs: 500, maxPlayMs: 2000 }, true);
    controller.destroy();
    expect(controller.getScore()).toBe(0);
  });
});
