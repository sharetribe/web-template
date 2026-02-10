import React from 'react';
import classNames from 'classnames';

import { FormattedMessage } from '../../util/reactIntl';

import { Heading } from '../../components';

import css from './CustomExtendedDataSection.module.css';

const SectionDetails = props => {
  const { fieldConfigs, pickExtendedDataFields, heading, className, rootClassName } = props;

  const classes = classNames(rootClassName || css.sectionDetails, className);

  if (!fieldConfigs) {
    return null;
  }

  const existingFields = fieldConfigs?.reduce(pickExtendedDataFields, []);

  return existingFields?.length > 0 ? (
    <section className={classes}>
      {heading ? (
        <Heading as="h2" rootClassName={css.sectionHeading}>
          <FormattedMessage id={heading} />
        </Heading>
      ) : null}
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

export default SectionDetails;
