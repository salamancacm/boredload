import type { InputState } from './types';

const ACTION_KEYS = new Set(['Space', 'ArrowUp']);

/**
 * Normalizes keyboard (Space / ArrowUp) and touch/pointer input on a target
 * element into a single primary-action signal. `primaryActionDown` reflects
 * the current held state; `primaryActionPressed` is true only on the frame
 * the action transitioned from up to down (edge-triggered, consumed via
 * `consumePressed()`).
 */
export class InputController {
  private down = false;
  private pressedEdge = false;
  private target: HTMLElement;

  private onKeyDown = (e: KeyboardEvent): void => {
    if (ACTION_KEYS.has(e.code)) {
      e.preventDefault();
      this.setDown(true);
    }
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    if (ACTION_KEYS.has(e.code)) {
      e.preventDefault();
      this.setDown(false);
    }
  };

  private onPointerDown = (e: PointerEvent): void => {
    e.preventDefault();
    this.setDown(true);
  };

  private onPointerUp = (e: PointerEvent): void => {
    e.preventDefault();
    this.setDown(false);
  };

  private onTouchStart = (e: TouchEvent): void => {
    e.preventDefault();
    this.setDown(true);
  };

  private onTouchEnd = (e: TouchEvent): void => {
    e.preventDefault();
    this.setDown(false);
  };

  constructor(target: HTMLElement) {
    this.target = target;
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    target.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointerup', this.onPointerUp);
    target.addEventListener('touchstart', this.onTouchStart, { passive: false });
    window.addEventListener('touchend', this.onTouchEnd, { passive: false });
  }

  private setDown(down: boolean): void {
    if (down && !this.down) {
      this.pressedEdge = true;
    }
    this.down = down;
  }

  /** Snapshot of the current input state; clears the "pressed" edge flag. */
  getState(): InputState {
    const state: InputState = {
      primaryActionDown: this.down,
      primaryActionPressed: this.pressedEdge,
    };
    this.pressedEdge = false;
    return state;
  }

  destroy(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    this.target.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointerup', this.onPointerUp);
    this.target.removeEventListener('touchstart', this.onTouchStart);
    window.removeEventListener('touchend', this.onTouchEnd);
  }
}
