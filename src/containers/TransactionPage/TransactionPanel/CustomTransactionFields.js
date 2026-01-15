import React from 'react';

// Utils
import {
  getDetailCustomFieldValue,
  pickCustomFieldProps,
  getRoleKey,
} from '../../../util/fieldHelpers.js';

import CustomExtendedDataSection from '../../../components/CustomExtendedDataSection/CustomExtendedDataSection.js';

/**
 * Renders custom transaction fields.
 * - SectionDetailsMaybe is used if schemaType is 'enum', 'long', or 'boolean'
 * - SectionMultiEnumMaybe is used if schemaType is 'multi-enum'
 * - SectionTextMaybe is used if schemaType is 'text'
 *
 * @param {*} props include protectedData, transactionFieldConfigs
 * @returns React.Fragment containing aforementioned components
 */
const CustomTransactionFields = props => {
  const { protectedData, transactionFieldConfigs, intl, className, role = 'customer' } = props;

  // TODO move showConfig to configHelpers when asset comes through
  // Split role based configs into customer and provider arrays
  const roleKeyReducer = (configs, config) => {
    const { customer, provider } = config.showTo;
    const { customerRoleConfigs = [], providerRoleConfigs = [] } = configs;

    const newCustomerConfig = customer
      ? [
          {
            ...config,
            key: getRoleKey('customer', config.key),
          },
        ]
      : [];
    const newProviderConfig = provider
      ? [
          {
            ...config,
            key: getRoleKey('provider', config.key),
          },
        ]
      : [];
    return {
      customerRoleConfigs: [...customerRoleConfigs, ...newCustomerConfig],
      providerRoleConfigs: [...providerRoleConfigs, ...newProviderConfig],
    };
  };

  const { customerRoleConfigs, providerRoleConfigs } = transactionFieldConfigs.reduce(
    roleKeyReducer,
    {}
  );

  // Props for text, multi-enum, and Youtube fields
  const propsForCustomerCustomFields =
    pickCustomFieldProps({ protectedData }, customerRoleConfigs) || [];
  const propsForProviderCustomFields =
    pickCustomFieldProps({ protectedData }, providerRoleConfigs) || [];

  console.log({ propsForCustomerCustomFields }, { propsForProviderCustomFields });

  // Props for details fields (enum, number, boolean)
  const sectionDetailsPropsCustomer = {
    ...props,
    fieldConfigs: customerRoleConfigs,
    showDetailsHeading: false,
    className: className,
  };

  const sectionDetailsPropsProvider = {
    ...props,
    fieldConfigs: providerRoleConfigs,
    showDetailsHeading: false,
  };

  const pickExtendedDataFields = (filteredConfigs, config) => {
    const { key, schemaType, enumOptions, label } = config;
    const protectedDataValue = protectedData[key];
    const value = typeof protectedDataValue != null ? protectedDataValue : null;
    if (typeof value !== 'undefined') {
      return getDetailCustomFieldValue(
        enumOptions,
        filteredConfigs,
        value,
        schemaType,
        key,
        label,
        intl,
        'TransactionPage'
      );
    }
    return filteredConfigs;
  };

  return (
    <>
      {role === 'customer' && customerRoleConfigs?.length > 0 ? (
        <CustomExtendedDataSection
          sectionDetailsProps={sectionDetailsPropsCustomer}
          propsForCustomFields={propsForCustomerCustomFields}
          page="TransactionPage"
          pickExtendedDataFields={pickExtendedDataFields}
        />
      ) : role === 'provider' && providerRoleConfigs?.length > 0 ? (
        <CustomExtendedDataSection
          sectionDetailsProps={sectionDetailsPropsProvider}
          propsForCustomFields={propsForProviderCustomFields}
          page="TransactionPage"
          pickExtendedDataFields={pickExtendedDataFields}
        />
      ) : null}
    </>
  );
};

export default CustomTransactionFields;
