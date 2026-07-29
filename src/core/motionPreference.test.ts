import { afterEach, describe, expect, it, vi } from 'vitest';
import { prefersReducedMotion } from './motionPreference';

describe('prefersReducedMotion', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns false when matchMedia is unavailable', () => {
    const original = window.matchMedia;
    // @ts-expect-error - simulating an environment without matchMedia (SSR/older browsers).
    delete window.matchMedia;
    expect(prefersReducedMotion()).toBe(false);
    window.matchMedia = original;
  });

  it('returns true when the media query matches', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({ matches: true }) as unknown as typeof window.matchMedia,
    );
    expect(prefersReducedMotion()).toBe(true);
  });

  it('returns false when the media query does not match', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({ matches: false }) as unknown as typeof window.matchMedia,
    );
    expect(prefersReducedMotion()).toBe(false);
  });

  it('returns false instead of throwing if matchMedia itself throws', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => {
        throw new Error('unsupported');
      }) as unknown as typeof window.matchMedia,
    );
    expect(prefersReducedMotion()).toBe(false);
  });
});
