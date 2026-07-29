import { resolveAutoTheme } from './core/autoTheme';
import { GameEngine } from './core/engine';
import { getHighScore } from './core/highScore';
import { LoadingThresholdWatcher } from './core/loadingThreshold';
import { prefersReducedMotion } from './core/motionPreference';
import { isSlowConnection } from './core/networkHint';
import type { GameConfig } from './core/types';
import { createGame } from './games/registry';

export * from './core/types';
export { GameEngine } from './core/engine';
export { InputController } from './core/input';
export { LoadingThresholdWatcher } from './core/loadingThreshold';
export type { ThresholdPhase, LoadingThresholdOptions } from './core/loadingThreshold';
export { resizeCanvasToDisplaySize, observeResize } from './core/canvas';
export { createGame, registerGame, hasGame } from './games/registry';
export type { GameFactory } from './games/registry';
export { DinoGame } from './games/dino';
export { getHighScore, setHighScore } from './core/highScore';
export { resolveAutoTheme } from './core/autoTheme';
export { prefersReducedMotion } from './core/motionPreference';
export { getEffectiveConnectionType, isSlowConnection } from './core/networkHint';

const DEFAULT_THRESHOLD = 1500;
const DEFAULT_MIN_PLAY_MS = 3000;
const DEFAULT_MAX_PLAY_MS = 30000;
const DEFAULT_WIDTH = 300;
const DEFAULT_HEIGHT = 150;
const DEFAULT_CONTINUE_LABEL = 'Continue →';
const DEFAULT_SLOW_CONNECTION_THRESHOLD_MS = 500;

export interface MountOptions extends GameConfig {
  width?: number;
  height?: number;
}

export interface MountHandle {
  /** Feed the current loading state; drives the spinner→game transition. */
  setLoading(isLoading: boolean): void;
  /** Tears down timers, the engine, and any DOM nodes created by mount(). */
  destroy(): void;
  getScore(): number;
  /** The persisted best score for this game, updated live as new records are set. */
  getHighScore(): number;
}

const SPINNER_STYLE = [
  'display:inline-block',
  'width:24px',
  'height:24px',
  'border-radius:50%',
  'border:3px solid currentColor',
  'border-top-color:transparent',
  'animation:boredload-spin 0.8s linear infinite',
].join(';');

const CONTINUE_BUTTON_STYLE = [
  'align-self:flex-end',
  'padding:6px 14px',
  'font:600 13px system-ui,sans-serif',
  'border-radius:999px',
  'border:none',
  'cursor:pointer',
  'box-shadow:0 1px 4px rgba(0,0,0,0.25)',
].join(';');

let spinKeyframesInjected = false;
function ensureSpinnerKeyframes(): void {
  if (spinKeyframesInjected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.textContent =
    '@keyframes boredload-spin{to{transform:rotate(360deg)}}';
  document.head.appendChild(style);
  spinKeyframesInjected = true;
}

/**
 * Framework-agnostic mount helper: ties a `LoadingThresholdWatcher` and a
 * `GameEngine` together against a plain DOM container. No canvas or rAF
 * work happens until the threshold is actually exceeded, so fast loads
 * cost nothing. Once shown, the game stays playable past the real loading
 * finishing (at least `minPlayMs`) and only exits when the player clicks
 * the "continue" affordance or `maxPlayMs` elapses without one.
 */
export function mount(container: HTMLElement, options: MountOptions = {}): MountHandle {
  const width = options.width ?? DEFAULT_WIDTH;
  const height = options.height ?? DEFAULT_HEIGHT;
  const gameId = options.game ?? 'dino-runner';
  const highScoreKey = options.highScoreKey ?? `boredload:${gameId}`;

  let engine: GameEngine | null = null;
  let canvas: HTMLCanvasElement | null = null;
  let spinner: HTMLElement | null = null;
  let continueButton: HTMLButtonElement | null = null;
  let destroyed = false;
  let highScore = options.persistHighScore !== false ? getHighScore(highScoreKey) : 0;

  const stage = document.createElement('div');
  stage.className = 'boredload-stage';
  stage.style.cssText = 'display:inline-flex;flex-direction:column;gap:6px';
  container.appendChild(stage);

  // Resolved once at mount time: --boredload-* CSS vars (read from the live
  // stage element, so inherited values from the consumer's own CSS apply)
  // merged under any explicit `theme` override.
  const theme = resolveAutoTheme(stage, options.theme);

  const skipGameForReducedMotion =
    options.respectReducedMotion !== false && prefersReducedMotion();

  const effectiveThreshold =
    options.adaptiveThreshold && isSlowConnection()
      ? Math.min(
          options.threshold ?? DEFAULT_THRESHOLD,
          options.slowConnectionThresholdMs ?? DEFAULT_SLOW_CONNECTION_THRESHOLD_MS,
        )
      : (options.threshold ?? DEFAULT_THRESHOLD);

  const watcher = new LoadingThresholdWatcher({
    threshold: effectiveThreshold,
    minPlayMs: options.minPlayMs ?? DEFAULT_MIN_PLAY_MS,
    maxPlayMs: options.maxPlayMs ?? DEFAULT_MAX_PLAY_MS,
    onExceeded: () => {
      if (destroyed) return;
      showGame();
    },
    onReadyToContinue: () => {
      if (destroyed) return;
      options.onReadyToContinue?.();
      showContinueButton();
    },
    onAutoDismiss: () => {
      if (destroyed) return;
      dismiss();
    },
  });

  function showSpinner(): void {
    ensureSpinnerKeyframes();
    spinner = document.createElement('div');
    spinner.className = 'boredload-spinner';
    spinner.setAttribute('role', 'status');
    spinner.setAttribute('aria-live', 'polite');
    spinner.style.cssText = SPINNER_STYLE;
    if (theme?.accent) spinner.style.color = theme.accent;
    stage.appendChild(spinner);
  }

  function hideSpinner(): void {
    if (spinner) {
      spinner.remove();
      spinner = null;
    }
  }

  function showGame(): void {
    hideSpinner();
    canvas = document.createElement('canvas');
    canvas.className = 'boredload-canvas';
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', 'Loading minigame');
    stage.appendChild(canvas);

    const game = createGame(gameId);
    engine = new GameEngine({
      canvas,
      game,
      width,
      height,
      theme,
      seed: options.seed,
      persistHighScore: options.persistHighScore,
      highScoreKey,
    });
    engine.start();
  }

  function showContinueButton(): void {
    continueButton = document.createElement('button');
    continueButton.className = 'boredload-continue';
    continueButton.type = 'button';
    continueButton.textContent = options.continueLabel ?? DEFAULT_CONTINUE_LABEL;
    continueButton.setAttribute('aria-label', 'Continue to app');
    continueButton.style.cssText = CONTINUE_BUTTON_STYLE;
    continueButton.style.background = theme?.accent ?? '#ff5470';
    continueButton.style.color = '#ffffff';
    continueButton.addEventListener('click', () => dismiss());
    stage.appendChild(continueButton);
  }

  function hideContinueButton(): void {
    if (continueButton) {
      continueButton.remove();
      continueButton = null;
    }
  }

  function dismiss(): void {
    if (destroyed) return;
    const score = engine ? engine.getScore() : 0;
    if (engine) highScore = engine.getHighScore();
    hideContinueButton();
    hideSpinner();
    if (engine) {
      engine.destroy();
      engine = null;
    }
    if (canvas) {
      canvas.remove();
      canvas = null;
    }
    watcher.stop();
    options.onGameOver?.(score);
    options.onExit?.();
  }

  return {
    setLoading(isLoading: boolean): void {
      if (destroyed) return;

      // Reduced-motion consumers never see the game — just an accessible
      // spinner for as long as isLoading is true, no watcher/engine at all.
      if (skipGameForReducedMotion) {
        if (isLoading) {
          if (!spinner) showSpinner();
        } else {
          hideSpinner();
        }
        return;
      }

      if (isLoading) {
        if (!spinner && !canvas) {
          showSpinner();
        }
        watcher.start();
      } else {
        const phase = watcher.getPhase();
        watcher.notifyLoadingFinished();
        if (phase === 'waiting') {
          hideSpinner();
        }
        // phase 'showing': onReadyToContinue will surface the continue button.
        // phase 'idle' / 'ready-to-continue': nothing more to do here.
      }
    },
    destroy(): void {
      if (destroyed) return;
      destroyed = true;
      watcher.stop();
      hideSpinner();
      hideContinueButton();
      if (engine) {
        engine.destroy();
        engine = null;
      }
      if (canvas) {
        canvas.remove();
        canvas = null;
      }
      stage.remove();
    },
    getScore(): number {
      return engine ? engine.getScore() : 0;
    },
    getHighScore(): number {
      return engine ? engine.getHighScore() : highScore;
    },
  };
}
