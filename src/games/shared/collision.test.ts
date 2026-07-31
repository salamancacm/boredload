import { describe, expect, it } from 'vitest';
import { intersects } from './collision';

describe('intersects', () => {
  it('detects overlap', () => {
    expect(
      intersects({ x: 0, y: 0, width: 10, height: 10 }, { x: 5, y: 5, width: 10, height: 10 }),
    ).toBe(true);
  });

  it('detects no overlap', () => {
    expect(
      intersects({ x: 0, y: 0, width: 10, height: 10 }, { x: 20, y: 20, width: 10, height: 10 }),
    ).toBe(false);
  });

  it('treats touching edges as non-overlapping', () => {
    expect(
      intersects({ x: 0, y: 0, width: 10, height: 10 }, { x: 10, y: 0, width: 10, height: 10 }),
    ).toBe(false);
  });

  it('detects one box fully inside another', () => {
    expect(
      intersects({ x: 0, y: 0, width: 100, height: 100 }, { x: 40, y: 40, width: 10, height: 10 }),
    ).toBe(true);
  });
});
