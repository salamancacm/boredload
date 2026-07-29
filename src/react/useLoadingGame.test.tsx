import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useLoadingGame } from './useLoadingGame';

// Attach the canvas ref manually since renderHook doesn't render a <canvas>.
function useLoadingGameWithCanvas(isLoading: boolean, options?: Parameters<typeof useLoadingGame>[1]) {
  const result = useLoadingGame(isLoading, options);
  if (!result.canvasRef.current) {
    (result.canvasRef as React.MutableRefObject<HTMLCanvasElement | null>).current =
      document.createElement('canvas');
  }
  return result;
}

const BASE_OPTS = { threshold: 1000, minPlayMs: 500, maxPlayMs: 2000 };

describe('useLoadingGame', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not show the game before the threshold elapses', () => {
    const { result } = renderHook(() => useLoadingGameWithCanvas(true, BASE_OPTS));
    expect(result.current.showGame).toBe(false);

    act(() => {
      vi.advanceTimersByTime(999);
    });
    expect(result.current.showGame).toBe(false);
  });

  it('shows the game once the threshold elapses', () => {
    const { result, rerender } = renderHook(
      ({ isLoading }) => useLoadingGameWithCanvas(isLoading, BASE_OPTS),
      { initialProps: { isLoading: true } },
    );

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    rerender({ isLoading: true });
    expect(result.current.showGame).toBe(true);
  });

  it('hides immediately if loading never exceeds the threshold', () => {
    const { result, rerender } = renderHook(
      ({ isLoading }) => useLoadingGameWithCanvas(isLoading, BASE_OPTS),
      { initialProps: { isLoading: true } },
    );

    act(() => {
      vi.advanceTimersByTime(400);
    });
    rerender({ isLoading: false });
    expect(result.current.showGame).toBe(false);
  });

  it('keeps the game visible past isLoading=false — no auto-hide at minPlayMs', () => {
    const { result, rerender } = renderHook(
      ({ isLoading }) => useLoadingGameWithCanvas(isLoading, BASE_OPTS),
      { initialProps: { isLoading: true } },
    );

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    rerender({ isLoading: true });
    expect(result.current.showGame).toBe(true);

    // Loading finishes right away, before minPlayMs elapses.
    rerender({ isLoading: false });
    expect(result.current.showGame).toBe(true);
    expect(result.current.readyToContinue).toBe(false);

    // minPlayMs elapses: continue affordance appears, but the game stays visible.
    act(() => {
      vi.advanceTimersByTime(500);
    });
    rerender({ isLoading: false });
    expect(result.current.showGame).toBe(true);
    expect(result.current.readyToContinue).toBe(true);

    // Well past minPlayMs, still no auto-hide — only dismiss()/maxPlayMs closes it.
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    rerender({ isLoading: false });
    expect(result.current.showGame).toBe(false); // maxPlayMs (2000) elapsed by now, auto-dismissed
  });

  it('dismiss() hides the game immediately and reports the final score', () => {
    const onGameOver = vi.fn();
    const onExit = vi.fn();
    const { result, rerender } = renderHook(
      ({ isLoading }) =>
        useLoadingGameWithCanvas(isLoading, { ...BASE_OPTS, onGameOver, onExit }),
      { initialProps: { isLoading: true } },
    );

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    rerender({ isLoading: true });
    expect(result.current.showGame).toBe(true);

    act(() => {
      result.current.dismiss();
    });
    expect(result.current.showGame).toBe(false);
    expect(onExit).toHaveBeenCalledTimes(1);
    expect(onGameOver).toHaveBeenCalledTimes(1);
  });

  it('auto-dismisses after maxPlayMs once ready-to-continue with no manual dismiss', () => {
    const onExit = vi.fn();
    const { result, rerender } = renderHook(
      ({ isLoading }) => useLoadingGameWithCanvas(isLoading, { ...BASE_OPTS, onExit }),
      { initialProps: { isLoading: true } },
    );

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    rerender({ isLoading: false }); // schedules readyToContinue at +500

    act(() => {
      vi.advanceTimersByTime(500); // ready-to-continue fires
    });
    rerender({ isLoading: false });
    expect(result.current.readyToContinue).toBe(true);

    act(() => {
      vi.advanceTimersByTime(2000); // maxPlayMs elapses
    });
    rerender({ isLoading: false });
    expect(result.current.showGame).toBe(false);
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it('never shows the game when the OS prefers reduced motion', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({ matches: true }) as unknown as typeof window.matchMedia,
    );

    const { result, rerender } = renderHook(
      ({ isLoading }) => useLoadingGameWithCanvas(isLoading, BASE_OPTS),
      { initialProps: { isLoading: true } },
    );

    act(() => {
      vi.advanceTimersByTime(5000); // well past threshold
    });
    rerender({ isLoading: true });
    expect(result.current.showGame).toBe(false);

    vi.unstubAllGlobals();
  });

  it('respects the game even under reduced motion when respectReducedMotion is false', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({ matches: true }) as unknown as typeof window.matchMedia,
    );

    const { result, rerender } = renderHook(
      ({ isLoading }) =>
        useLoadingGameWithCanvas(isLoading, { ...BASE_OPTS, respectReducedMotion: false }),
      { initialProps: { isLoading: true } },
    );

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    rerender({ isLoading: true });
    expect(result.current.showGame).toBe(true);

    vi.unstubAllGlobals();
  });
});
