///////////////////////////////////////////////////////////////////////
// Access control config handler: hosted configs + built-in defaults //
// Hosted asset path: /general/access-control.json                   //
///////////////////////////////////////////////////////////////////////

import { configIssue, isNonEmptyString, isPlainObject } from '../config.shared';

const USER_PERMISSIONS = [
  'requireApprovalToJoin',
  'requirePermissionToRead',
  'requirePermissionToPostListings',
  'requirePermissionToInitiateTransactions',
];

const USER_PERMISSION_OPTIONS = [
  'requireApprovalToJoinOptions',
  'requirePermissionToReadOptions',
  'requirePermissionToPostListingsOptions',
  'requirePermissionToInitiateTransactionsOptions',
];

const LISTING_PERMISSIONS = ['requireApprovalToPublish'];
const LISTING_PERMISSION_OPTIONS = ['requireApprovalToPublishOptions'];

/**
 * Merge hosted accessControl with built-in defaults.
 * Hosted marketplace flags take priority when present; built-ins fill gaps.
 * Other hosted keys (users, listings, …) are kept when present.
 *
 * @param {Object} hostedAccessControl normalized hosted slice (accessControl asset)
 * @param {Object} defaultAccessControl built-in defaults from defaultAccessControl.js
 * @returns {Object} accessControl config including marketplace defaults
 */
export const mergeAccessControlConfig = (hostedAccessControl, defaultAccessControl = {}) => {
  const accessControl = hostedAccessControl || {};
  const defaultMarketplace = defaultAccessControl?.marketplace || {};
  const hostedMarketplace = accessControl?.marketplace || {};
  return {
    ...accessControl,
    marketplace: {
      private: false,
      fileUploadAndDownloadDisabled: false,
      ...defaultMarketplace,
      ...hostedMarketplace,
    },
  };
};

/**
 * Soft-validate a permission Options.callToAction block.
 * @param {Object} options
 * @param {string} pathLabel e.g. accessControl.users.requireApprovalToJoinOptions
 * @returns {{ value: Object|null, issues: Array }}
 */
const validatePermissionOptions = (options, optionsKey) => {
  const issues = [];
  const { type, text, href } = options?.callToAction || {};
  const hasLink = isNonEmptyString(text) && isNonEmptyString(href);
  const callToAction =
    type === 'none'
      ? { type }
      : (type === 'internal' || type === 'external') && hasLink
      ? { type, text, href }
      : null;

  if (!callToAction) {
    issues.push(
      configIssue({
        level: 'warn',
        code: 'ACCESS_CONTROL_INVALID_CTA',
        message: `The call-to-action for "${optionsKey}" is invalid and was dropped.`,
      })
    );
    return { value: null, issues };
  }

  return { value: { callToAction }, issues };
};

/**
 * Soft-validate a hosted permissions object (users or listings).
 * Keeps known boolean flags and Options; drops invalid fields with warns.
 *
 * @param {'users'|'listings'} kind
 * @param {string[]} permissions
 * @param {string[]} permissionOptions
 * @returns {(hostedPermissions: Object) => { value: Object|null, issues: Array }}
 */
const validatePermissions = (kind, permissions, permissionOptions) => hostedPermissions => {
  const issues = [];
  const value = {};

  if (!isPlainObject(hostedPermissions)) {
    return { value: null, issues };
  }

  permissions.forEach(key => {
    if (!(key in hostedPermissions)) {
      return;
    }
    if (typeof hostedPermissions[key] === 'boolean') {
      value[key] = hostedPermissions[key];
    } else {
      issues.push(
        configIssue({
          level: 'warn',
          code: 'ACCESS_CONTROL_INVALID_PERMISSION_FLAG',
          message: `The access-control setting "accessControl.${kind}.${key}" must be true or false. It was dropped.`,
        })
      );
    }
  });

  permissionOptions.forEach(key => {
    if (!(key in hostedPermissions)) {
      return;
    }
    const { value: optionsValue, issues: optionsIssues } = validatePermissionOptions(
      hostedPermissions[key],
      key
    );
    issues.push(...optionsIssues);
    if (optionsValue) {
      value[key] = optionsValue;
    }
  });

  return { value: Object.keys(value).length > 0 ? value : null, issues };
};

const validateUserPermissions = validatePermissions(
  'users',
  USER_PERMISSIONS,
  USER_PERMISSION_OPTIONS
);
const validateListingPermissions = validatePermissions(
  'listings',
  LISTING_PERMISSIONS,
  LISTING_PERMISSION_OPTIONS
);

/**
 * Shape the hosted accessControl asset only.
 * Keeps marketplace + known users/listings keys for validate.
 *
 * @param {Object} hostedSlices values keyed by accessControlConfig.assetKeys
 * @returns {Object}
 */
const normalize = hostedSlices => {
  const hostedSlice = hostedSlices?.accessControl;
  if (!isPlainObject(hostedSlice)) {
    return {};
  }

  const marketplace = isPlainObject(hostedSlice.marketplace) ? hostedSlice.marketplace : undefined;
  const users = isPlainObject(hostedSlice.users) ? hostedSlice.users : undefined;
  const listings = isPlainObject(hostedSlice.listings) ? hostedSlice.listings : undefined;

  const shapedMarketplace = marketplace
    ? {
        ...('private' in marketplace ? { private: marketplace.private } : {}),
        ...('fileUploadAndDownloadDisabled' in marketplace
          ? { fileUploadAndDownloadDisabled: marketplace.fileUploadAndDownloadDisabled }
          : {}),
      }
    : undefined;

  const pickKnown = (src, keys) => {
    if (!src) {
      return undefined;
    }
    const out = keys.reduce((acc, key) => {
      if (key in src) {
        acc[key] = src[key];
      }
      return acc;
    }, {});
    return Object.keys(out).length > 0 ? out : undefined;
  };

  const shapedUsers = pickKnown(users, [...USER_PERMISSIONS, ...USER_PERMISSION_OPTIONS]);
  const shapedListings = pickKnown(listings, [
    ...LISTING_PERMISSIONS,
    ...LISTING_PERMISSION_OPTIONS,
  ]);

  return {
    ...(shapedMarketplace && Object.keys(shapedMarketplace).length > 0
      ? { marketplace: shapedMarketplace }
      : {}),
    ...(shapedUsers ? { users: shapedUsers } : {}),
    ...(shapedListings ? { listings: shapedListings } : {}),
  };
};

/**
 * Soft-check hosted marketplace flags and users/listings permission shape.
 * Invalid values are dropped (resolve uses marketplace built-ins and omit bad CTAs).
 *
 * @param {Object} normalized
 * @returns {{ value: Object, issues: Array }}
 */
const validate = normalized => {
  const issues = [];
  const value = {};
  const src = normalized?.marketplace;

  if (isPlainObject(src)) {
    const marketplace = {};

    if ('private' in src) {
      if (typeof src.private === 'boolean') {
        marketplace.private = src.private;
      } else {
        issues.push(
          configIssue({
            level: 'warn',
            code: 'ACCESS_CONTROL_INVALID_PRIVATE',
            message:
              'The “private marketplace” setting must be true or false. Using the built-in default instead.',
          })
        );
      }
    }

    if ('fileUploadAndDownloadDisabled' in src) {
      if (typeof src.fileUploadAndDownloadDisabled === 'boolean') {
        marketplace.fileUploadAndDownloadDisabled = src.fileUploadAndDownloadDisabled;
      } else {
        issues.push(
          configIssue({
            level: 'warn',
            code: 'ACCESS_CONTROL_INVALID_FILE_UPLOAD',
            message:
              'The “disable file uploads and downloads” setting must be true or false. Using the built-in default instead.',
          })
        );
      }
    }

    if (Object.keys(marketplace).length > 0) {
      value.marketplace = marketplace;
    }
  }

  const { value: users, issues: usersIssues } = validateUserPermissions(normalized?.users);
  issues.push(...usersIssues);
  if (users) {
    value.users = users;
  }

  const { value: listings, issues: listingsIssues } = validateListingPermissions(
    normalized?.listings
  );
  issues.push(...listingsIssues);
  if (listings) {
    value.listings = listings;
  }

  return { value, issues };
};

/**
 * @param {Object} validated
 * @param {Object} defaults full defaultConfigs
 * @returns {Object}
 */
const resolve = (validated, defaults) =>
  mergeAccessControlConfig(validated, defaults?.accessControl);

/**
 * Config handler for the `accessControl` app-config key.
 *
 * - id / assetKeys: `accessControl`
 * - Hosted: marketplace flags; users / listings permission flags + CTA options
 * - Missing/invalid marketplace flags → built-in defaults (both false)
 * - Invalid users/listings fields → warn + drop (CTA omitted)
 */
export const accessControlConfig = {
  id: 'accessControl',
  assetKeys: ['accessControl'],
  mandatory: false,
  normalize,
  validate,
  resolve,
};
