import React from 'react';
// Utils
import {
  getDetailCustomFieldValue,
  pickCustomFieldProps,
  getPrefixedKey,
} from '../../../util/fieldHelpers.js';

import CustomExtendedDataSection from '../../../components/CustomExtendedDataSection/CustomExtendedDataSection.js';

import SectionText from '../../../components/CustomExtendedDataSection/SectionText';

import css from './TransactionFields.module.css';

/**
 * Split transaction field configs to role based arrays
 * @param {Array} configs Transaction field configs
 * @param {Object} config A single config
 * @returns Object with two arrays, customerRoleConfig and providerRoleConfig
 */
const roleKeyReducer = (configs, config) => {
  const { customerRoleConfigs = [], providerRoleConfigs = [] } = configs;
  const { showTo } = config;

  const newConfig = [
    {
      ...config,
      key: getPrefixedKey(showTo, config.key),
    },
  ];

  return showTo === 'customer'
    ? {
        customerRoleConfigs: [...customerRoleConfigs, ...newConfig],
        providerRoleConfigs,
      }
    : {
        providerRoleConfigs: [...providerRoleConfigs, ...newConfig],
        customerRoleConfigs,
      };
};

/**
 * Check if protected data has saved values that match the configuration for the associated role
 * @param {Array} transactionFieldConfigs Transaction field configurations
 * @param {Object} protectedData Transaction protected data
 * @param {String} role "customer" or "provider". Which user's transaction fields are being displayed.
 * @returns Boolean for whether there is a single matching saved value
 */
const checkTransactionFieldDataExists = (transactionFieldConfigs, protectedData, role) => {
  const { customerRoleConfigs = [], providerRoleConfigs = [] } = transactionFieldConfigs.reduce(
    roleKeyReducer,
    {}
  );

  const configKeys = [
    ...customerRoleConfigs.map(c => c.key),
    ...providerRoleConfigs.map(c => c.key),
  ];

  // Check if transaction protected data has any values for keys
  // associated with the role
  const hasCustomTransactionFieldData = configKeys.find(
    key => key.startsWith(role) && !!protectedData[key]
  );

  return !!hasCustomTransactionFieldData;
};

/**
 * Get props for custom extended data sections displaying text, multi-enum,
 * or Youtube fields. If the author of the fields is banned, any text field
 * content is replaced with a default safety message.
 * @param {*} protectedData
 * @param {*} customerRoleConfigs
 * @param {*} providerRoleConfigs
 * @param {*} bannedUserMessage
 * @param {*} isCustomerBanned
 * @param {*} isProviderBanned
 * @returns
 */
const getSanitizedTransactionFieldsProps = (
  protectedData,
  customerRoleConfigs,
  providerRoleConfigs,
  bannedUserMessage,
  isCustomerBanned,
  isProviderBanned
) => {
  let propsForCustomerCustomFields =
    pickCustomFieldProps({ protectedData }, customerRoleConfigs) || [];
  let propsForProviderCustomFields =
    pickCustomFieldProps({ protectedData }, providerRoleConfigs) || [];

  const mapBannedMessages = fieldProps => {
    const { schemaType } = fieldProps;
    return schemaType === 'text'
      ? {
          ...fieldProps,
          text: bannedUserMessage,
        }
      : fieldProps;
  };

  if (isCustomerBanned) {
    propsForCustomerCustomFields = propsForCustomerCustomFields.map(mapBannedMessages);
  } else if (isProviderBanned) {
    propsForProviderCustomFields = propsForProviderCustomFields.map(mapBannedMessages);
  }
  return { propsForCustomerCustomFields, propsForProviderCustomFields };
};

/**
 * Renders custom transaction fields.
 * - SectionDetails is used if schemaType is 'enum', 'long', or 'boolean'
 * - SectionMultiEnum is used if schemaType is 'multi-enum'
 * - SectionText is used if schemaType is 'text'
 *
 * @param {*} props include protectedData, transactionFieldConfigs
 * @returns React.Fragment containing aforementioned components
 */
const CustomTransactionFields = props => {
  const {
    protectedData,
    transactionFieldConfigs,
    intl,
    className,
    role = 'customer',
    isCustomerBanned,
    isProviderBanned,
    bannedUserMessage,
  } = props;

  const { customerRoleConfigs, providerRoleConfigs } = transactionFieldConfigs.reduce(
    roleKeyReducer,
    {}
  );

  // Props for text, multi-enum, and Youtube fields
  const {
    propsForCustomerCustomFields,
    propsForProviderCustomFields,
  } = getSanitizedTransactionFieldsProps(
    protectedData,
    customerRoleConfigs,
    providerRoleConfigs,
    bannedUserMessage,
    isCustomerBanned,
    isProviderBanned
  );

  // Props for details fields (enum, number, boolean)
  const sectionDetailsPropsCustomer = {
    ...props,
    fieldConfigs: customerRoleConfigs,
    rootClassName: css.transactionFieldSection,
  };

  const sectionDetailsPropsProvider = {
    ...props,
    fieldConfigs: providerRoleConfigs,
    rootClassName: css.transactionFieldSection,
  };

  const pickExtendedDataFields = (filteredConfigs, config) => {
    const { key, schemaType, enumOptions, label } = config;
    const protectedDataValue = protectedData[key];
    const value = typeof protectedDataValue != null ? protectedDataValue : null;
    if (typeof value !== 'undefined') {
      const detailValue = getDetailCustomFieldValue(
        enumOptions,
        value,
        schemaType,
        key,
        label,
        intl,
        'TransactionPage'
      );

      return detailValue ? filteredConfigs.concat(detailValue) : filteredConfigs;
    }
    return filteredConfigs;
  };

  return (
    <>
      {role === 'customer' && customerRoleConfigs?.length > 0 ? (
        <CustomExtendedDataSection
          sectionDetailsProps={sectionDetailsPropsCustomer}
          propsForCustomFields={propsForCustomerCustomFields}
          idPrefix="transactionPage"
          pickExtendedDataFields={pickExtendedDataFields}
          className={className}
          rootClassName={css.transactionFieldSection}
        />
      ) : role === 'provider' && providerRoleConfigs?.length > 0 ? (
        <CustomExtendedDataSection
          sectionDetailsProps={sectionDetailsPropsProvider}
          propsForCustomFields={propsForProviderCustomFields}
          idPrefix="transactionPage"
          pickExtendedDataFields={pickExtendedDataFields}
          className={className}
          rootClassName={css.transactionFieldSection}
        />
      ) : null}
    </>
  );
};

/**
 * Component that displays all transaction fields:
 * - custom transaction fields are configured in Console
 * - default transaction fields show the customer and provider default message
 * @param {*} props
 * @returns A component that renders transaction fields
 */
const TransactionFields = props => {
  const {
    intl,
    isBookingProcess,
    isCustomerBanned,
    isInquiryProcess,
    isNegotiationProcess,
    isOfferOrRequest,
    isProviderBanned,
    isPurchaseProcess,
    role,
    protectedData,
    transactionFieldConfigs = [],
  } = props;

  // For negotiation processes, transaction fields are shown in the separate Offer and RequestQuote
  // components, so we don't want to show them in the main transaction panel in that case.
  const showFields =
    (isNegotiationProcess && isOfferOrRequest) || (!isNegotiationProcess && !isOfferOrRequest);

  const isCustomerDefaultMessage =
    isBookingProcess || isPurchaseProcess || (isNegotiationProcess && role === 'customer');
  const isProviderDefaultMessage = isNegotiationProcess && role === 'provider';

  const defaultMessageContent = isInquiryProcess
    ? protectedData?.inquiryMessage
    : isCustomerDefaultMessage
    ? protectedData?.customerDefaultMessage
    : isProviderDefaultMessage
    ? protectedData?.providerDefaultMessage
    : null;

  const bannedUserMessage = intl.formatMessage({ id: 'TransactionPage.messageSenderBanned' });

  const initialMessage =
    // With an initial message from the customer, check that customer is not banned
    ((isCustomerDefaultMessage || isInquiryProcess) && !isCustomerBanned) ||
    // With an initial message from the provider, check that provider is not banned
    (isProviderDefaultMessage && !isProviderBanned)
      ? defaultMessageContent
      : bannedUserMessage;

  const initialMessageHeadingId = isInquiryProcess
    ? 'TransactionPanel.inquiryMessageHeading'
    : isNegotiationProcess && role === 'customer'
    ? 'TransactionPage.RequestQuote.customerDefaultMessageLabel'
    : isProviderDefaultMessage
    ? 'TransactionPage.Offer.providerDefaultMessageLabel'
    : 'TransactionPanel.defaultMessageHeading';

  const hasCustomTransactionFieldData = checkTransactionFieldDataExists(
    transactionFieldConfigs,
    protectedData,
    role
  );

  return showFields && (!!defaultMessageContent || hasCustomTransactionFieldData) ? (
    <div className={css.transactionFieldsContainer}>
      <CustomTransactionFields
        protectedData={protectedData}
        role={role}
        transactionFieldConfigs={transactionFieldConfigs}
        isCustomerBanned={isCustomerBanned}
        isProviderBanned={isProviderBanned}
        bannedUserMessage={bannedUserMessage}
      />
      <SectionText
        heading={intl.formatMessage({
          id: initialMessageHeadingId,
        })}
        headingClassName={css.defaultMessageLabel}
        text={initialMessage}
        className={css.transactionFieldSection}
      />
    </div>
  ) : null;
};

export default TransactionFields;
