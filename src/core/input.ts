import type { InputState } from './types';

const ACTION_KEYS = new Set(['Space', 'ArrowUp']);
const LEFT_KEYS = new Set(['ArrowLeft', 'KeyA']);
const RIGHT_KEYS = new Set(['ArrowRight', 'KeyD']);

/**
 * Normalizes keyboard (Space / ArrowUp for the primary action, ArrowLeft+A /
 * ArrowRight+D for held direction) and touch/pointer input on a target
 * element into a single `InputState` snapshot. `primaryActionDown` reflects
 * the current held state; `primaryActionPressed` is true only on the frame
 * the action transitioned from up to down (edge-triggered, consumed via
 * `getState()`). `pointerX` tracks an actively-down pointer/touch's
 * canvas-local logical-pixel X position, for games that want "follow the
 * pointer" style control.
 */
export class InputController {
  private down = false;
  private pressedEdge = false;
  private leftDown = false;
  private rightDown = false;
  private pointerXValue: number | undefined = undefined;
  private target: HTMLElement;
  private logicalWidth: number;

  private onKeyDown = (e: KeyboardEvent): void => {
    if (ACTION_KEYS.has(e.code)) {
      e.preventDefault();
      this.setDown(true);
    } else if (LEFT_KEYS.has(e.code)) {
      e.preventDefault();
      this.leftDown = true;
    } else if (RIGHT_KEYS.has(e.code)) {
      e.preventDefault();
      this.rightDown = true;
    }
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    if (ACTION_KEYS.has(e.code)) {
      e.preventDefault();
      this.setDown(false);
    } else if (LEFT_KEYS.has(e.code)) {
      e.preventDefault();
      this.leftDown = false;
    } else if (RIGHT_KEYS.has(e.code)) {
      e.preventDefault();
      this.rightDown = false;
    }
  };

  private onPointerDown = (e: PointerEvent): void => {
    e.preventDefault();
    this.setDown(true);
    this.pointerXValue = this.toLocalX(e.clientX);
  };

  private onPointerMove = (e: PointerEvent): void => {
    if (!this.down) return;
    this.pointerXValue = this.toLocalX(e.clientX);
  };

  private onPointerUp = (e: PointerEvent): void => {
    e.preventDefault();
    this.setDown(false);
    this.pointerXValue = undefined;
  };

  private onTouchStart = (e: TouchEvent): void => {
    e.preventDefault();
    this.setDown(true);
    const touch = e.touches[0];
    if (touch) this.pointerXValue = this.toLocalX(touch.clientX);
  };

  private onTouchMove = (e: TouchEvent): void => {
    if (!this.down) return;
    const touch = e.touches[0];
    if (touch) this.pointerXValue = this.toLocalX(touch.clientX);
  };

  private onTouchEnd = (e: TouchEvent): void => {
    e.preventDefault();
    this.setDown(false);
    this.pointerXValue = undefined;
  };

  constructor(target: HTMLElement, initialLogicalWidth?: number) {
    this.target = target;
    this.logicalWidth = initialLogicalWidth ?? target.getBoundingClientRect().width;
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    target.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    target.addEventListener('touchstart', this.onTouchStart, { passive: false });
    window.addEventListener('touchmove', this.onTouchMove, { passive: false });
    window.addEventListener('touchend', this.onTouchEnd, { passive: false });
  }

  /** Call whenever the canvas's logical (CSS-pixel) width changes, e.g. on engine resize. */
  setLogicalWidth(width: number): void {
    this.logicalWidth = width;
  }

  private toLocalX(clientX: number): number {
    const rect = this.target.getBoundingClientRect();
    const scaleX = rect.width > 0 ? this.logicalWidth / rect.width : 1;
    return (clientX - rect.left) * scaleX;
  }

  private setDown(down: boolean): void {
    if (down && !this.down) {
      this.pressedEdge = true;
    }
    this.down = down;
  }

  /** Snapshot of the current input state; clears the "pressed" edge flag. */
  getState(): InputState {
    const heldDirection: -1 | 0 | 1 =
      this.rightDown && !this.leftDown ? 1 : this.leftDown && !this.rightDown ? -1 : 0;
    const state: InputState = {
      primaryActionDown: this.down,
      primaryActionPressed: this.pressedEdge,
      heldDirection,
      pointerX: this.pointerXValue,
    };
    this.pressedEdge = false;
    return state;
  }

  destroy(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    this.target.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    this.target.removeEventListener('touchstart', this.onTouchStart);
    window.removeEventListener('touchmove', this.onTouchMove);
    window.removeEventListener('touchend', this.onTouchEnd);
  }
}
