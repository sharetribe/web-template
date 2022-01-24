import React from 'react';
import { FormattedMessage } from '../../util/reactIntl';
import { PropertyGroup } from '../../components';

import css from './ListingPage.module.css';

const SectionDetailsMaybe = props => {
  const { publicData, metadata = {}, customConfig, intl } = props;
  const { listingExtendedData } = customConfig || {};

  if (!publicData || !customConfig) {
    return null;
  }

  const pickExtendedData = (filteredConfigs, config) => {
    const { key, schemaType, schemaOptions, listingPageConfig = {} } = config;
    const { isDetail, label } = listingPageConfig;
    const publicDataValue = publicData[key];
    const metadataValue = metadata[key];
    const value = publicDataValue || metadataValue;

    if (isDetail && typeof value !== 'undefined') {
      const findSelectedOption = enumValue =>
        schemaOptions.find(o => enumValue === `${o}`.toLowerCase().replace(/\s/g, '_'));
      const getBooleanMessage = value =>
        value
          ? intl.formatMessage({ id: 'SearchPage.detailYes' })
          : intl.formatMessage({ id: 'SearchPage.detailNo' });
      return schemaType === 'enum'
        ? filteredConfigs.concat({ key, value: findSelectedOption(value), label })
        : schemaType === 'boolean'
        ? filteredConfigs.concat({ key, value: getBooleanMessage(value), label })
        : schemaType === 'long'
        ? filteredConfigs.concat({ key, value, label })
        : null;
    }
    return filteredConfigs;
  };

  const existingExtendedData = listingExtendedData.reduce(pickExtendedData, []);

  return existingExtendedData ? (
    <div className={css.sectionDetails}>
      <h2 className={css.detailsTitle}>
        <FormattedMessage id="ListingPage.detailsTitle" />
      </h2>
      <ul className={css.details}>
        {existingExtendedData.map(detail => (
          <li key={detail.key} className={css.detailsRow}>
            <span className={css.detailLabel}>{detail.label}</span>
            <span>{detail.value}</span>
          </li>
        ))}
      </ul>
    </div>
  ) : null;
};

export default SectionDetailsMaybe;
