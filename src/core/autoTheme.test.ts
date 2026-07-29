import { describe, expect, it } from 'vitest';
import { resolveAutoTheme } from './autoTheme';

describe('resolveAutoTheme', () => {
  it('returns just the overrides when no CSS vars are set', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    expect(resolveAutoTheme(el, { accent: '#fff' })).toEqual({ accent: '#fff' });
    el.remove();
  });

  it('reads --boredload-* custom properties from the element', () => {
    const el = document.createElement('div');
    el.style.setProperty('--boredload-accent', '#ff5470');
    el.style.setProperty('--boredload-player', '#38bdf8');
    document.body.appendChild(el);

    const theme = resolveAutoTheme(el);
    expect(theme.accent).toBe('#ff5470');
    expect(theme.player).toBe('#38bdf8');
    expect(theme.background).toBeUndefined();
    el.remove();
  });

  it('inherits custom properties declared on an ancestor', () => {
    const parent = document.createElement('div');
    parent.style.setProperty('--boredload-obstacle', '#f472b6');
    const child = document.createElement('div');
    parent.appendChild(child);
    document.body.appendChild(parent);

    expect(resolveAutoTheme(child).obstacle).toBe('#f472b6');
    parent.remove();
  });

  it('lets explicit overrides win over CSS vars', () => {
    const el = document.createElement('div');
    el.style.setProperty('--boredload-accent', '#ff5470');
    document.body.appendChild(el);

    expect(resolveAutoTheme(el, { accent: '#000000' }).accent).toBe('#000000');
    el.remove();
  });
});
