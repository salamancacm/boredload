export type ThresholdPhase = 'idle' | 'waiting' | 'showing' | 'ready-to-continue';

export interface LoadingThresholdOptions {
  /** Ms of loading before the game should be shown. */
  threshold: number;
  /** Ms the game must stay visible once shown before the continue affordance can appear. */
  minPlayMs: number;
  /** Ms the continue affordance can wait for a manual action before auto-dismissing. */
  maxPlayMs: number;
  /** Called once `threshold` ms elapse while still loading. */
  onExceeded?: () => void;
  /** Called once loading has finished AND `minPlayMs` has elapsed since the game was shown. */
  onReadyToContinue?: () => void;
  /** Called if `maxPlayMs` elapses after onReadyToContinue with no manual dismiss. */
  onAutoDismiss?: () => void;
}

/**
 * Pure timer state machine for the spinner→game→exit decision, deliberately
 * kept free of canvas/rAF concerns so it can be unit tested with fake timers.
 *
 * Phases: idle → waiting (threshold pending) → showing (game visible, still
 * playable past the real loading finishing) → ready-to-continue (the exit
 * affordance is available; auto-dismisses after maxPlayMs if the user never
 * acts on it).
 */
export class LoadingThresholdWatcher {
  private options: LoadingThresholdOptions;
  private phase: ThresholdPhase = 'idle';
  private thresholdTimer: ReturnType<typeof setTimeout> | null = null;
  private minPlayTimer: ReturnType<typeof setTimeout> | null = null;
  private maxPlayTimer: ReturnType<typeof setTimeout> | null = null;
  private gameShownAt: number | null = null;
  private loadingFinished = false;

  constructor(options: LoadingThresholdOptions) {
    this.options = options;
  }

  getPhase(): ThresholdPhase {
    return this.phase;
  }

  /** Begins the threshold countdown. No-op if already running. Call when `isLoading` becomes true. */
  start(): void {
    if (this.phase !== 'idle') return;
    this.loadingFinished = false;
    this.phase = 'waiting';
    this.thresholdTimer = setTimeout(() => {
      this.thresholdTimer = null;
      this.phase = 'showing';
      this.gameShownAt = Date.now();
      this.options.onExceeded?.();
      if (this.loadingFinished) {
        this.scheduleReadyToContinue();
      }
    }, this.options.threshold);
  }

  /**
   * Call when `isLoading` becomes false. If the game hasn't shown yet (fast
   * load), this cancels everything immediately — same as today's spinner
   * behavior. If the game is already showing, it schedules the continue
   * affordance for `minPlayMs` after the game first appeared (not from now),
   * so the player always gets at least that much guaranteed play time.
   */
  notifyLoadingFinished(): void {
    this.loadingFinished = true;
    if (this.phase === 'waiting') {
      this.stop();
      return;
    }
    if (this.phase === 'showing') {
      this.scheduleReadyToContinue();
    }
  }

  private scheduleReadyToContinue(): void {
    const elapsedSinceShown = this.gameShownAt !== null ? Date.now() - this.gameShownAt : 0;
    const remaining = Math.max(0, this.options.minPlayMs - elapsedSinceShown);
    this.minPlayTimer = setTimeout(() => {
      this.minPlayTimer = null;
      this.phase = 'ready-to-continue';
      this.options.onReadyToContinue?.();
      this.maxPlayTimer = setTimeout(() => {
        this.maxPlayTimer = null;
        this.options.onAutoDismiss?.();
      }, this.options.maxPlayMs);
    }, remaining);
  }

  /** Cancels any pending timers and resets to idle. Safe to call repeatedly. */
  stop(): void {
    if (this.thresholdTimer !== null) {
      clearTimeout(this.thresholdTimer);
      this.thresholdTimer = null;
    }
    if (this.minPlayTimer !== null) {
      clearTimeout(this.minPlayTimer);
      this.minPlayTimer = null;
    }
    if (this.maxPlayTimer !== null) {
      clearTimeout(this.maxPlayTimer);
      this.maxPlayTimer = null;
    }
    this.phase = 'idle';
    this.gameShownAt = null;
    this.loadingFinished = false;
  }
}
