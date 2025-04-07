import React from 'react';
import { useIntl } from '../../../../util/reactIntl';
import classNames from 'classnames';
import { ListingCard } from '../../../../components';

import Field, { hasDataInFields } from '../../Field';

import SectionContainer from '../SectionContainer';
import css from './SectionRecommendedListings.module.css';

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
const SectionRecommendedListings = props => {
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
  const hasListings = listings.length > 0;

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
        <header className={defaultClasses.sectionDetails}>
          <Field data={title} className={defaultClasses.title} options={fieldOptions} />
          <Field data={description} className={defaultClasses.description} options={fieldOptions} />
          <Field data={callToAction} className={defaultClasses.ctaButton} options={fieldOptions} />
        </header>
      ) : null}
      {hasListings ? (
        <div
          className={classNames(defaultClasses.blockContainer, getColumnCSS(numColumns), {
            [css.noSidePaddings]: isInsideContainer,
          })}
        >
          {listings.map(l => (
            <ListingCard key={l.id.uuid} listing={l} intl={intl} />
          ))}
        </div>
      ) : null}
    </SectionContainer>
  );
};

export default SectionRecommendedListings;