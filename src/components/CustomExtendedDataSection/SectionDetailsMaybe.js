import React from 'react';

import { FormattedMessage } from '../../util/reactIntl';

import { Heading } from '../../components';

import css from './CustomExtendedDataSection.module.css';

const SectionDetailsMaybe = props => {
  const { fieldConfigs, pickExtendedDataFields, heading } = props;

  if (!fieldConfigs) {
    return null;
  }

  const existingFields = fieldConfigs?.reduce(pickExtendedDataFields, []);

  return existingFields?.length > 0 ? (
    <section className={css.sectionDetails}>
      <Heading as="h2" rootClassName={css.sectionHeading}>
        <FormattedMessage id={heading} />
      </Heading>
      <ul className={css.details}>
        {existingFields.map(detail => (
          <li key={detail.key} className={css.detailsRow}>
            <span className={css.detailLabel}>{detail.label}</span>
            <span>{detail.value}</span>
          </li>
        ))}
      </ul>
    </section>
  ) : null;
};

export default SectionDetailsMaybe;
