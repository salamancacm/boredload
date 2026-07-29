'use client';

import * as React from 'react';
import { useLoadingGame } from './useLoadingGame';
import type { LoadingGameProps } from '../core/types';

const spinnerStyle: React.CSSProperties = {
  display: 'inline-block',
  width: 24,
  height: 24,
  borderRadius: '50%',
  border: '3px solid currentColor',
  borderTopColor: 'transparent',
  animation: 'boredload-spin 0.8s linear infinite',
};

const stageStyle: React.CSSProperties = {
  display: 'inline-flex',
  flexDirection: 'column',
  gap: 6,
};

const continueButtonStyle: React.CSSProperties = {
  alignSelf: 'flex-end',
  padding: '6px 14px',
  font: '600 13px system-ui, sans-serif',
  borderRadius: 999,
  border: 'none',
  cursor: 'pointer',
  color: '#ffffff',
  boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
};

let keyframesInjected = false;
function useSpinnerKeyframes(): void {
  React.useEffect(() => {
    if (keyframesInjected || typeof document === 'undefined') return;
    const style = document.createElement('style');
    style.textContent = '@keyframes boredload-spin{to{transform:rotate(360deg)}}';
    document.head.appendChild(style);
    keyframesInjected = true;
  }, []);
}

/**
 * Drop-in loading indicator: renders nothing until `isLoading` is true, a
 * small CSS spinner while waiting for `threshold`, and the minigame canvas
 * once shown. The game stays visible and playable past `isLoading` becoming
 * false (at least `minPlayMs`) — a "Continue" button appears once the player
 * can leave, and it auto-dismisses after `maxPlayMs` if they never act on it.
 * `role="status"`/`aria-live="polite"` on the container give basic a11y.
 */
export function LoadingGame(props: LoadingGameProps): React.ReactElement | null {
  const {
    isLoading,
    width = 300,
    height = 150,
    className,
    game,
    threshold,
    minPlayMs,
    maxPlayMs,
    continueLabel = 'Continue →',
    persistHighScore,
    highScoreKey,
    respectReducedMotion,
    adaptiveThreshold,
    slowConnectionThresholdMs,
    onGameOver,
    onReadyToContinue,
    onExit,
    theme,
    seed,
  } = props;

  useSpinnerKeyframes();

  const { canvasRef, showGame, readyToContinue, dismiss } = useLoadingGame(isLoading, {
    game,
    threshold,
    minPlayMs,
    maxPlayMs,
    persistHighScore,
    highScoreKey,
    respectReducedMotion,
    adaptiveThreshold,
    slowConnectionThresholdMs,
    onGameOver,
    onReadyToContinue,
    onExit,
    theme,
    seed,
    width,
    height,
  });

  if (!isLoading && !showGame) return null;

  return (
    <div role="status" aria-live="polite" className={className}>
      {showGame ? (
        <div className="boredload-stage" style={stageStyle}>
          <canvas
            ref={canvasRef}
            className="boredload-canvas"
            aria-label="Loading minigame"
            style={{ display: 'block', width, height }}
          />
          {readyToContinue && (
            <button
              type="button"
              className="boredload-continue"
              onClick={dismiss}
              aria-label="Continue to app"
              style={{ ...continueButtonStyle, background: theme?.accent ?? '#ff5470' }}
            >
              {continueLabel}
            </button>
          )}
        </div>
      ) : (
        <span className="boredload-spinner" style={{ ...spinnerStyle, color: theme?.accent }} />
      )}
    </div>
  );
}
