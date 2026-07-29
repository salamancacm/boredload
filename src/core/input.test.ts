import { afterEach, describe, expect, it } from 'vitest';
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

  function setup(): InputController {
    target = document.createElement('div');
    document.body.appendChild(target);
    controller = new InputController(target);
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
    window.dispatchEvent(keyEvent('keydown', 'KeyA'));
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
});
