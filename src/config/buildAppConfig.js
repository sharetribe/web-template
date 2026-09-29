/**
 * Build app-config slices from registered config handlers.
 *
 * For each handler: collect hosted[assetKey] for each entry in `assetKeys` ->
 * normalize -> validate -> resolve. Resolve prefers usable hosted values;
 * built-in defaults fill gaps.
 *
 * - `id` — key written onto `resolved` (the app-config property for that domain)
 * - `assetKeys` — hosted-assets keys this handler consumes (required, even for one key)
 *
 * Missing hosted keys yield `undefined` entries in the slices object; the handler
 * should fall back to built-in defaults in resolve.
 *
 * Fetching hosted assets stays outside this builder: pass an already-loaded
 * `hosted` object so the same handlers can run for Sharetribe or other hosts.
 *
 * @param {Object} params
 * @param {Object} [params.hosted] hosted config object (e.g. Sharetribe assets)
 * @param {Object} [params.defaults] built-in defaultConfigs
 * @param {Array<Object>} params.handlers ordered config handlers (see configHandlers)
 * @returns {{ resolved: Object, configIssues: Array }}
 *   resolved — `{ [handler.id]: value }` ready to merge into the app config
 *   configIssues — structured issues from validate / invalid handlers
 */
export const buildAppConfig = ({ hosted = {}, defaults = {}, handlers = [] } = {}) => {
  const configIssues = [];
  const resolved = {};
  const ctx = { hosted, defaults, resolved };

  handlers.forEach(handler => {
    const assetKeys = handler?.assetKeys;
    const hasAssetKeys = Array.isArray(assetKeys) && assetKeys.length > 0;

    if (!handler?.id || !hasAssetKeys || typeof handler.resolve !== 'function') {
      configIssues.push({
        level: 'error',
        configId: handler?.id || 'unknown',
        code: 'INVALID_CONFIG_HANDLER',
        message: 'Config handler must define id, assetKeys (non-empty array), and resolve()',
      });
      return;
    }

    const hostedSlices = Object.fromEntries(assetKeys.map(key => [key, hosted?.[key]]));

    const normalized =
      typeof handler.normalize === 'function' ? handler.normalize(hostedSlices, ctx) : hostedSlices;

    const { value, issues = [] } =
      typeof handler.validate === 'function'
        ? handler.validate(normalized, ctx)
        : { value: normalized, issues: [] };

    configIssues.push(...issues.map(issue => ({ configId: handler.id, ...issue })));

    resolved[handler.id] = handler.resolve(value, defaults, ctx);
  });

  return { resolved, configIssues };
};
