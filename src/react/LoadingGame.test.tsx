import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LoadingGame } from './LoadingGame';

describe('LoadingGame', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders nothing when not loading', () => {
    const { container } = render(<LoadingGame isLoading={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders a status container with a spinner while waiting for the threshold', () => {
    render(<LoadingGame isLoading threshold={1000} minPlayMs={500} maxPlayMs={2000} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByLabelText('Loading minigame')).not.toBeInTheDocument();
  });

  it('swaps to the canvas once the threshold elapses', () => {
    render(<LoadingGame isLoading threshold={1000} minPlayMs={500} maxPlayMs={2000} />);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByLabelText('Loading minigame')).toBeInTheDocument();
  });

  it('keeps the canvas visible after isLoading becomes false and shows a continue button once ready', () => {
    const { rerender } = render(
      <LoadingGame isLoading threshold={1000} minPlayMs={500} maxPlayMs={2000} />,
    );
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    rerender(<LoadingGame isLoading={false} threshold={1000} minPlayMs={500} maxPlayMs={2000} />);

    // Still visible right after loading finishes — minPlayMs hasn't elapsed yet.
    expect(screen.getByLabelText('Loading minigame')).toBeInTheDocument();
    expect(screen.queryByLabelText('Continue to app')).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(500);
    });
    rerender(<LoadingGame isLoading={false} threshold={1000} minPlayMs={500} maxPlayMs={2000} />);
    expect(screen.getByLabelText('Continue to app')).toBeInTheDocument();
  });

  it('unmounts once the continue button is clicked', () => {
    const onExit = vi.fn();
    const { rerender, container } = render(
      <LoadingGame isLoading threshold={1000} minPlayMs={500} maxPlayMs={2000} onExit={onExit} />,
    );
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    rerender(
      <LoadingGame
        isLoading={false}
        threshold={1000}
        minPlayMs={500}
        maxPlayMs={2000}
        onExit={onExit}
      />,
    );
    act(() => {
      vi.advanceTimersByTime(500);
    });
    rerender(
      <LoadingGame
        isLoading={false}
        threshold={1000}
        minPlayMs={500}
        maxPlayMs={2000}
        onExit={onExit}
      />,
    );

    act(() => {
      screen.getByLabelText('Continue to app').click();
    });
    expect(onExit).toHaveBeenCalledTimes(1);
    expect(container).toBeEmptyDOMElement();
  });
});
