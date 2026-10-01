import { useEffect, useRef, useState } from 'react';

/**
 * Sections at this index and later defer image mounting via IntersectionObserver.
 * Leading sections (0 .. index-1) mount images immediately for SSR / above-the-fold.
 * Tunable: bump if typical landing pages put the fold across more sections.
 */
export const LAZY_IMAGES_FROM_SECTION_INDEX = 2;

/**
 * Prefetch distance for lazy images (~1 viewport above and below).
 * Helps fast scrollers without loading the entire page upfront.
 */
export const DEFAULT_LAZY_ROOT_MARGIN = '100% 0px';

/**
 * Whether section at index should lazy-load images (defer until near viewport).
 *
 * @param {number} index zero-based section index
 * @returns {boolean}
 */
export const isLazyImagesSection = index =>
  typeof index === 'number' && index >= LAZY_IMAGES_FROM_SECTION_INDEX;

/**
 * Pick options that Field (and block media Fields) are allowed to see.
 * Keeps section/page options from leaking (defaultClasses, featuredListings, etc.).
 * Extend this allowlist when adding new Field-scoped flags.
 *
 * @param {Object} [options]
 * @returns {{ fieldComponents?: Object, fetchPriority?: string, lazyImages?: boolean }}
 */
export const pickFieldOptions = (options = {}) => {
  const { fieldComponents, fetchPriority, lazyImages } = options;
  return {
    ...(fieldComponents ? { fieldComponents } : {}),
    ...(fetchPriority ? { fetchPriority } : {}),
    ...(lazyImages ? { lazyImages: true } : {}),
  };
};

/**
 * Client-only check for the IntersectionObserver features we rely on
 * (observe/unobserve, isIntersecting, rootMargin).
 *
 * Do not use this during SSR/initial state: the server has no IO, and treating
 * that as "unsupported" would SSR-mount every image and defeat lazy loading
 * after hydration on modern browsers. Unsupported clients fall back inside
 * useLazyLoad's effect instead.
 *
 * @returns {boolean}
 */
export const supportsLazyImageLoading = () =>
  typeof window !== 'undefined' && typeof IntersectionObserver === 'function';

// Shared IntersectionObservers keyed by rootMargin (one observer, many targets)
const observersByRootMargin = new Map();
const intersectionCallbacks = new WeakMap();

const getSharedObserver = rootMargin => {
  if (!supportsLazyImageLoading()) {
    return null;
  }

  let observer = observersByRootMargin.get(rootMargin);
  if (!observer) {
    observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) {
            return;
          }
          const onIntersect = intersectionCallbacks.get(entry.target);
          if (onIntersect) {
            onIntersect();
            observer.unobserve(entry.target);
            intersectionCallbacks.delete(entry.target);
          }
        });
      },
      { root: null, rootMargin, threshold: 0 }
    );
    observersByRootMargin.set(rootMargin, observer);
  }
  return observer;
};

/**
 * Optionally defer mounting until the layout shell nears the viewport.
 * Default (lazy=false): shouldLoad is true immediately (SSR-safe).
 * When lazy=true: omit media until near viewport (or until IO is missing → mount).
 *
 * @param {Object} options
 * @param {boolean} [options.lazy=false] defer mount until near viewport
 * @param {string} [options.rootMargin] IntersectionObserver rootMargin
 * @returns {[React.RefObject, boolean]} [shellRef, shouldLoad]
 */
export const useLazyLoad = (options = {}) => {
  const { lazy = false, rootMargin = DEFAULT_LAZY_ROOT_MARGIN } = options;
  const shellRef = useRef(null);
  const [shouldLoad, setShouldLoad] = useState(() => !lazy);

  useEffect(() => {
    if (!lazy) {
      setShouldLoad(true);
      return;
    }
    if (shouldLoad) {
      return;
    }

    // No IO (e.g. IE11): do not use lazy loading at all — mount immediately.
    if (!supportsLazyImageLoading()) {
      setShouldLoad(true);
      return;
    }

    const element = shellRef.current;
    if (!element) {
      return;
    }

    const observer = getSharedObserver(rootMargin);
    if (!observer) {
      setShouldLoad(true);
      return;
    }

    const onIntersect = () => setShouldLoad(true);
    intersectionCallbacks.set(element, onIntersect);
    observer.observe(element);

    return () => {
      observer.unobserve(element);
      intersectionCallbacks.delete(element);
    };
  }, [lazy, rootMargin, shouldLoad]);

  return [shellRef, !lazy || shouldLoad];
};
