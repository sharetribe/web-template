import React from 'react';

// Utils
import {
  getDetailCustomFieldValue,
  pickCustomFieldProps,
  getPrefixedKey,
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
    const { customerRoleConfigs = [], providerRoleConfigs = [] } = configs;

    const newCustomerConfig =
      config.showTo === 'customer'
        ? [
            {
              ...config,
              key: getPrefixedKey('customer', config.key),
            },
          ]
        : [];
    const newProviderConfig =
      config.showTo === 'provider'
        ? [
            {
              ...config,
              key: getPrefixedKey('provider', config.key),
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
    className: className,
  };

  const sectionDetailsPropsProvider = {
    ...props,
    fieldConfigs: providerRoleConfigs,
    className: className,
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
        />
      ) : role === 'provider' && providerRoleConfigs?.length > 0 ? (
        <CustomExtendedDataSection
          sectionDetailsProps={sectionDetailsPropsProvider}
          propsForCustomFields={propsForProviderCustomFields}
          idPrefix="transactionPage"
          pickExtendedDataFields={pickExtendedDataFields}
        />
      ) : null}
    </>
  );
};

export default CustomTransactionFields;
