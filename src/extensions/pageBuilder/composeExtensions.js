// Compose multiple CMS PageBuilder extensions into a single hook surface.
// Mirrors src/extensions/landingPage/composeExtensions.js — same merge rules.

const mergePageBuilderOptions = (base, next) => {
  if (!base) return next;
  if (!next) return base;
  const baseSectionComponents = base?.sectionComponents || {};
  const nextSectionComponents = next?.sectionComponents || {};
  return {
    ...base,
    ...next,
    sectionComponents: { ...baseSectionComponents, ...nextSectionComponents },
  };
};

const createSafeHook = hook => {
  const extensionHook = hook || {};
  return {
    getPageBuilderOptions: extensionHook.getPageBuilderOptions || (() => undefined),
    transformPageData: extensionHook.transformPageData || (({ pageData }) => pageData),
  };
};

export const composePageBuilderExtensions = extensionHooks => {
  const hooks = (extensionHooks || []).map(createSafeHook);
  return {
    getPageBuilderOptions: args =>
      hooks.reduce((collected, hook) => {
        const options = hook.getPageBuilderOptions(args);
        return mergePageBuilderOptions(collected, options);
      }, undefined),
    transformPageData: args =>
      hooks.reduce((pageData, hook) => hook.transformPageData({ ...args, pageData }), args.pageData),
  };
};
