import React from 'react';
import { FormattedMessage } from '../../util/reactIntl';
import { Heading } from '../../components';

import css from './ProfilePage.module.css';

const SectionDetailsMaybe = props => {
  const { publicData, metadata, userFieldConfig, intl } = props;

  if (!publicData || !userFieldConfig) {
    return null;
  }

  const pickUserFields = (filteredConfigs, config) => {
    const { key, schemaType, enumOptions, includeForListingTypes, label, showConfig = {} } = config;
    const listingType = publicData.listingType;
    const isTargetListingType =
      includeForListingTypes == null || includeForListingTypes.includes(listingType);

    const { displayInProfile } = showConfig;
    const publicDataValue = publicData && publicData[key];
    const metadataValue = metadata && metadata[key];
    const value = publicDataValue || metadataValue;

    if (displayInProfile && isTargetListingType && typeof value !== 'undefined') {
      const findSelectedOption = enumValue => enumOptions?.find(o => enumValue === `${o.option}`);
      const getBooleanMessage = value =>
        value
          ? intl.formatMessage({ id: 'ProfilePage.detailYes' })
          : intl.formatMessage({ id: 'ProfilePage.detailNo' });
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

  const existingUserFields = userFieldConfig.reduce(pickUserFields, []);

  return existingUserFields.length > 0 ? (
    <div className={css.sectionDetails}>
      <Heading as="h2" rootClassName={css.sectionHeading}>
        <FormattedMessage id="ProfilePage.detailsTitle" />
      </Heading>
      <ul className={css.details}>
        {existingUserFields.map(detail => (
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
