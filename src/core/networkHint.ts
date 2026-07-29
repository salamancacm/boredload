interface NetworkInformationLike {
  effectiveType?: string;
}

/**
 * Reads `navigator.connection.effectiveType` (the Network Information API —
 * Chromium-only; unsupported in Safari/Firefox). Returns `undefined`
 * wherever it's unavailable rather than guessing, so callers can no-op.
 */
export function getEffectiveConnectionType(): string | undefined {
  if (typeof navigator === 'undefined') return undefined;
  const connection = (navigator as Navigator & { connection?: NetworkInformationLike })
    .connection;
  return connection?.effectiveType;
}

const SLOW_CONNECTION_TYPES = new Set(['slow-2g', '2g']);

/** True only when the Network Information API confirms a slow connection. */
export function isSlowConnection(): boolean {
  const type = getEffectiveConnectionType();
  return type !== undefined && SLOW_CONNECTION_TYPES.has(type);
}
