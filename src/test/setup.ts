import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

/**
 * jsdom does not implement the 2D canvas API. We stub just enough of
 * CanvasRenderingContext2D for our render code to run without throwing,
 * without pulling in a canvas-mocking dependency.
 */
function createContext2DStub(): Partial<CanvasRenderingContext2D> {
  return {
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    strokeRect: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc: vi.fn(),
    arcTo: vi.fn(),
    ellipse: vi.fn(),
    clip: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    fillText: vi.fn(),
    strokeText: vi.fn(),
    setTransform: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    measureText: vi.fn(() => ({ width: 0 }) as TextMetrics),
    createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() }) as unknown as CanvasGradient),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() }) as unknown as CanvasGradient),
    // Style properties get/set as plain fields.
    fillStyle: '#000000',
    strokeStyle: '#000000',
    lineWidth: 1,
    font: '',
    textAlign: 'start',
    textBaseline: 'alphabetic',
    globalAlpha: 1,
  };
}

HTMLCanvasElement.prototype.getContext = vi.fn(function (
  this: HTMLCanvasElement,
  contextId: string,
) {
  if (contextId === '2d') {
    return createContext2DStub() as CanvasRenderingContext2D;
  }
  return null;
}) as unknown as HTMLCanvasElement['getContext'];

if (typeof globalThis.ResizeObserver === 'undefined') {
  class ResizeObserverStub {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }
  // @ts-expect-error - test-only stub, not a full ResizeObserver implementation.
  globalThis.ResizeObserver = ResizeObserverStub;
}

if (typeof globalThis.PointerEvent === 'undefined') {
  class PointerEventStub extends MouseEvent {
    constructor(type: string, params: MouseEventInit = {}) {
      super(type, params);
    }
  }
  // @ts-expect-error - minimal PointerEvent stub, jsdom does not implement it.
  globalThis.PointerEvent = PointerEventStub;
}

if (typeof globalThis.requestAnimationFrame === 'undefined') {
  globalThis.requestAnimationFrame = (cb: FrameRequestCallback): number =>
    setTimeout(() => cb(performance.now()), 16) as unknown as number;
  globalThis.cancelAnimationFrame = (id: number): void => clearTimeout(id);
}
