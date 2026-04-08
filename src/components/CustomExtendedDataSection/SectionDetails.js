import React from 'react';
import classNames from 'classnames';

import { FormattedMessage } from '../../util/reactIntl';

import { richText } from '../../util/richText';

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
        {existingFields.map(detail => {
          // Note: currently, we are auto-linking any value of these key-value details.
          // If this behaviour needs to be changed later (e.g. due to a separate "custom link field"),
          // we need to add an extra flag (linkify: true) through getDetailCustomFieldValue function in util/fieldHelpers.js
          const valueContent = richText(detail.value, {
            linkify: true,
          });
          return (
            <li key={detail.key} className={css.detailsRow}>
              <span className={css.detailLabel}>{detail.label}</span>
              <span>{valueContent}</span>
            </li>
          );
        })}
      </ul>
    </section>
  ) : null;
};

export default SectionDetails;
