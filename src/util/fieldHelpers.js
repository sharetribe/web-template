// This util file is about user and listing fields.
// I.e. These are custom fields to data entities. They are added through the Marketplace Console.
// In the codebase, we also have React Final Form fields, which are wrapper around user inputs.

import {
  isPurchaseProcessAlias,
  isBookingProcessAlias,
  isNegotiationProcessAlias,
} from '../transactions/transaction';
import {
  EXTENDED_DATA_SCHEMA_TYPES,
  SCHEMA_TYPE_MULTI_ENUM,
  SCHEMA_TYPE_TEXT,
  SCHEMA_TYPE_YOUTUBE,
} from './types';
import appSettings from '../config/settings';
import { addScopePrefix } from './userHelpers';

const { stripeSupportedCurrencies, subUnitDivisors } = appSettings;

const keyMapping = {
  userType: {
    wrapper: 'userTypeConfig',
    limitTo: 'limitToUserTypeIds',
    ids: 'userTypeIds',
  },
  listingType: {
    wrapper: 'listingTypeConfig',
    limitTo: 'limitToListingTypeIds',
    ids: 'listingTypeIds',
  },
  category: {
    wrapper: 'categoryConfig',
    limitTo: 'limitToCategoryIds',
    ids: 'categoryIds',
  },
};

const getEntityTypeRestrictions = (entityTypeKey, config) => {
  const { wrapper, limitTo, ids } = keyMapping[entityTypeKey];
  const isLimited = config && config[wrapper] && config[wrapper][limitTo];
  const limitToIds = config && config[wrapper] && config[wrapper][ids];

  return { isLimited, limitToIds };
};

const isCustomFieldRelevantForEntityType = (entityTypeKey, publicData, config) => {
  if (entityTypeKey == null) {
    return true;
  }

  const entityType = publicData && publicData[entityTypeKey];
  return isFieldFor(entityTypeKey, entityType, config);
};

/**
 * Get a snake-cased key with the specified prefix, e.g. customer_options
 * @param {String} prefix the prefix to append to the key, e.g. 'customer'
 * @param {String} key the original key, e.g. 'options'
 * @returns string
 */
export const getPrefixedKey = (prefix, key) => `${prefix}_${key}`;

/**
 * Check if the given listing type is allowed according to the given listing field config.
 *
 * @param {String} entityTypeKey entity type key (e.g. 'listingType', 'userType')
 * @param {String|Array<String>} entityType entity type to be checked (e.g. 'amenities'). Accepts an array too.
 * @param {*} fieldConfig the config of a custom listing field
 * @returns true if listingTypeConfig allows the listingType
 */
export const isFieldFor = (entityTypeKey, entityType, fieldConfig) => {
  const { isLimited, limitToIds } = getEntityTypeRestrictions(entityTypeKey, fieldConfig);

  if (Array.isArray(entityType)) {
    return !isLimited || limitToIds.some(cid => entityType.includes(cid));
  }
  return !isLimited || limitToIds.includes(entityType);
};

export const isFieldForUserType = (userType, fieldConfig) =>
  isFieldFor('userType', userType, fieldConfig);
export const isFieldForListingType = (listingType, fieldConfig) =>
  isFieldFor('listingType', listingType, fieldConfig);
export const isFieldForCategory = (categories, fieldConfig) =>
  isFieldFor('category', categories, fieldConfig);

/**
 * Returns the value of the attribute in extended data.
 * @param {*} data extended data containing the value
 * @param {*} key attribute key in extended data
 * @returns
 */
export const getFieldValue = (data, key) => {
  const value = data?.[key];
  return value != null ? value : null;
};

/**
 * Picks current values for listing categories based on provided public data and configuration.
 * This function validates if the initial values match with the configuration received via assets.
 * If a categoryLevel value doesn't match with the category configuration, it is not passed on to the form.
 *
 * @param {*} data publicData or some other set where category-related nested data is available
 * @param {String} prefix prefix used for storing nested values.
 * @param {Number} level refers to nesting level (starts from 1)
 * @param {Array} categoryLevelOptions array of nested category structure
 * @returns pick valid prefixed properties
 */
export const pickCategoryFields = (data, prefix, level, categoryLevelOptions = []) => {
  const currentCategoryKey = `${prefix}${level}`;
  const currentCategoryValue = data[currentCategoryKey];
  const isCategoryLevelSet = typeof currentCategoryValue !== 'undefined';

  // Validate the value against category options
  const categoryOptionConfig = categoryLevelOptions.find(
    category => category.id === currentCategoryValue
  );
  const isValidCategoryValue = !!categoryOptionConfig;
  const nextLevelOptions = categoryOptionConfig?.subcategories || [];

  // Return category level property if it's found from the data and the value is one of the valid options.
  // Go through all the nested levels.
  return isCategoryLevelSet && isValidCategoryValue
    ? {
        [currentCategoryKey]: currentCategoryValue,
        ...pickCategoryFields(data, prefix, ++level, nextLevelOptions),
      }
    : {};
};

/**
 * Pick props for SectionMultiEnum and SectionText display components.
 *
 * @param {*} extendedData the different entity extended data containing the value(s) to be displayed:
 * publicData, metadata, protectedData.
 * @param {Array<Object>} fieldConfigs array of custom field configuration objects
 * @param {String} entityTypeKey the name of the key denoting the entity type in publicData.
 * E.g. 'listingType', 'userType', or 'category'
 * @param {function} shouldPickFn an optional function to add extra check before including the field props
 * @returns an object with attributes 'schemaType', 'key', and 'heading', as well as either
 * - 'options' and 'selectedOptions' for SCHEMA_TYPE_MULTI_ENUM
 * - or 'text' for SCHEMA_TYPE_TEXT
 */
export const pickCustomFieldProps = (extendedData, fieldConfigs, entityTypeKey, shouldPickFn) => {
  const { publicData, metadata, protectedData } = extendedData;
  return fieldConfigs?.reduce((pickedElements, config) => {
    const { key, enumOptions, schemaType, scope = 'public', showConfig } = config;
    const { label, unselectedOptions: showUnselectedOptions } = showConfig || {};
    const isTargetEntityType = isCustomFieldRelevantForEntityType(
      entityTypeKey,
      publicData,
      config
    );

    const createFilterOptions = options =>
      options.map(o => ({ key: `${o.option}`, label: o.label }));

    const shouldPick = shouldPickFn ? shouldPickFn(config) : true;

    const value =
      scope === 'public'
        ? getFieldValue(publicData, key)
        : scope === 'protected'
        ? getFieldValue(protectedData, key)
        : scope === 'metadata'
        ? getFieldValue(metadata, key)
        : null;

    return isTargetEntityType && schemaType === SCHEMA_TYPE_MULTI_ENUM && shouldPick
      ? [
          ...pickedElements,
          {
            schemaType,
            key,
            heading: label,
            options: createFilterOptions(enumOptions),
            selectedOptions: value || [],
            showUnselectedOptions: showUnselectedOptions !== false,
          },
        ]
      : isTargetEntityType && !!value && config.schemaType === SCHEMA_TYPE_TEXT && shouldPick
      ? [
          ...pickedElements,
          {
            schemaType,
            key,
            heading: label,
            text: value,
          },
        ]
      : isTargetEntityType && schemaType === SCHEMA_TYPE_YOUTUBE && shouldPick
      ? [
          ...pickedElements,
          {
            schemaType,
            key,
            videoUrl: value,
            heading: label,
          },
        ]
      : pickedElements;
  }, []);
};

/**
 * Validates if the specified currency is compatible with the transaction process
 * and the payment processor being used.
 *
 * @param {string} transactionProcessAlias - The alias of the transaction process. Expected to be in the format
 *                               of "PROCESS_NAME/version" (e.g., "booking-default/release-1").
 * @param {string} listingCurrency - A currency code (e.g., "USD", "EUR").
 * @param {string|null} paymentProcessor - (Optional) The name of the payment processor, such as "stripe".
 *                                         Defaults to null if no payment processor is specified.
 *
 * @returns {boolean} - Returns true if the currency is valid for the specified transaction process
 *                      and payment processor, otherwise false.
 *
 * Notes:
 * - The function checks if the specified currency is compatible with Stripe (for booking or purchase processes).
 * - Stripe only supports certain currencies. You can use other currencies on your marketplace for transactions that
 * - don't utilise Stripe. This function performs a check that the currency and transaction process provided are compatible
 * - with each other.
 * - When the paymentProcessor flag is passed as null, this function ensures either:
 *    a) the currency is listed in the subUnitDivisors list (in settingsCurrency.js)
 *    b) The process is Stripe-compatible with a Stripe-supported currency.
 */
export const isValidCurrencyForTransactionProcess = (
  transactionProcessAlias,
  listingCurrency,
  paymentProcessor = null
) => {
  // booking and purchase processes use Stripe actions.
  const isStripeRelatedProcess =
    isPurchaseProcessAlias(transactionProcessAlias) ||
    isBookingProcessAlias(transactionProcessAlias) ||
    isNegotiationProcessAlias(transactionProcessAlias);

  // Determine if the listing currency is supported by Stripe
  const isStripeSupportedCurrency = stripeSupportedCurrencies.includes(listingCurrency);

  if (paymentProcessor === 'stripe') {
    // If using Stripe, only return true if both process and currency are compatible with Stripe
    return isStripeRelatedProcess && isStripeSupportedCurrency;
  } else if (paymentProcessor === null) {
    // If payment processor is not specified, allow any non-stripe related process with valid subunits or Stripe-related processes with supported currency
    return (
      (isStripeRelatedProcess && isStripeSupportedCurrency) ||
      (!isStripeRelatedProcess && Object.keys(subUnitDivisors).includes(listingCurrency))
    );
  }
};

/**
 * Return props for custom transaction fields
 * @param {Object} transactionFieldConfigs Configuration for transaction fields
 * @param {Boolean} isCustomer Flag to determine whether the target context
 * is a set of fields related to the customer
 * @returns an array of props for CustomExtendedDataField: key, name,
 * fieldConfig
 */
export const getPropsForCustomTransactionFieldInputs = (transactionFieldConfigs, isCustomer) => {
  return (
    transactionFieldConfigs?.reduce((pickedFields, fieldConfig) => {
      const { key, showTo, schemaType, scope } = fieldConfig || {};
      const namespacedKey = addScopePrefix(scope, key);
      const isKnownSchemaType = EXTENDED_DATA_SCHEMA_TYPES.includes(schemaType);
      const isTransactionScope = scope === 'protected';
      const showToCustomer = showTo === 'customer';
      const isCorrectRole = showToCustomer === isCustomer;

      return isKnownSchemaType && isTransactionScope && isCorrectRole
        ? [
            ...pickedFields,
            {
              key: namespacedKey,
              name: namespacedKey,
              fieldConfig: fieldConfig,
            },
          ]
        : pickedFields;
    }, []) || []
  );
};

/**
 * Pick extended data fields from given form data.
 * Picking is based on extended data configuration for the transaction and target user role.
 *
 * This expects submit data to be namespaced (e.g. 'prot_') and it returns the field without that namespace.
 * This function is used when form submit values are restructured for the actual API endpoint.
 *
 * @param {Object} data values to look through against transaction field configuration
 * @param {String} targetScope Check that the scope of extended data in the config matches this scope
 * @param {Boolean} isCustomer Flag to determine whether the data relates to a customer of a transaction
 * @param {Object} transactionFieldConfigs Field configurations
 * @returns an object with field data as key-value pairs
 */
export const pickTransactionFieldsData = (
  data,
  targetScope = 'protected',
  isCustomer,
  transactionFieldConfigs
) => {
  return transactionFieldConfigs.reduce((fields, field) => {
    const { key, schemaType, scope = 'protected', showTo } = field || {};
    const namespacedKey = addScopePrefix(scope, key);

    const isKnownSchemaType = EXTENDED_DATA_SCHEMA_TYPES.includes(schemaType);
    const isTargetScope = scope === targetScope;
    const showToCustomer = showTo === 'customer';
    const isCorrectRole = showToCustomer === isCustomer;
    const roleKey = getPrefixedKey(showTo, key);

    if (isKnownSchemaType && isTargetScope && isCorrectRole) {
      const fieldValue = getFieldValue(data, namespacedKey);
      return { ...fields, [roleKey]: fieldValue };
    }
    return fields;
  }, {});
};

/**
 * Returns a value for an enum, boolean, or long custom extended data field
 * @param {Array} enumOptions an array of enum options related to the field
 * @param {String | Number} value field value in extended data
 * @param {String} schemaType field schema type
 * @param {String} key field key
 * @param {*} label field label
 * @param {*} intl intl
 * @param {*} page the context where the details is being used
 * @returns an object with the detail information: key, value, label
 */
export const getDetailCustomFieldValue = (
  enumOptions,
  value,
  schemaType,
  key,
  label,
  intl,
  page
) => {
  const findSelectedOption = enumValue => enumOptions?.find(o => enumValue === `${o.option}`);
  const getBooleanMessage = value =>
    value
      ? intl.formatMessage({ id: `${page}.detailYes` })
      : intl.formatMessage({ id: `${page}.detailNo` });
  const optionConfig = findSelectedOption(value);

  return schemaType === 'enum'
    ? { key, value: optionConfig?.label, label }
    : schemaType === 'boolean'
    ? { key, value: getBooleanMessage(value), label }
    : schemaType === 'long'
    ? { key, value, label }
    : null;
};

/**
 * Pick extended data fields from transaction protected data.
 * Picking is based on transaction fields configuration.
 *
 * This returns namespaced (e.g. 'prot_') initial values for the form.
 *
 * @param {Object} data extended data values to look through against userConfig.js and util/configHelpers.js
 * @param {String} targetScope Check that the scope of extended data the config matches
 * @param {String} targetUserType Check that the extended data is relevant for this user type.
 * @param {Object} userFieldConfigs Extended data configurations for user fields.
 * @returns Array of picked extended data fields
 */
export const initialValuesForTransactionFields = (data, transactionFieldConfigs) => {
  return transactionFieldConfigs?.reduce((fields, field) => {
    const { key, scope = 'protected', schemaType, showTo } = field || {};
    const namespacedKey = addScopePrefix(scope, key);
    // Fields are saved in extended data with a role prefix corresponding to
    // the author of the fields, so we need to use the same prefix when
    // fetching them from protected data
    const roleKey = getPrefixedKey(showTo, key);

    const isKnownSchemaType = EXTENDED_DATA_SCHEMA_TYPES.includes(schemaType);

    if (isKnownSchemaType) {
      const fieldValue = getFieldValue(data, roleKey);
      return { ...fields, [namespacedKey]: fieldValue };
    }
    return fields;
  }, {});
};
