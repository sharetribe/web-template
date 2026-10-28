/////////////////////////////////////////////////////////////////
// Footer config handler: hosted /content/footer.json only     //
// (no local built-in fallbacks; missing asset → no Footer UI) //
/////////////////////////////////////////////////////////////////

import { configIssue, isPlainObject } from '../config.shared';

/**
 * Shape the hosted footer asset only.
 * Content is PageBuilder section data (blocks, slogan, social links, …) — keep as-is.
 *
 * @param {Object} hostedSlices values keyed by footerConfig.assetKeys
 * @returns {Object}
 */
const normalize = hostedSlices => {
  const hostedSlice = hostedSlices?.footer;
  return isPlainObject(hostedSlice) ? hostedSlice : {};
};

/**
 * Soft-check hosted footer. Non-object / empty → {} (FooterContainer skips render).
 *
 * @param {Object} normalized
 * @returns {{ value: Object, issues: Array }}
 */
const validate = normalized => {
  const issues = [];

  if (!isPlainObject(normalized)) {
    issues.push(
      configIssue({
        level: 'warn',
        code: 'FOOTER_INVALID',
        message: 'The footer config is invalid and was ignored. The footer will not be shown.',
      })
    );
    return { value: {}, issues };
  }

  return { value: normalized, issues };
};

/**
 * @param {Object} validated
 * @returns {Object}
 */
const resolve = validated => validated || {};

/**
 * Config handler for the `footer` app-config key.
 *
 * - id / assetKeys: `footer`
 * - Hosted: PageBuilder section content for SectionFooter
 * - Missing asset → empty object (FooterContainer does not render)
 */
export const footerConfig = {
  id: 'footer',
  assetKeys: ['footer'],
  mandatory: false,
  normalize,
  validate,
  resolve,
};
