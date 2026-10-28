//////////////////////////////////////////////////////////////
// Topbar config handler: hosted /content/top-bar.json only //
// (no local built-in fallbacks)                            //
//////////////////////////////////////////////////////////////

import { configIssue, isNonEmptyString, isPlainObject } from '../config.shared';

const SEARCH_BAR_DISPLAY_OPTIONS = ['always', 'notLandingPage', 'onlySearchPage'];
const LINK_TYPES = ['internal', 'external'];
const LINK_GROUPS = ['primary', 'secondary'];

/**
 * Soft-validate one custom link. Drops invalid entries with a warn.
 *
 * @param {Object} link
 * @param {number} index
 * @returns {{ value: Object|null, issues: Array }}
 */
const validateCustomLink = (link, index) => {
  const issues = [];
  const { type, text, href, group } = isPlainObject(link) ? link : {};
  // Topbar resolves links with href.charAt(0) — missing href crashes the page.
  const valid =
    LINK_TYPES.includes(type) &&
    isNonEmptyString(text) &&
    isNonEmptyString(href) &&
    (group === undefined || LINK_GROUPS.includes(group));

  if (!valid) {
    issues.push(
      configIssue({
        level: 'warn',
        code: 'TOPBAR_INVALID_CUSTOM_LINK',
        message: `A top bar custom link (item ${index + 1}) is invalid and was dropped.`,
      })
    );
    return { value: null, issues };
  }

  return {
    value: {
      type,
      text,
      href,
      ...(LINK_GROUPS.includes(group) ? { group } : {}),
    },
    issues,
  };
};

/**
 * Shape the hosted topbar asset only.
 *
 * @param {Object} hostedSlices values keyed by topbarConfig.assetKeys
 * @returns {Object}
 */
const normalize = hostedSlices => {
  const hostedSlice = hostedSlices?.topbar;
  if (!isPlainObject(hostedSlice)) {
    return {};
  }

  const { logoLink, customLinks, searchBar, postListingsLink } = hostedSlice;
  return {
    ...(isPlainObject(logoLink) ? { logoLink } : {}),
    ...(Array.isArray(customLinks) ? { customLinks } : {}),
    ...(isPlainObject(searchBar) ? { searchBar } : {}),
    ...(isPlainObject(postListingsLink) ? { postListingsLink } : {}),
  };
};

/**
 * Soft-check hosted topbar fields. Invalid pieces are dropped with warns.
 *
 * @param {Object} normalized
 * @returns {{ value: Object, issues: Array }}
 */
const validate = normalized => {
  const issues = [];
  const value = {};

  if (isPlainObject(normalized?.logoLink)) {
    const href = normalized.logoLink.href;
    if (isNonEmptyString(href)) {
      value.logoLink = { href };
    }
  }

  if (Array.isArray(normalized?.customLinks)) {
    const customLinks = [];
    normalized.customLinks.forEach((link, index) => {
      const { value: linkValue, issues: linkIssues } = validateCustomLink(link, index);
      issues.push(...linkIssues);
      if (linkValue) {
        customLinks.push(linkValue);
      }
    });
    if (customLinks.length > 0) {
      value.customLinks = customLinks;
    }
  }

  if (isPlainObject(normalized?.searchBar)) {
    const { display } = normalized.searchBar;
    if (SEARCH_BAR_DISPLAY_OPTIONS.includes(display)) {
      value.searchBar = { display };
    } else if (display !== undefined) {
      issues.push(
        configIssue({
          level: 'warn',
          code: 'TOPBAR_INVALID_SEARCH_BAR',
          message:
            'The top bar search display setting is invalid. Expected always, notLandingPage, or onlySearchPage.',
        })
      );
    }
  }

  if (isPlainObject(normalized?.postListingsLink)) {
    const { showToUnauthenticatedUsers } = normalized.postListingsLink;
    if (typeof showToUnauthenticatedUsers === 'boolean') {
      value.postListingsLink = { showToUnauthenticatedUsers };
    } else if (showToUnauthenticatedUsers !== undefined) {
      issues.push(
        configIssue({
          level: 'warn',
          code: 'TOPBAR_INVALID_POST_LISTINGS_LINK',
          message:
            'The “show post listings to unauthenticated users” setting must be true or false. It was dropped.',
        })
      );
    }
  }

  return { value, issues };
};

/**
 * @param {Object} validated
 * @returns {Object}
 */
const resolve = validated => validated || {};

/**
 * Config handler for the `topbar` app-config key.
 *
 * - id / assetKeys: `topbar`
 * - Hosted: logoLink, customLinks, searchBar, postListingsLink
 * - Missing asset → empty object (Topbar still renders with built-in UI chrome)
 */
export const topbarConfig = {
  id: 'topbar',
  assetKeys: ['topbar'],
  mandatory: false,
  normalize,
  validate,
  resolve,
};
