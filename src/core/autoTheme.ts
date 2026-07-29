import type { Theme } from './types';

const CSS_VAR_MAP: Record<keyof Theme, string> = {
  background: '--boredload-background',
  ground: '--boredload-ground',
  player: '--boredload-player',
  obstacle: '--boredload-obstacle',
  text: '--boredload-text',
  accent: '--boredload-accent',
};

const MAX_ANCESTOR_WALK = 12;

/**
 * Reads `--boredload-*` CSS custom properties starting at `el` and walking
 * up its ancestors (custom properties inherit, so any ancestor in the
 * consumer's DOM can define them). Real browsers already resolve
 * inheritance inside `getComputedStyle`, but jsdom (used in tests) does
 * not — walking manually keeps behavior consistent in both. Precedence:
 * explicit `overrides` > the nearest CSS var found > unset.
 */
export function resolveAutoTheme(el: Element, overrides?: Partial<Theme>): Partial<Theme> {
  if (typeof window === 'undefined' || typeof window.getComputedStyle !== 'function') {
    return { ...overrides };
  }

  const fromCss: Partial<Theme> = {};
  let node: Element | null = el;
  let steps = 0;
  const remainingKeys = new Set(Object.keys(CSS_VAR_MAP) as (keyof Theme)[]);

  while (node && remainingKeys.size > 0 && steps < MAX_ANCESTOR_WALK) {
    const computed = window.getComputedStyle(node);
    for (const key of [...remainingKeys]) {
      const value = computed.getPropertyValue(CSS_VAR_MAP[key]).trim();
      if (value) {
        fromCss[key] = value;
        remainingKeys.delete(key);
      }
    }
    node = node.parentElement;
    steps += 1;
  }

  return { ...fromCss, ...overrides };
}
