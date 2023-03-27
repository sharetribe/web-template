import React from 'react';
import { FormattedMessage } from '../../util/reactIntl';
import { Heading } from '../../components';

import css from './ListingPage.module.css';

const SectionDetailsMaybe = props => {
  const { publicData, metadata = {}, listingConfig, intl } = props;
  const { listingFields } = listingConfig || {};

  if (!publicData || !listingConfig) {
    return null;
  }

  const pickListingFields = (filteredConfigs, config) => {
    const { key, schemaType, enumOptions, showConfig = {} } = config;
    const { isDetail, label } = showConfig;
    const publicDataValue = publicData[key];
    const metadataValue = metadata[key];
    const value = publicDataValue || metadataValue;

    if (isDetail && typeof value !== 'undefined') {
      const findSelectedOption = enumValue => enumOptions?.find(o => enumValue === `${o.option}`);
      const getBooleanMessage = value =>
        value
          ? intl.formatMessage({ id: 'SearchPage.detailYes' })
          : intl.formatMessage({ id: 'SearchPage.detailNo' });
      const optionConfig = findSelectedOption(value);

      return schemaType === 'enum'
        ? filteredConfigs.concat({ key, value: optionConfig?.label, label })
        : schemaType === 'boolean'
        ? filteredConfigs.concat({ key, value: getBooleanMessage(value), label })
        : schemaType === 'long'
        ? filteredConfigs.concat({ key, value, label })
        : filteredConfigs;
    }
    return filteredConfigs;
  };

  const existingListingFields = listingFields.reduce(pickListingFields, []);

  return existingListingFields.length > 0 ? (
    <div className={css.sectionDetails}>
      <Heading as="h2" rootClassName={css.sectionHeading}>
        <FormattedMessage id="ListingPage.detailsTitle" />
      </Heading>
      <ul className={css.details}>
        {existingListingFields.map(detail => (
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
