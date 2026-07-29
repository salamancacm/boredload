'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { resolveAutoTheme } from '../core/autoTheme';
import { GameEngine } from '../core/engine';
import { getHighScore } from '../core/highScore';
import { LoadingThresholdWatcher } from '../core/loadingThreshold';
import { prefersReducedMotion } from '../core/motionPreference';
import { isSlowConnection } from '../core/networkHint';
import type { GameConfig } from '../core/types';
import { createGame } from '../games/registry';

const DEFAULT_THRESHOLD = 1500;
const DEFAULT_MIN_PLAY_MS = 3000;
const DEFAULT_MAX_PLAY_MS = 30000;
const DEFAULT_WIDTH = 300;
const DEFAULT_HEIGHT = 150;
const DEFAULT_SLOW_CONNECTION_THRESHOLD_MS = 500;

export interface UseLoadingGameOptions extends GameConfig {
  width?: number;
  height?: number;
}

export interface UseLoadingGameResult {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  /** True once the loading threshold has been exceeded and the canvas should render. */
  showGame: boolean;
  /** True once loading has finished and minPlayMs has elapsed — the continue affordance should be shown. */
  readyToContinue: boolean;
  score: number;
  /** Persisted best score for this game (see `persistHighScore`). */
  highScore: number;
  /** Manually exit the game (wire to a "Continue" button). Safe to call at any time. */
  dismiss: () => void;
}

/**
 * Drives the spinner→game→exit decision for React. Starts a
 * `LoadingThresholdWatcher` on `isLoading` transitions and mounts a
 * `GameEngine` once `showGame` flips true. Once shown, the game keeps
 * playing past `isLoading` becoming false — it only unmounts when `dismiss()`
 * is called (typically from a "Continue" button) or `maxPlayMs` elapses
 * without one. Cleanup is idempotent (safe under StrictMode).
 *
 * If the OS/browser requests reduced motion (`respectReducedMotion`, default
 * true), the game never shows — `showGame` simply never flips true, so
 * callers naturally fall back to their spinner rendering.
 */
export function useLoadingGame(
  isLoading: boolean,
  options: UseLoadingGameOptions = {},
): UseLoadingGameResult {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const watcherRef = useRef<LoadingThresholdWatcher | null>(null);
  const [showGame, setShowGame] = useState(false);
  const [readyToContinue, setReadyToContinue] = useState(false);
  const [score, setScore] = useState(0);

  const gameId = options.game ?? 'dino-runner';
  const highScoreKey = options.highScoreKey ?? `boredload:${gameId}`;
  const persistHighScore = options.persistHighScore !== false;
  const [highScore, setHighScoreState] = useState(() =>
    persistHighScore ? getHighScore(highScoreKey) : 0,
  );
  // Evaluated once — the reduced-motion preference doesn't need to react to
  // mid-session changes for this widget's purposes.
  const [skipGameForReducedMotion] = useState(
    () => options.respectReducedMotion !== false && prefersReducedMotion(),
  );

  const onGameOverRef = useRef(options.onGameOver);
  onGameOverRef.current = options.onGameOver;
  const onReadyToContinueRef = useRef(options.onReadyToContinue);
  onReadyToContinueRef.current = options.onReadyToContinue;
  const onExitRef = useRef(options.onExit);
  onExitRef.current = options.onExit;

  const width = options.width ?? DEFAULT_WIDTH;
  const height = options.height ?? DEFAULT_HEIGHT;
  const threshold = options.threshold ?? DEFAULT_THRESHOLD;
  const minPlayMs = options.minPlayMs ?? DEFAULT_MIN_PLAY_MS;
  const maxPlayMs = options.maxPlayMs ?? DEFAULT_MAX_PLAY_MS;
  const seed = options.seed;

  const effectiveThreshold = useMemo(() => {
    if (!options.adaptiveThreshold || !isSlowConnection()) return threshold;
    return Math.min(threshold, options.slowConnectionThresholdMs ?? DEFAULT_SLOW_CONNECTION_THRESHOLD_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threshold, options.adaptiveThreshold, options.slowConnectionThresholdMs]);

  // Theme object identity churn is common (inline literals); serialize for a
  // stable dependency without requiring consumers to memoize.
  const themeKey = options.theme ? JSON.stringify(options.theme) : '';
  const explicitTheme = useMemo(() => options.theme, [themeKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const dismiss = useCallback(() => {
    if (engineRef.current) {
      const finalScore = engineRef.current.getScore();
      setScore(finalScore);
      setHighScoreState(engineRef.current.getHighScore());
      onGameOverRef.current?.(finalScore);
    }
    setReadyToContinue(false);
    setShowGame(false);
    watcherRef.current?.stop();
    onExitRef.current?.();
  }, []);

  useEffect(() => {
    const watcher = new LoadingThresholdWatcher({
      threshold: effectiveThreshold,
      minPlayMs,
      maxPlayMs,
      onExceeded: () => setShowGame(true),
      onReadyToContinue: () => {
        setReadyToContinue(true);
        onReadyToContinueRef.current?.();
      },
      onAutoDismiss: () => dismiss(),
    });
    watcherRef.current = watcher;
    return () => {
      watcher.stop();
      watcherRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveThreshold, minPlayMs, maxPlayMs]);

  useEffect(() => {
    if (skipGameForReducedMotion) return;
    const watcher = watcherRef.current;
    if (!watcher) return;

    if (isLoading) {
      watcher.start();
    } else {
      const phase = watcher.getPhase();
      watcher.notifyLoadingFinished();
      if (phase === 'waiting') {
        setShowGame(false);
      }
      // phase 'showing': onReadyToContinue will surface the continue affordance.
      // phase 'idle' / 'ready-to-continue': nothing more to do here.
    }
  }, [isLoading, skipGameForReducedMotion]);

  useEffect(() => {
    if (!showGame) {
      // dismiss() already captured the score/onGameOver before flipping
      // showGame to false; this branch only tears the engine down.
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const game = createGame(gameId);
    const theme = resolveAutoTheme(canvas, explicitTheme);
    const engine = new GameEngine({
      canvas,
      game,
      width,
      height,
      theme,
      seed,
      persistHighScore,
      highScoreKey,
    });
    engineRef.current = engine;
    engine.start();

    return () => {
      if (engineRef.current === engine) {
        engine.destroy();
        engineRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showGame, gameId, width, height, seed, explicitTheme, persistHighScore, highScoreKey]);

  useEffect(() => {
    return () => {
      engineRef.current?.destroy();
      engineRef.current = null;
    };
  }, []);

  return { canvasRef, showGame, readyToContinue, score, highScore, dismiss };
}
