import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from './index';

describe('mount()', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    vi.useFakeTimers();
  });

  afterEach(() => {
    container.remove();
    vi.useRealTimers();
    // @ts-expect-error - test-only cleanup of a property defined in individual tests.
    delete navigator.connection;
  });

  it('shows a spinner then the canvas once the threshold elapses', () => {
    const game = mount(container, { threshold: 1000, minPlayMs: 500, maxPlayMs: 2000 });
    game.setLoading(true);
    expect(container.querySelector('.boredload-spinner')).not.toBeNull();

    vi.advanceTimersByTime(1000);
    expect(container.querySelector('.boredload-canvas')).not.toBeNull();
    game.destroy();
  });

  it('never shows the game when the OS prefers reduced motion', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({ matches: true }) as unknown as typeof window.matchMedia,
    );

    const game = mount(container, { threshold: 1000, minPlayMs: 500, maxPlayMs: 2000 });
    game.setLoading(true);
    vi.advanceTimersByTime(5000);
    expect(container.querySelector('.boredload-canvas')).toBeNull();
    expect(container.querySelector('.boredload-spinner')).not.toBeNull();

    game.setLoading(false);
    expect(container.querySelector('.boredload-spinner')).toBeNull();

    game.destroy();
    vi.unstubAllGlobals();
  });

  it('shortens the threshold on a confirmed-slow connection when adaptiveThreshold is on', () => {
    Object.defineProperty(navigator, 'connection', {
      value: { effectiveType: '2g' },
      configurable: true,
    });

    const game = mount(container, {
      threshold: 5000,
      minPlayMs: 500,
      maxPlayMs: 2000,
      adaptiveThreshold: true,
      slowConnectionThresholdMs: 300,
    });
    game.setLoading(true);
    vi.advanceTimersByTime(300);
    expect(container.querySelector('.boredload-canvas')).not.toBeNull();
    game.destroy();
  });

  it('ignores adaptiveThreshold on a fast/unknown connection', () => {
    const game = mount(container, {
      threshold: 5000,
      minPlayMs: 500,
      maxPlayMs: 2000,
      adaptiveThreshold: true,
      slowConnectionThresholdMs: 300,
    });
    game.setLoading(true);
    vi.advanceTimersByTime(300);
    expect(container.querySelector('.boredload-canvas')).toBeNull();
    game.destroy();
  });

  it('reads a --boredload-accent CSS variable into the spinner color', () => {
    container.style.setProperty('--boredload-accent', 'rgb(1, 2, 3)');
    const game = mount(container, { threshold: 1000, minPlayMs: 500, maxPlayMs: 2000 });
    game.setLoading(true);
    const spinner = container.querySelector<HTMLElement>('.boredload-spinner');
    expect(spinner?.style.color).toBe('rgb(1, 2, 3)');
    game.destroy();
  });
});
