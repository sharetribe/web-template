import React from 'react';
import { useIntl } from '../../../../util/reactIntl';
import classNames from 'classnames';
import { AVListingCard } from '../../../../components';

import Field, { hasDataInFields } from '../../Field';

import SectionContainer from '../SectionContainer';
import css from './SectionSelectedListings.module.css';

// The number of columns (numColumns) affects styling and responsive images
const COLUMN_CONFIG = [
  { css: css.oneColumn, responsiveImageSizes: '(max-width: 767px) 100vw, 1200px' },
  { css: css.twoColumns, responsiveImageSizes: '(max-width: 767px) 100vw, 600px' },
  { css: css.threeColumns, responsiveImageSizes: '(max-width: 767px) 100vw, 400px' },
  { css: css.fourColumns, responsiveImageSizes: '(max-width: 767px) 100vw, 265px' },
];
const getIndex = numColumns => numColumns - 1;
const getColumnCSS = numColumns => {
  const config = COLUMN_CONFIG[getIndex(numColumns)];
  return config ? config.css : COLUMN_CONFIG[0].css;
};

// Section component that's able to show blocks in multiple different columns (defined by "numColumns" prop)
const SectionSelectedListings = props => {
  const intl = useIntl();
  const {
    sectionId,
    className,
    rootClassName,
    defaultClasses,
    numColumns,
    title,
    description,
    appearance,
    callToAction,
    isInsideContainer,
    options,
    customOption,
    listings,
  } = props;

  // If external mapping has been included for fields
  // E.g. { h1: { component: MyAwesomeHeader } }
  const fieldComponents = options?.fieldComponents;
  const fieldOptions = { fieldComponents };

  const hasHeaderFields = hasDataInFields([title, description, callToAction], fieldOptions);
  const hasListings = listings && listings.length > 0;

  return (
    <SectionContainer
      id={sectionId}
      className={className}
      rootClassName={rootClassName}
      appearance={appearance}
      options={fieldOptions}
      customOption={customOption}
    >
      {hasHeaderFields ? (
        <header className={classNames(css.sectionHeader, defaultClasses.sectionDetails)}>
          <div className={css.textBlock}>
            <Field data={title} className={classNames(defaultClasses.title, css.title)} options={fieldOptions} />
            <Field data={description} className={classNames(defaultClasses.description, css.description)} options={fieldOptions} />
          </div>
          <Field data={callToAction} className={classNames(defaultClasses.ctaButton, css.ctaButton)} options={fieldOptions} />
        </header>
      ) : null}
      {hasListings ? (
        <div
          className={classNames(defaultClasses.blockContainer, css.baseColumn, {
            [css.noSidePaddings]: isInsideContainer,
          })}
        >
          {listings.map(l => (
            <AVListingCard key={l.id.uuid} listing={l} intl={intl} className={css.listingCard} />
          ))}
        </div>
      ) : null}
    </SectionContainer>
  );
};

export default SectionSelectedListings;