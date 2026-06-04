export const cloneJsonLike = <T>(value: T): T => {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof globalThis.structuredClone === 'function') {
    try {
      return globalThis.structuredClone(value);
    } catch {
      // Fall through to JSON cloning for JSON-like trace snapshots.
    }
  }

  const serialized = JSON.stringify(value);
  return serialized === undefined ? value : (JSON.parse(serialized) as T);
};

const normalizeForStableStringify = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(normalizeForStableStringify);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value as Record<string, unknown>)
        .sort()
        .map((key) => [key, normalizeForStableStringify((value as Record<string, unknown>)[key])])
    );
  }

  return value;
};

export const stableStringifyJsonLike = (value: unknown): string =>
  JSON.stringify(normalizeForStableStringify(value));
