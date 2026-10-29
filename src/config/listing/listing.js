///////////////////////////////////////////////////////////////////////////
// Listing config handler: hosted listingTypes + listingFields           //
///////////////////////////////////////////////////////////////////////////

import {
  configIssue,
  validBoolean,
  validEnumString,
  validHelpText,
  validLabel,
  validNumberConfig,
  validPlaceholderMessage,
  validRequiredMessage,
  validSchemaOptions,
  union,
  mergeDefaultTypesAndFieldsForDebugging,
} from '../config.shared';
import {
  getSupportedProcessesInfo,
  BOOKING_PROCESS_NAME,
  PURCHASE_PROCESS_NAME,
  NEGOTIATION_PROCESS_NAME,
} from '../../transactions/transaction';
import { EXTENDED_DATA_SCHEMA_TYPES } from '../../util/types';

// Letters, numbers, dashes, underscores — no spaces
// (listing type ids, transaction field keys — same URL-safe slug style).
const LISTING_ENTITY_KEY_PATTERN = /^[a-zA-Z0-9_\-]+$/;

// Listing field keys: must start with a letter; letters, numbers, underscores only (no dashes).
const LISTING_FIELD_KEY_PATTERN = /^[a-zA-Z][a-zA-Z0-9_]*$/;

const BUILT_IN_PUBLIC_DATA_KEYS = [
  'listingType',
  'transactionProcessAlias',
  'unitType',
  'location',
  'pickupEnabled',
  'shippingEnabled',
  'shippingPriceInSubunitsOneItem',
  'shippingPriceInSubunitsAdditionalItems',
  'categoryLevel1',
  'categoryLevel2',
  'categoryLevel3',
  'cardStyle',
];

/**
 * Whether a listing type id matches the hosted listingTypes asset pattern.
 * @param {*} id
 * @returns {boolean}
 */
export const isValidListingTypeId = id =>
  typeof id === 'string' && LISTING_ENTITY_KEY_PATTERN.test(id);

/**
 * Whether a listing type label is a non-empty string (required on hosted listing types).
 * @param {*} label
 * @returns {boolean}
 */
export const isValidListingTypeLabel = label =>
  typeof label === 'string' && label.trim().length >= 1;

/**
 * Whether a transaction field key matches the same URL-safe pattern as listing type ids
 * (letters, numbers, dashes, underscores).
 * @param {*} key
 * @returns {boolean}
 */
export const isValidTransactionFieldKey = key =>
  typeof key === 'string' && LISTING_ENTITY_KEY_PATTERN.test(key);

/**
 * Whether a listing field key matches the hosted listingFields asset pattern.
 * @param {*} key
 * @returns {boolean}
 */
export const isValidListingFieldKey = key =>
  typeof key === 'string' && LISTING_FIELD_KEY_PATTERN.test(key);

/**
 * Whether a listing field key is reserved (exact built-in keys or `priceVariant*` prefix).
 * @param {string} key
 * @returns {boolean}
 */
export const isReservedListingFieldKey = key =>
  typeof key === 'string' &&
  (BUILT_IN_PUBLIC_DATA_KEYS.includes(key) || key.startsWith('priceVariant'));

/**
 * Whether any listing field key clashes with built-in public data keys.
 * @param {Array} listingFields
 * @returns {boolean}
 */
export const hasClashWithBuiltInPublicDataKey = listingFields => {
  if (!Array.isArray(listingFields)) {
    return false;
  }
  return listingFields.some(field => isReservedListingFieldKey(field?.key));
};

///////////////////////////////////////
// Restructure hosted listing config //
///////////////////////////////////////

const restructureListingTypes = hostedListingTypes => {
  return (
    hostedListingTypes?.map(listingType => {
      const { id, label, transactionProcess, unitType, ...rest } = listingType;
      return transactionProcess
        ? {
            listingType: id,
            label,
            transactionType: {
              process: transactionProcess.name,
              alias: transactionProcess.alias,
              unitType,
            },
            ...rest,
          }
        : null;
    }) || []
  );
};

const restructureListingFields = hostedListingFields => {
  return (
    hostedListingFields?.map(listingField => {
      const {
        key,
        scope,
        schemaType,
        enumOptions,
        label,
        displayOnListingPage,
        filterConfig = {},
        showConfig = {},
        saveConfig = {},
        numberConfig = {},
        categoryConfig = {},
        ...rest
      } = listingField;
      const defaultLabel = label || key;
      const enumOptionsMaybe = ['enum', 'multi-enum'].includes(schemaType) ? { enumOptions } : {};
      const numberConfigMaybe = schemaType === 'long' ? { numberConfig } : {};
      const { required: isRequired, ...restSaveConfig } = saveConfig;

      return key
        ? {
            key,
            label,
            scope,
            schemaType,
            ...enumOptionsMaybe,
            ...numberConfigMaybe,
            filterConfig: {
              ...filterConfig,
              label: filterConfig.label || defaultLabel,
            },
            showConfig: {
              ...showConfig,
              label: showConfig.label || defaultLabel,
              displayOnListingPage,
            },
            saveConfig: {
              ...restSaveConfig,
              isRequired,
              label: saveConfig.label || defaultLabel,
            },
            categoryConfig,
            ...rest,
          }
        : null;
    }) || []
  );
};

const restructureTransactionFields = transactionField => {
  const {
    key,
    enumOptions,
    label,
    numberConfig = {},
    saveConfig = {},
    showConfig = {},
    schemaType,
    ...rest
  } = transactionField;

  const defaultLabel = label || key;
  const enumOptionsMaybe = ['enum', 'multi-enum'].includes(schemaType) ? { enumOptions } : {};
  const numberConfigMaybe = schemaType === 'long' ? { numberConfig } : {};
  const { required: isRequired, ...restSaveConfig } = saveConfig;

  return key
    ? {
        key,
        label,
        scope: 'protected',
        schemaType,
        ...enumOptionsMaybe,
        ...numberConfigMaybe,
        showConfig: {
          ...showConfig,
          unselectedOptions: false,
          label: showConfig.label || defaultLabel,
        },
        saveConfig: {
          ...restSaveConfig,
          isRequired,
          label: saveConfig.label || defaultLabel,
        },
        ...rest,
      }
    : null;
};

////////////////////////////////////
// Validate listing fields config //
////////////////////////////////////

// TODO: this (includeForListingTypes) is deprecated config key!
// You should change your built-in listing field configs:
// do not use includeForListingTypes but listingTypeConfig: { limitToListingTypeIds, listingTypeIds }
const validListingTypesForBuiltInSetup = (includeForListingTypes, listingTypesInUse) => {
  const isUndefinedOrNull = includeForListingTypes == null;
  const isArray = Array.isArray(includeForListingTypes);
  const validatedListingTypes = isArray
    ? includeForListingTypes.filter(pa => listingTypesInUse.includes(pa))
    : [];

  const hasValidListingTypes = validatedListingTypes.length > 0;
  const isValid = hasValidListingTypes || isUndefinedOrNull;
  const validValue = hasValidListingTypes
    ? { listingTypeConfig: { limitToListingTypeIds: true, listingTypeIds: validatedListingTypes } }
    : isUndefinedOrNull
    ? { listingTypeConfig: { limitToListingTypeIds: false } }
    : {};
  return [isValid, validValue];
};

const quoteIds = ids => (ids || []).map(id => `"${id}"`).join(', ');

const unknownIdsReason = (label, ids) => {
  if (!Array.isArray(ids)) {
    return `${label} must be an array`;
  }
  if (ids.length === 0) {
    return `${label} is empty`;
  }
  return `unknown ${label}: ${quoteIds(ids)}`;
};

const validListingTypesForListingTypeConfig = (listingTypeConfig, listingTypesInUse) => {
  const { limitToListingTypeIds, listingTypeIds } = listingTypeConfig || {};

  if (!listingTypesInUse) {
    const isValid = true;
    const validValue = {
      listingTypeConfig: {
        limitToListingTypeIds: false,
      },
    };

    return [isValid, validValue];
  }

  const isArray = Array.isArray(listingTypeIds);
  const validatedListingTypeIds = isArray
    ? listingTypeIds.filter(c => listingTypesInUse?.includes(c))
    : [];
  const unknownListingTypeIds = isArray
    ? listingTypeIds.filter(c => !listingTypesInUse?.includes(c))
    : [];

  const hasValidListingTypeIds = validatedListingTypeIds.length > 0;
  const isValid = hasValidListingTypeIds || !limitToListingTypeIds;

  const validValue = hasValidListingTypeIds
    ? {
        listingTypeConfig: {
          limitToListingTypeIds,
          listingTypeIds: validatedListingTypeIds,
        },
      }
    : { listingTypeConfig: { limitToListingTypeIds: false } };
  const reason = isValid
    ? undefined
    : unknownIdsReason('listing type id(s)', isArray ? unknownListingTypeIds : listingTypeIds);
  return [isValid, validValue, reason];
};

const getCategoryIds = categories => {
  return categories.reduce((picked, conf) => {
    const { id, subcategories } = conf;
    return Array.isArray(subcategories) && subcategories.length > 0
      ? [...picked, id, ...getCategoryIds(subcategories)]
      : [...picked, id];
  }, []);
};

const validListingTypesForCategoryConfig = (categoryConfig, categoriesInUse) => {
  const { limitToCategoryIds, categoryIds } = categoryConfig || {};

  // When no categories are in use (missing or empty tree), fields cannot be limited
  // to a subset of category ids — clear the limit and keep the field.
  // Note: treat [] like missing; empty arrays are truthy in JS.
  if (!categoriesInUse?.length) {
    const isValid = true;
    const validValue = {
      categoryConfig: {
        limitToCategoryIds: false,
      },
    };

    return [isValid, validValue];
  }

  const validCategoryIds = getCategoryIds(categoriesInUse);
  const isArray = Array.isArray(categoryIds);
  const validatedCategoryIds = isArray
    ? categoryIds.filter(c => validCategoryIds?.includes(c))
    : [];
  const unknownCategoryIds = isArray ? categoryIds.filter(c => !validCategoryIds?.includes(c)) : [];

  const hasValidCategoryIds = validatedCategoryIds.length > 0;
  const isValid = hasValidCategoryIds || !limitToCategoryIds;

  const validValue = hasValidCategoryIds
    ? {
        categoryConfig: {
          limitToCategoryIds,
          categoryIds: validatedCategoryIds,
        },
      }
    : { categoryConfig: { limitToCategoryIds: false } };
  const reason = isValid
    ? undefined
    : unknownIdsReason('category id(s)', isArray ? unknownCategoryIds : categoryIds);
  return [isValid, validValue, reason];
};

const filterTypes = ['SelectSingleFilter', 'SelectMultipleFilter'];
const validFilterType = (filterType, schemaType) => {
  const isEnumSchemaType = ['enum', 'multi-enum'].includes(schemaType);
  // Historical quirk from configHelpers: the check used undeclared `searchMode`, so
  // `typeof … === 'undefined'` was always true and filterType stayed optional.
  const isUndefined = true;
  const isKnownFilterType = filterTypes.includes(filterType);
  const shouldHaveFilterType = isEnumSchemaType && (isKnownFilterType || isUndefined);
  const isValid = !isEnumSchemaType || shouldHaveFilterType;
  const filterTypeMaybe = shouldHaveFilterType
    ? { filterType: filterType || 'SelectMultipleFilter' }
    : {};
  return [isValid, filterTypeMaybe];
};

const searchModes = ['has_all', 'has_any'];
const validSearchMode = (searchMode, schemaType) => {
  const isMultiEnumSchemaType = schemaType === 'multi-enum';
  const isUndefined = typeof searchMode === 'undefined';
  const hasValidMode = searchModes.includes(searchMode);
  const isSearchModeValid = isMultiEnumSchemaType && (isUndefined || hasValidMode);
  const isValid = !isMultiEnumSchemaType || isSearchModeValid;
  const searchModeMaybe = isSearchModeValid ? { searchMode: searchMode || 'has_all' } : {};
  return [isValid, searchModeMaybe];
};

const validFilterConfig = (config, schemaType) => {
  const isUndefined = typeof config === 'undefined';
  if (isUndefined) {
    return [true, {}];
  }
  const [isValidIndexForSearch, indexForSearch] = validBoolean(
    'indexForSearch',
    config.indexForSearch,
    false
  );
  const [isValidShowFilter, showFilter] = validBoolean('showFilter', config.showFilter, false);
  const [isValidLabel, label] = validLabel(config.label);
  const [isValidFilterType, filterType] = validFilterType(config.filterType, schemaType);
  const [isValidSearchMode, searchMode] = validSearchMode(config.searchMode, schemaType);
  const groupOptions = ['primary', 'secondary'];
  const [isValidGroup, group] = validEnumString('group', config.group, groupOptions, 'primary');

  const [isValidShowSorting, showSorting] = validBoolean('showSorting', config.showSorting, false);

  const sortingGroupOptions = ['primary', 'secondary'];
  const [isValidSortingGroup, sortingGroup] = validEnumString(
    'sortingGroup',
    config.sortingGroup,
    sortingGroupOptions,
    'primary'
  );

  const [isValidSortingOrderAsc, { asc: sortingOrderAsc }] = validBoolean(
    'asc',
    config.sortingOrder?.asc,
    false
  );
  const [isValidSortingOrderDesc, { desc: sortingOrderDesc }] = validBoolean(
    'desc',
    config.sortingOrder?.desc,
    false
  );
  const isValidSortingOrder = isValidSortingOrderAsc && isValidSortingOrderDesc;
  const sortingOrder = { asc: sortingOrderAsc, desc: sortingOrderDesc };

  const isValid =
    isValidIndexForSearch &&
    isValidShowFilter &&
    isValidLabel &&
    isValidFilterType &&
    isValidSearchMode &&
    isValidGroup &&
    isValidShowSorting &&
    isValidSortingGroup &&
    isValidSortingOrder;

  const validValue = {
    filterConfig: {
      ...indexForSearch,
      ...showFilter,
      ...label,
      ...filterType,
      ...searchMode,
      ...group,
      ...showSorting,
      ...sortingGroup,
      sortingOrder,
    },
  };
  return [isValid, validValue];
};

const validShowConfig = config => {
  const isUndefined = typeof config === 'undefined';
  if (isUndefined) {
    return [true, {}];
  }

  const [isValidLabel, label] = validLabel(config.label);
  const [isValidIsDetail, isDetail] = validBoolean('isDetail', config.isDetail, true);
  const [isValidDisplayOnListingPage, isDisplayOnListingPage] = validBoolean(
    'displayOnListingPage',
    config.displayOnListingPage,
    true
  );
  const [isValidUnselectedOptions, unselectedOptions] = validBoolean(
    'unselectedOptions',
    config.unselectedOptions,
    true
  );

  const isValid =
    isValidLabel && isValidIsDetail && isValidUnselectedOptions && isValidDisplayOnListingPage;
  const validValue = {
    showConfig: {
      ...label,
      ...isDetail,
      ...unselectedOptions,
      ...isDisplayOnListingPage,
    },
  };
  return [isValid, validValue];
};

const validSaveConfig = config => {
  const isUndefined = typeof config === 'undefined';
  if (isUndefined) {
    return [true, {}];
  }
  const [isValidLabel, label] = validLabel(config.label);
  const [isValidPlaceholder, placeholderMessage] = validPlaceholderMessage(
    config.placeholderMessage
  );
  const [isValidIsRequired, isRequired] = validBoolean('isRequired', config.isRequired, false);
  const [isValidRequiredMessage, requiredMessage] = validRequiredMessage(config.requiredMessage);

  const isValid = isValidLabel && isValidPlaceholder && isValidIsRequired && isValidRequiredMessage;
  const validValue = {
    saveConfig: {
      ...label,
      ...placeholderMessage,
      ...isRequired,
      ...requiredMessage,
    },
  };
  return [isValid, validValue];
};

/**
 * Validate listing field configs; drop invalid entries and push warn issues.
 * @param {Array} listingFields
 * @param {Array} listingTypesInUse
 * @param {Array} categoriesInUse
 * @param {Array} issues
 * @returns {Array}
 */
const validListingFields = (listingFields, listingTypesInUse, categoriesInUse, issues) => {
  const seenKeys = new Set();
  const scopeOptions = ['public', 'private', 'metadata'];

  return listingFields.reduce((acc, data) => {
    if (!data) {
      return acc;
    }

    const { key, label, schemaType } = data;

    if (!isValidListingTypeLabel(label)) {
      issues.push(
        configIssue({
          level: 'warn',
          code: 'LISTING_FIELD_MISSING_OR_EMPTY_LABEL',
          message: `A listing field is missing a label (key: "${key}"). This field was dropped.`,
        })
      );
      return acc;
    }

    if (!isValidListingFieldKey(key)) {
      issues.push(
        configIssue({
          level: 'warn',
          code: 'LISTING_FIELD_INVALID_KEY',
          message: `Listing field key "${key}" is invalid. Keys must start with a letter and use only letters, numbers, or underscores. This field was dropped.`,
        })
      );
      return acc;
    }

    if (typeof schemaType === 'undefined' || !EXTENDED_DATA_SCHEMA_TYPES.includes(schemaType)) {
      issues.push(
        configIssue({
          level: 'warn',
          code: 'LISTING_FIELD_MISSING_OR_INVALID_SCHEMA_TYPE',
          message: `Listing field "${key}" is missing a valid field type (schemaType). This field was dropped.`,
        })
      );
      return acc;
    }

    if (seenKeys.has(key)) {
      issues.push(
        configIssue({
          level: 'warn',
          code: 'LISTING_FIELD_DUPLICATE_KEY',
          message: `Listing field key "${key}" is used more than once. This duplicate field was dropped.`,
        })
      );
      return acc;
    }

    const validationData = Object.entries(data).reduce(
      (innerAcc, entry) => {
        const [name, value] = entry;

        const [isValid, prop, reason] =
          name === 'key'
            ? [true, { key }]
            : name === 'label'
            ? validLabel(value)
            : name === 'scope'
            ? validEnumString('scope', value, scopeOptions, 'public')
            : name === 'numberConfig'
            ? validNumberConfig(value, schemaType)
            : name === 'includeForListingTypes'
            ? validListingTypesForBuiltInSetup(value, listingTypesInUse)
            : name === 'listingTypeConfig'
            ? validListingTypesForListingTypeConfig(value, listingTypesInUse)
            : name === 'categoryConfig'
            ? validListingTypesForCategoryConfig(value, categoriesInUse)
            : name === 'schemaType'
            ? validEnumString('schemaType', value, EXTENDED_DATA_SCHEMA_TYPES)
            : name === 'enumOptions'
            ? validSchemaOptions(value, schemaType)
            : name === 'filterConfig'
            ? validFilterConfig(value, schemaType)
            : name === 'showConfig'
            ? validShowConfig(value)
            : name === 'saveConfig'
            ? validSaveConfig(value)
            : name === 'helpText'
            ? validHelpText(value)
            : [true, { [name]: value }];

        const hasFoundValid = !(innerAcc.isValid === false || isValid === false);
        if (isValid === false) {
          const reasonMaybe = reason ? `: ${reason}` : '';
          issues.push(
            configIssue({
              level: 'warn',
              code: 'LISTING_FIELD_UNSUPPORTED',
              message: `Listing field "${key}" has an unsupported configuration (${name})${reasonMaybe}. This field was dropped.`,
            })
          );
        }

        return { config: { ...innerAcc.config, ...prop }, isValid: hasFoundValid };
      },
      { config: {}, isValid: true }
    );

    if (validationData.isValid) {
      seenKeys.add(key);
      return [...acc, validationData.config];
    }
    return acc;
  }, []);
};

const validTransactionFields = (transactionFields, issues) => {
  const seenKeys = new Set();
  const scopeOptions = ['protected'];

  return transactionFields.reduce((acc, data) => {
    if (!data) {
      return acc;
    }

    const { key, label, schemaType } = data;

    if (!isValidListingTypeLabel(label)) {
      issues.push(
        configIssue({
          level: 'warn',
          code: 'LISTING_TRANSACTION_FIELD_MISSING_OR_EMPTY_LABEL',
          message: `A transaction field is missing a label (key: "${key}"). This field was dropped.`,
        })
      );
      return acc;
    }

    if (!isValidTransactionFieldKey(key)) {
      issues.push(
        configIssue({
          level: 'warn',
          code: 'LISTING_TRANSACTION_FIELD_INVALID_KEY',
          message: `Transaction field key "${key}" is invalid. Use only letters, numbers, dashes, or underscores. This field was dropped.`,
        })
      );
      return acc;
    }

    if (typeof schemaType === 'undefined' || !EXTENDED_DATA_SCHEMA_TYPES.includes(schemaType)) {
      issues.push(
        configIssue({
          level: 'warn',
          code: 'LISTING_TRANSACTION_FIELD_MISSING_OR_INVALID_SCHEMA_TYPE',
          message: `Transaction field "${key}" is missing a valid field type (schemaType). This field was dropped.`,
        })
      );
      return acc;
    }

    if (seenKeys.has(key)) {
      issues.push(
        configIssue({
          level: 'warn',
          code: 'LISTING_TRANSACTION_FIELD_DUPLICATE_KEY',
          message: `Transaction field key "${key}" is used more than once on this listing type. This duplicate field was dropped.`,
        })
      );
      return acc;
    }

    const validationData = Object.entries(data).reduce(
      (innerAcc, entry) => {
        const [name, value] = entry;

        const [isValid, prop] =
          name === 'key'
            ? [true, { key }]
            : name === 'label'
            ? validLabel(value)
            : name === 'scope'
            ? validEnumString('scope', value, scopeOptions, 'protected')
            : name === 'numberConfig'
            ? validNumberConfig(value, schemaType)
            : name === 'schemaType'
            ? validEnumString('schemaType', value, EXTENDED_DATA_SCHEMA_TYPES)
            : name === 'enumOptions'
            ? validSchemaOptions(value, schemaType)
            : name === 'filterConfig'
            ? validFilterConfig(value, schemaType)
            : name === 'showConfig'
            ? validShowConfig(value)
            : name === 'saveConfig'
            ? validSaveConfig(value)
            : name === 'helpText'
            ? validHelpText(value)
            : [true, { [name]: value }];

        const hasFoundValid = !(innerAcc.isValid === false || isValid === false);
        if (isValid === false) {
          issues.push(
            configIssue({
              level: 'warn',
              code: 'LISTING_TRANSACTION_FIELD_UNSUPPORTED',
              message: `Transaction field "${key}" has an unsupported configuration (${name}). This field was dropped.`,
            })
          );
        }

        return { config: { ...innerAcc.config, ...prop }, isValid: hasFoundValid };
      },
      { config: {}, isValid: true }
    );

    if (validationData.isValid) {
      seenKeys.add(key);
      return [...acc, validationData.config];
    }
    return acc;
  }, []);
};

/**
 * Keep listing types that use a supported transaction process; drop others with warns.
 * Also strips process-specific leftovers Marketplace Console may leave after an operator
 * changes the process (e.g. availabilityType on a purchase type).
 * unitType must belong to the *current* process, not any supported process.
 *
 * @param {Array} listingTypes
 * @param {Array} issues
 * @returns {Array}
 */
const validListingTypes = (listingTypes, issues) => {
  const supportedProcessesInfo = getSupportedProcessesInfo();
  const seenIds = new Set();

  return listingTypes.reduce((validConfigs, listingType) => {
    if (!listingType) {
      return validConfigs;
    }
    const {
      listingType: type,
      label,
      transactionType,
      transactionFields,
      defaultListingFields,
      messagingOptions,
      imageSettings,
      stockType,
      availabilityType,
      priceVariations,
      negotiationOptions,
    } = listingType;

    if (!isValidListingTypeLabel(label)) {
      issues.push(
        configIssue({
          level: 'warn',
          code: 'LISTING_TYPE_MISSING_OR_EMPTY_LABEL',
          message: `A listing type is missing a label (id: "${type}"). This listing type was dropped.`,
        })
      );
      return validConfigs;
    }

    if (!isValidListingTypeId(type)) {
      issues.push(
        configIssue({
          level: 'warn',
          code: 'LISTING_TYPE_INVALID_ID',
          message: `Listing type id "${type}" is invalid. Use only letters, numbers, dashes, or underscores. This listing type was dropped.`,
        })
      );
      return validConfigs;
    }

    if (!transactionType) {
      issues.push(
        configIssue({
          level: 'warn',
          code: 'LISTING_TYPE_UNSUPPORTED',
          message: `Listing type "${type}" is missing a transaction type (process). This listing type was dropped.`,
        })
      );
      return validConfigs;
    }

    const { process: processName, alias, unitType } = transactionType;

    // Match process by name, then require that process's alias and unitType.
    const processInfo = supportedProcessesInfo.find(p => p.name === processName);
    const isSupportedProcess = !!processInfo;
    const isSupportedProcessAlias = processInfo?.alias === alias;
    const isSupportedUnitType = processInfo?.unitTypes?.includes(unitType);

    if (!(isSupportedProcess && isSupportedProcessAlias && isSupportedUnitType)) {
      issues.push(
        configIssue({
          level: 'warn',
          code: 'LISTING_TYPE_UNSUPPORTED',
          message: `Listing type "${type}" uses an unsupported transaction process, alias, or unit type. This listing type was dropped.`,
        })
      );
      return validConfigs;
    }

    if (seenIds.has(type)) {
      issues.push(
        configIssue({
          level: 'warn',
          code: 'LISTING_TYPE_DUPLICATE_ID',
          message: `Listing type id "${type}" is used more than once. This duplicate listing type was dropped.`,
        })
      );
      return validConfigs;
    }
    seenIds.add(type);

    const hasTransactionFields = transactionFields?.length > 0;
    const restructuredTransactionFields = transactionFields?.map(restructureTransactionFields);
    const validTransactionFieldsMaybe = hasTransactionFields
      ? { transactionFields: validTransactionFields(restructuredTransactionFields, issues) }
      : {};

    // Props shared across processes (schema shows these once a process is selected).
    const commonMaybe = {
      ...(defaultListingFields ? { defaultListingFields } : {}),
      ...(messagingOptions ? { messagingOptions } : {}),
      // Optional image count limit from Console listing-types (any process).
      ...(imageSettings ? { imageSettings } : {}),
      ...validTransactionFieldsMaybe,
    };

    // Process-specific extras only — drop leftovers from a previous process.
    const processSpecificMaybe =
      processName === BOOKING_PROCESS_NAME
        ? {
            ...(availabilityType ? { availabilityType } : {}),
            ...(priceVariations
              ? { priceVariations: { enabled: !!priceVariations?.enabled } }
              : {}),
          }
        : processName === PURCHASE_PROCESS_NAME
        ? {
            ...(stockType ? { stockType } : {}),
          }
        : processName === NEGOTIATION_PROCESS_NAME
        ? {
            ...(negotiationOptions ? { negotiationOptions } : {}),
          }
        : {};

    return [
      ...validConfigs,
      {
        listingType: type,
        label,
        transactionType: {
          process: processName,
          alias,
          unitType,
        },
        ...commonMaybe,
        ...processSpecificMaybe,
      },
    ];
  }, []);
};

/**
 * Shape hosted listingTypes + listingFields assets (not built-in defaults).
 * Restructures asset shape => app config shape. Omits keys when the hosted array is missing.
 *
 * @param {Object} hostedSlices values keyed by listingConfig.assetKeys
 * @returns {Object} partial hosted input for validate
 */
const normalize = hostedSlices => {
  const listingTypesRaw = hostedSlices?.listingTypes?.listingTypes;
  const listingFieldsRaw = hostedSlices?.listingFields?.listingFields;

  const normalized = {};

  if (Array.isArray(listingTypesRaw)) {
    normalized.hasListingTypesAsset = true;
    normalized.hasNonEmptyListingTypes = listingTypesRaw.length > 0;
    normalized.listingTypes = restructureListingTypes(listingTypesRaw);
  }

  if (Array.isArray(listingFieldsRaw)) {
    normalized.hasListingFieldsAsset = true;
    normalized.listingFields = restructureListingFields(listingFieldsRaw);
  }

  return normalized;
};

/**
 * Validate normalized hosted listing types/fields. Emits mandatory errors and soft warns.
 * Uses category tree from ctx.resolved.categoryConfiguration when available.
 *
 * @param {Object} normalized output of normalize
 * @param {Object} ctx applyConfigHandlers context ({ resolved, ... })
 * @returns {{ value: Object, issues: Array }}
 */
const validate = (normalized, ctx = {}) => {
  const issues = [];
  const {
    hasListingTypesAsset,
    hasNonEmptyListingTypes,
    hasListingFieldsAsset,
    listingTypes: rawTypes = [],
    listingFields: rawFields = [],
  } = normalized || {};

  if (!hasListingTypesAsset || !hasNonEmptyListingTypes) {
    issues.push(
      configIssue({
        level: 'error',
        code: 'LISTING_MISSING_TYPES',
        message:
          'No listing types were found. Add at least one listing type in Console (or check that the app still fetches the listing-types asset). The marketplace cannot start without them.',
      })
    );
  }

  if (!hasListingFieldsAsset) {
    issues.push(
      configIssue({
        level: 'error',
        code: 'LISTING_MISSING_FIELDS',
        message:
          'Listing fields configuration is missing. Check that the listing-fields asset is fetched, or add listing fields in Console. The marketplace cannot start without this asset.',
      })
    );
  }

  // Listing fields are not namespaced in public data.
  // If a dynamically added listing field key clashes with a built-in public data key,
  // the app can't tell which meaning that property has.
  const fieldsForClash = Array.isArray(rawFields) ? rawFields.filter(Boolean) : [];
  if (hasClashWithBuiltInPublicDataKey(fieldsForClash)) {
    const clashKeys = fieldsForClash.filter(f => isReservedListingFieldKey(f?.key)).map(f => f.key);
    issues.push(
      configIssue({
        level: 'error',
        code: 'LISTING_PUBLIC_DATA_KEY_CLASH',
        message: `These listing field keys conflict with built-in listing data and cannot be used: ${clashKeys.join(
          ', '
        )}.`,
      })
    );
  }

  const categoriesInUse = ctx?.resolved?.categoryConfiguration?.categories || [];
  const listingTypes = validListingTypes(Array.isArray(rawTypes) ? rawTypes : [], issues);
  const listingTypesInUse = listingTypes.map(lt => `${lt.listingType}`);
  const listingFields = validListingFields(
    fieldsForClash,
    listingTypesInUse,
    categoriesInUse,
    issues
  );

  return {
    value: {
      listingTypes,
      listingFields,
      hasListingTypesAsset: !!hasListingTypesAsset,
      hasListingFieldsAsset: !!hasListingFieldsAsset,
    },
    issues,
  };
};

/**
 * Build final `config.listing`: prefer validated hosted types/fields; optionally union
 * with built-ins when debugging merge is enabled. Always takes enforceValidListingType
 * (and other non-array keys) from defaults.listing.
 *
 * @param {Object} validated sanitized hosted slice from validate (`value`)
 * @param {Object} defaults full defaultConfigs (uses `defaults.listing`)
 * @returns {Object} app-config listing object
 */
const resolve = (validated, defaults) => {
  const {
    listingTypes: defaultListingTypes = [],
    listingFields: defaultListingFields = [],
    ...rest
  } = defaults?.listing || {};

  const hostedListingTypes = Array.isArray(validated?.listingTypes) ? validated.listingTypes : [];
  const hostedListingFields = Array.isArray(validated?.listingFields)
    ? validated.listingFields
    : [];

  const shouldMerge = mergeDefaultTypesAndFieldsForDebugging(false);
  const listingTypes = shouldMerge
    ? union(hostedListingTypes, defaultListingTypes, 'listingType')
    : hostedListingTypes;
  const listingFields = shouldMerge
    ? union(hostedListingFields, defaultListingFields, 'key')
    : hostedListingFields;

  return {
    ...rest,
    listingFields,
    listingTypes,
    enforceValidListingType: defaults?.listing?.enforceValidListingType,
  };
};

/**
 * Config handler for the `listing` app-config key.
 *
 * - id: `listing`
 * - assetKeys: `listingTypes`, `listingFields`
 * - mandatory: true — missing types/fields or public-data key clash → MaintenanceMode
 */
export const listingConfig = {
  id: 'listing',
  assetKeys: ['listingTypes', 'listingFields'],
  mandatory: true,
  normalize,
  validate,
  resolve,
};
