import React from 'react';
import { FormattedMessage } from '../../util/reactIntl';
import { isFieldForListingType } from '../../util/fieldHelpers';
import { Heading } from '../../components';
import { richText } from '../../util/richText';

import css from './ListingPage.module.css';

const MIN_LENGTH_FOR_LONG_WORDS = 20;

const SectionDetailsMaybe = props => {
  const { publicData, metadata = {}, listingFieldConfigs, isFieldForCategory, intl } = props;

  if (!publicData || !listingFieldConfigs) {
    return null;
  }

  const pickListingFields = (filteredConfigs, config) => {
    const { key, schemaType, enumOptions, showConfig = {} } = config;
    const listingType = publicData.listingType;
    const isTargetListingType = isFieldForListingType(listingType, config);
    const isTargetCategory = isFieldForCategory(config);

    const { isDetail, label } = showConfig;
    const publicDataValue = publicData[key];
    const metadataValue = metadata[key];
    const value = publicDataValue || metadataValue;

    if (isDetail && isTargetListingType && isTargetCategory && typeof value !== 'undefined') {
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
        : schemaType === 'text'
        ? filteredConfigs.concat({
            key,
            value: richText(value, {
              linkify: true,
              longWordMinLength: MIN_LENGTH_FOR_LONG_WORDS,
              longWordClass: css.longWord,
              breakChars: '/',
            }),
            label,
            isText: true,
          })
        : filteredConfigs;
    }
    return filteredConfigs;
  };

  const existingListingFields = listingFieldConfigs.reduce(pickListingFields, []);

  return existingListingFields.length > 0 ? (
    <section className={css.sectionDetails}>
      <Heading as="h2" rootClassName={css.sectionHeading}>
        <FormattedMessage id="ListingPage.detailsTitle" />
      </Heading>
      <ul className={css.details}>
        {existingListingFields.map(detail => (
          <li key={detail.key} className={css.detailsRow}>
            <span className={css.detailLabel}>{detail.label}</span>
            <span className={detail.isText ? css.text : ''}>{detail.value}</span>
          </li>
        ))}
      </ul>
    </section>
  ) : null;
};

export default SectionDetailsMaybe;
