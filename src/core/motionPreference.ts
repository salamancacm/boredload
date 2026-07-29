/**
 * Whether the OS/browser has requested reduced motion. Used to skip the
 * canvas minigame entirely and stay in accessible-spinner mode. Returns
 * `false` (never opt out of the game) wherever `matchMedia` isn't available
 * — SSR, older browsers, or non-browser test environments — rather than
 * guessing.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}
