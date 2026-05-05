import { useEffect, useRef } from 'react';

/**
 * Run `callback` once on mount and again (trailing-edge debounced) on every
 * window resize. SSR-safe: skips entirely when window is undefined.
 *
 * @param {Function} callback  Function to invoke on resize.
 * @param {number}   [delay=150]  Debounce window in ms.
 */
const useDebouncedWindowResize = (callback, delay = 150) => {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    let timeout = null;
    const handler = () => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        timeout = null;
        callbackRef.current();
      }, delay);
    };

    callbackRef.current();
    window.addEventListener('resize', handler, { passive: true });

    return () => {
      window.removeEventListener('resize', handler);
      if (timeout) clearTimeout(timeout);
    };
  }, [delay]);
};

export default useDebouncedWindowResize;
