import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LoadingThresholdWatcher } from './loadingThreshold';

const OPTS = { threshold: 1000, minPlayMs: 500, maxPlayMs: 2000 };

describe('LoadingThresholdWatcher', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('stays idle until start() is called', () => {
    const watcher = new LoadingThresholdWatcher(OPTS);
    expect(watcher.getPhase()).toBe('idle');
  });

  it('moves to waiting then showing after the threshold elapses', () => {
    const onExceeded = vi.fn();
    const watcher = new LoadingThresholdWatcher({ ...OPTS, onExceeded });
    watcher.start();
    expect(watcher.getPhase()).toBe('waiting');

    vi.advanceTimersByTime(999);
    expect(watcher.getPhase()).toBe('waiting');
    expect(onExceeded).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(watcher.getPhase()).toBe('showing');
    expect(onExceeded).toHaveBeenCalledTimes(1);
  });

  it('notifyLoadingFinished() before the threshold cancels without calling onExceeded', () => {
    const onExceeded = vi.fn();
    const watcher = new LoadingThresholdWatcher({ ...OPTS, onExceeded });
    watcher.start();
    vi.advanceTimersByTime(500);
    watcher.notifyLoadingFinished();
    vi.advanceTimersByTime(1000);
    expect(onExceeded).not.toHaveBeenCalled();
    expect(watcher.getPhase()).toBe('idle');
  });

  it('does not surface onReadyToContinue until minPlayMs has elapsed since the game was shown', () => {
    const onReadyToContinue = vi.fn();
    const watcher = new LoadingThresholdWatcher({ ...OPTS, onReadyToContinue });
    watcher.start();
    vi.advanceTimersByTime(1000); // game shows
    watcher.notifyLoadingFinished(); // loading finishes immediately after showing

    vi.advanceTimersByTime(499);
    expect(onReadyToContinue).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onReadyToContinue).toHaveBeenCalledTimes(1);
    expect(watcher.getPhase()).toBe('ready-to-continue');
  });

  it('counts minPlayMs from when the game was shown, not from notifyLoadingFinished()', () => {
    const onReadyToContinue = vi.fn();
    const watcher = new LoadingThresholdWatcher({ ...OPTS, onReadyToContinue });
    watcher.start();
    vi.advanceTimersByTime(1000); // game shows at t=1000

    vi.advanceTimersByTime(300); // t=1300, loading still going
    watcher.notifyLoadingFinished(); // real load finishes at t=1300

    // minPlayMs (500) counted from t=1000, so ready at t=1500 — only 200ms away, not 500ms.
    vi.advanceTimersByTime(199);
    expect(onReadyToContinue).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onReadyToContinue).toHaveBeenCalledTimes(1);
  });

  it('auto-dismisses maxPlayMs after onReadyToContinue if never manually dismissed', () => {
    const onAutoDismiss = vi.fn();
    const watcher = new LoadingThresholdWatcher({ ...OPTS, onAutoDismiss });
    watcher.start();
    vi.advanceTimersByTime(1000); // showing
    watcher.notifyLoadingFinished();
    vi.advanceTimersByTime(500); // ready-to-continue

    vi.advanceTimersByTime(1999);
    expect(onAutoDismiss).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onAutoDismiss).toHaveBeenCalledTimes(1);
  });

  it('stop() after showing cancels the pending minPlay/maxPlay timers', () => {
    const onReadyToContinue = vi.fn();
    const onAutoDismiss = vi.fn();
    const watcher = new LoadingThresholdWatcher({ ...OPTS, onReadyToContinue, onAutoDismiss });
    watcher.start();
    vi.advanceTimersByTime(1000); // showing
    watcher.notifyLoadingFinished();
    watcher.stop();
    vi.advanceTimersByTime(3000);
    expect(onReadyToContinue).not.toHaveBeenCalled();
    expect(onAutoDismiss).not.toHaveBeenCalled();
    expect(watcher.getPhase()).toBe('idle');
  });

  it('start() is a no-op while already running', () => {
    const onExceeded = vi.fn();
    const watcher = new LoadingThresholdWatcher({ ...OPTS, onExceeded });
    watcher.start();
    watcher.start();
    vi.advanceTimersByTime(1000);
    expect(onExceeded).toHaveBeenCalledTimes(1);
  });

  it('can be restarted with start() after stop()', () => {
    const onExceeded = vi.fn();
    const watcher = new LoadingThresholdWatcher({ ...OPTS, onExceeded });
    watcher.start();
    watcher.stop();
    watcher.start();
    vi.advanceTimersByTime(1000);
    expect(onExceeded).toHaveBeenCalledTimes(1);
  });
});
