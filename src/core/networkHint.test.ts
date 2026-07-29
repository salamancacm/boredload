import { afterEach, describe, expect, it } from 'vitest';
import { getEffectiveConnectionType, isSlowConnection } from './networkHint';

describe('networkHint', () => {
  afterEach(() => {
    // @ts-expect-error - test-only cleanup of a property we defined below.
    delete navigator.connection;
  });

  it('returns undefined when navigator.connection is unavailable', () => {
    expect(getEffectiveConnectionType()).toBeUndefined();
    expect(isSlowConnection()).toBe(false);
  });

  it('reads effectiveType when navigator.connection exists', () => {
    Object.defineProperty(navigator, 'connection', {
      value: { effectiveType: '3g' },
      configurable: true,
    });
    expect(getEffectiveConnectionType()).toBe('3g');
    expect(isSlowConnection()).toBe(false);
  });

  it('treats slow-2g and 2g as slow connections', () => {
    Object.defineProperty(navigator, 'connection', {
      value: { effectiveType: 'slow-2g' },
      configurable: true,
    });
    expect(isSlowConnection()).toBe(true);

    Object.defineProperty(navigator, 'connection', {
      value: { effectiveType: '2g' },
      configurable: true,
    });
    expect(isSlowConnection()).toBe(true);
  });

  it('treats 4g as not slow', () => {
    Object.defineProperty(navigator, 'connection', {
      value: { effectiveType: '4g' },
      configurable: true,
    });
    expect(isSlowConnection()).toBe(false);
  });
});
