import { describe, expect, it } from 'vitest';
import { resizeCanvasToDisplaySize } from './canvas';

describe('resizeCanvasToDisplaySize', () => {
  it('scales the backing store by the given DPR', () => {
    const canvas = document.createElement('canvas');
    const viewport = resizeCanvasToDisplaySize(canvas, 300, 150, 2);
    expect(canvas.width).toBe(600);
    expect(canvas.height).toBe(300);
    expect(canvas.style.width).toBe('300px');
    expect(canvas.style.height).toBe('150px');
    expect(viewport).toEqual({ width: 300, height: 150, dpr: 2 });
  });

  it('defaults to dpr 1 when none is provided and window.devicePixelRatio is unset', () => {
    const canvas = document.createElement('canvas');
    const viewport = resizeCanvasToDisplaySize(canvas, 100, 50, 1);
    expect(canvas.width).toBe(100);
    expect(canvas.height).toBe(50);
    expect(viewport.dpr).toBe(1);
  });

  it('rounds fractional device pixel sizes', () => {
    const canvas = document.createElement('canvas');
    resizeCanvasToDisplaySize(canvas, 101, 51, 1.5);
    expect(canvas.width).toBe(Math.round(101 * 1.5));
    expect(canvas.height).toBe(Math.round(51 * 1.5));
  });
});
