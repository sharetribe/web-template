/**
 * Pick options that Field (and block media Fields) are allowed to see.
 * Keeps section/page options from leaking (defaultClasses, featuredListings, etc.).
 * Extend this allowlist when adding new Field-scoped flags.
 *
 * @param {Object} [options]
 * @returns {{ fieldComponents?: Object, lazyImages?: boolean }}
 */
export const pickFieldOptions = (options = {}) => {
  const { fieldComponents } = options;
  return {
    ...(fieldComponents ? { fieldComponents } : {}),
  };
};
