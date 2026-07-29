import { beforeEach, describe, expect, it } from 'vitest';
import { getHighScore, setHighScore } from './highScore';

describe('highScore', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('returns 0 when nothing is stored', () => {
    expect(getHighScore('boredload:test')).toBe(0);
  });

  it('persists a new high score and returns it', () => {
    expect(setHighScore('boredload:test', 42)).toBe(42);
    expect(getHighScore('boredload:test')).toBe(42);
  });

  it('does not overwrite a higher existing score', () => {
    setHighScore('boredload:test', 100);
    expect(setHighScore('boredload:test', 50)).toBe(100);
    expect(getHighScore('boredload:test')).toBe(100);
  });

  it('overwrites when the new score is strictly greater', () => {
    setHighScore('boredload:test', 10);
    expect(setHighScore('boredload:test', 11)).toBe(11);
  });

  it('ignores malformed stored values instead of throwing', () => {
    window.localStorage.setItem('boredload:test', 'not-a-number');
    expect(getHighScore('boredload:test')).toBe(0);
  });

  it('keeps separate scores per key', () => {
    setHighScore('boredload:dino-runner', 7);
    setHighScore('boredload:other-game', 3);
    expect(getHighScore('boredload:dino-runner')).toBe(7);
    expect(getHighScore('boredload:other-game')).toBe(3);
  });
});
