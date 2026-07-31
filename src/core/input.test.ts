import { afterEach, describe, expect, it, vi } from 'vitest';
import { InputController } from './input';

function keyEvent(type: string, code: string): KeyboardEvent {
  return new KeyboardEvent(type, { code, cancelable: true });
}

describe('InputController', () => {
  let controller: InputController | null = null;
  let target: HTMLElement;

  afterEach(() => {
    controller?.destroy();
    controller = null;
    target.remove();
  });

  function setup(logicalWidth?: number): InputController {
    target = document.createElement('div');
    document.body.appendChild(target);
    controller = new InputController(target, logicalWidth);
    return controller;
  }

  it('reports down/pressed on keydown for Space and clears pressed edge after read', () => {
    const c = setup();
    window.dispatchEvent(keyEvent('keydown', 'Space'));
    const state1 = c.getState();
    expect(state1.primaryActionDown).toBe(true);
    expect(state1.primaryActionPressed).toBe(true);

    const state2 = c.getState();
    expect(state2.primaryActionDown).toBe(true);
    expect(state2.primaryActionPressed).toBe(false);
  });

  it('reports down/up for ArrowUp', () => {
    const c = setup();
    window.dispatchEvent(keyEvent('keydown', 'ArrowUp'));
    expect(c.getState().primaryActionDown).toBe(true);
    window.dispatchEvent(keyEvent('keyup', 'ArrowUp'));
    expect(c.getState().primaryActionDown).toBe(false);
  });

  it('ignores unrelated keys', () => {
    const c = setup();
    window.dispatchEvent(keyEvent('keydown', 'KeyB'));
    expect(c.getState().primaryActionDown).toBe(false);
  });

  it('handles pointerdown/pointerup on the target', () => {
    const c = setup();
    target.dispatchEvent(new PointerEvent('pointerdown', { cancelable: true }));
    expect(c.getState().primaryActionDown).toBe(true);
    window.dispatchEvent(new PointerEvent('pointerup', { cancelable: true }));
    expect(c.getState().primaryActionDown).toBe(false);
  });

  it('handles touchstart/touchend on the target', () => {
    const c = setup();
    target.dispatchEvent(new TouchEvent('touchstart', { cancelable: true }));
    expect(c.getState().primaryActionDown).toBe(true);
    window.dispatchEvent(new TouchEvent('touchend', { cancelable: true }));
    expect(c.getState().primaryActionDown).toBe(false);
  });

  it('stops responding after destroy()', () => {
    const c = setup();
    c.destroy();
    window.dispatchEvent(keyEvent('keydown', 'Space'));
    expect(c.getState().primaryActionDown).toBe(false);
  });

  it('sets heldDirection from ArrowLeft/ArrowRight independently of the primary action', () => {
    const c = setup();
    window.dispatchEvent(keyEvent('keydown', 'ArrowLeft'));
    expect(c.getState().heldDirection).toBe(-1);
    window.dispatchEvent(keyEvent('keyup', 'ArrowLeft'));
    window.dispatchEvent(keyEvent('keydown', 'ArrowRight'));
    expect(c.getState().heldDirection).toBe(1);
    window.dispatchEvent(keyEvent('keyup', 'ArrowRight'));
    expect(c.getState().heldDirection).toBe(0);
  });

  it('supports WASD alongside arrow keys for held direction', () => {
    const c = setup();
    window.dispatchEvent(keyEvent('keydown', 'KeyA'));
    expect(c.getState().heldDirection).toBe(-1);
    window.dispatchEvent(keyEvent('keyup', 'KeyA'));
    window.dispatchEvent(keyEvent('keydown', 'KeyD'));
    expect(c.getState().heldDirection).toBe(1);
  });

  it('reports heldDirection and primaryActionPressed together when both are active', () => {
    const c = setup();
    window.dispatchEvent(keyEvent('keydown', 'ArrowLeft'));
    window.dispatchEvent(keyEvent('keydown', 'Space'));
    const state = c.getState();
    expect(state.heldDirection).toBe(-1);
    expect(state.primaryActionPressed).toBe(true);
  });

  it('pointerX is undefined until a pointer is down', () => {
    const c = setup(300);
    expect(c.getState().pointerX).toBeUndefined();
  });

  it('sets pointerX on pointerdown without requiring a move', () => {
    const c = setup(300);
    vi.spyOn(target, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      width: 300,
    } as DOMRect);
    target.dispatchEvent(new PointerEvent('pointerdown', { cancelable: true, clientX: 120 }));
    expect(c.getState().pointerX).toBe(120);
  });

  it('updates pointerX on pointermove only while the pointer is down', () => {
    const c = setup(300);
    vi.spyOn(target, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      width: 300,
    } as DOMRect);

    window.dispatchEvent(new PointerEvent('pointermove', { clientX: 50 }));
    expect(c.getState().pointerX).toBeUndefined();

    target.dispatchEvent(new PointerEvent('pointerdown', { cancelable: true, clientX: 10 }));
    window.dispatchEvent(new PointerEvent('pointermove', { clientX: 200 }));
    expect(c.getState().pointerX).toBe(200);
  });

  it('resets pointerX on pointerup/touchend', () => {
    const c = setup(300);
    vi.spyOn(target, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      width: 300,
    } as DOMRect);
    target.dispatchEvent(new PointerEvent('pointerdown', { cancelable: true, clientX: 10 }));
    expect(c.getState().pointerX).toBe(10);
    window.dispatchEvent(new PointerEvent('pointerup', { cancelable: true }));
    expect(c.getState().pointerX).toBeUndefined();
  });

  it('converts clientX to logical-pixel X accounting for CSS scaling', () => {
    // Canvas rendered at half its logical size (rect.width=150 for logicalWidth=300):
    // a clientX 30px into the rendered box should map to 60 logical px.
    const c = setup(300);
    vi.spyOn(target, 'getBoundingClientRect').mockReturnValue({
      left: 10,
      width: 150,
    } as DOMRect);
    target.dispatchEvent(new PointerEvent('pointerdown', { cancelable: true, clientX: 40 }));
    expect(c.getState().pointerX).toBe(60);
  });

  it('updates the conversion after setLogicalWidth()', () => {
    const c = setup(300);
    vi.spyOn(target, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      width: 300,
    } as DOMRect);
    c.setLogicalWidth(600);
    target.dispatchEvent(new PointerEvent('pointerdown', { cancelable: true, clientX: 100 }));
    expect(c.getState().pointerX).toBe(200);
  });
});
