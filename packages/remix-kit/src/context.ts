import { getContext } from 'unctx';
import type { Remix } from '@remix-kit/schema';

/** Direct access to the Remix context - see https://github.com/unjs/unctx. */
export const remixCtx = getContext<Remix>('remix');

// TODO: Use use/tryUse from unctx. https://github.com/unjs/unctx/issues/6

/**
 * Get access to Remix instance.
 *
 * Throws an error if Remix instance is unavailable.
 *
 * @example
 * ```js
 * const remix = useRemix()
 * ```
 */
export function useRemix(): Remix {
  const instance = remixCtx.tryUse();
  if (!instance) {
    throw new Error('Remix instance is unavailable!');
  }
  return instance;
}

/**
 * Get access to Remix instance.
 *
 * Returns null if Remix instance is unavailable.
 *
 * @example
 * ```js
 * const remix = tryUseRemix()
 * if (remix) {
 *  // Do something
 * }
 * ```
 */
export function tryUseRemix(): Remix | null {
  return remixCtx.tryUse();
}
