import type { Viewport } from './types';

/**
 * Resizes and DPR-scales a canvas so drawing stays crisp on high-density
 * displays. Sets the canvas's backing-store size in device pixels and its
 * CSS size in logical pixels, then scales the 2D context so callers can
 * keep drawing in logical (CSS) pixel coordinates.
 */
export function resizeCanvasToDisplaySize(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  dpr: number = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
): Viewport {
  const deviceWidth = Math.max(1, Math.round(width * dpr));
  const deviceHeight = Math.max(1, Math.round(height * dpr));

  if (canvas.width !== deviceWidth || canvas.height !== deviceHeight) {
    canvas.width = deviceWidth;
    canvas.height = deviceHeight;
  }

  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  return { width, height, dpr };
}

export type ResizeListenerCleanup = () => void;

/**
 * Observes size changes on `target` (via ResizeObserver when available,
 * falling back to `window.resize`) and invokes `onResize` with the new
 * content-box size in CSS pixels.
 */
export function observeResize(
  target: HTMLElement,
  onResize: (width: number, height: number) => void,
): ResizeListenerCleanup {
  if (typeof ResizeObserver !== 'undefined') {
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const box = entry.contentBoxSize?.[0];
        if (box) {
          onResize(box.inlineSize, box.blockSize);
        } else {
          const rect = entry.target.getBoundingClientRect();
          onResize(rect.width, rect.height);
        }
      }
    });
    ro.observe(target);
    return () => ro.disconnect();
  }

  const handler = () => {
    const rect = target.getBoundingClientRect();
    onResize(rect.width, rect.height);
  };
  window.addEventListener('resize', handler);
  return () => window.removeEventListener('resize', handler);
}
