// No-op CMS PageBuilder extension. Used as the always-present baseline so the
// hooks always have a safe default.

export const getPageBuilderOptions = () => undefined;

export const transformPageData = ({ pageData }) => pageData;

export const noopPageBuilderExtension = {
  getPageBuilderOptions,
  transformPageData,
};
