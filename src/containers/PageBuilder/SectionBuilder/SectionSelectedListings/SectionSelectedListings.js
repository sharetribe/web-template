import React, { useEffect, useRef } from 'react';
import classNames from 'classnames';
import { useIntl } from '../../../../util/reactIntl';
import { AVListingCard } from '../../../../components';

import Field, { hasDataInFields } from '../../Field';

import SectionContainer from '../SectionContainer';
import css from './SectionSelectedListings.module.css';

const KEY_CODE_ARROW_LEFT = 37;
const KEY_CODE_ARROW_RIGHT = 39;

// The number of columns (numColumns) affects styling and responsive images
const COLUMN_CONFIG = [
  { css: css.oneColumn, responsiveImageSizes: '(max-width: 767px) 100vw, 1200px' },
  { css: css.twoColumns, responsiveImageSizes: '(max-width: 767px) 100vw, 600px' },
  { css: css.threeColumns, responsiveImageSizes: '(max-width: 767px) 100vw, 400px' },
  { css: css.fourColumns, responsiveImageSizes: '(max-width: 767px) 100vw, 265px' },
];

const getColumnIndex = numColumns => {
  if (!numColumns || numColumns < 1) {
    return 0;
  }

  const clamped = Math.min(numColumns, COLUMN_CONFIG.length);
  return clamped - 1;
};

const getColumnClass = numColumns => {
  const config = COLUMN_CONFIG[getColumnIndex(numColumns)];
  return config ? config.css : COLUMN_CONFIG[0].css;
};

const getResponsiveImageSizes = numColumns => {
  const config = COLUMN_CONFIG[getColumnIndex(numColumns)];
  return config ? config.responsiveImageSizes : COLUMN_CONFIG[0].responsiveImageSizes;
};

const getGapValue = slider => {
  if (!slider || typeof window === 'undefined') {
    return 0;
  }

  const sliderStyles = window.getComputedStyle(slider);
  const gap = sliderStyles.columnGap || sliderStyles.gap || '0';
  const parsed = parseInt(gap, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
};

// Section component that renders selected listings in a single-row carousel
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
    listings = [],
  } = props;
  const sliderContainerRef = useRef(null);
  const sliderRef = useRef(null);

  const normalizedColumns = Math.min(Math.max(numColumns || 1, 1), COLUMN_CONFIG.length);

  useEffect(() => {
    if (!listings.length || typeof window === 'undefined') {
      return () => {};
    }

    const setCarouselWidth = () => {
      const container = sliderContainerRef.current;
      if (!container) {
        return;
      }

      const windowWidth = window.innerWidth;
      const scrollbarWidth = window.innerWidth - document.body.clientWidth;
      const containerWidth =
        container.clientWidth >= windowWidth - scrollbarWidth ? windowWidth : container.clientWidth;
      const carouselWidth = containerWidth - scrollbarWidth;

      container.style.setProperty('--carouselWidth', `${carouselWidth}px`);
    };

    setCarouselWidth();
    window.addEventListener('resize', setCarouselWidth);

    return () => window.removeEventListener('resize', setCarouselWidth);
  }, [listings.length]);

  // If external mapping has been included for fields
  // E.g. { h1: { component: MyAwesomeHeader } }
  const fieldComponents = options?.fieldComponents;
  const fieldOptions = { fieldComponents };

  const hasHeaderFields = hasDataInFields([title, description, callToAction], fieldOptions);
  const hasListings = listings.length > 0;
  const hideArrows = listings.length <= normalizedColumns;
  const renderSizes = getResponsiveImageSizes(normalizedColumns);

  const slide = direction => {
    const slider = sliderRef.current;
    const container = sliderContainerRef.current;

    if (!slider || !container || typeof window === 'undefined') {
      return;
    }

    const firstItem = slider.querySelector(`.${css.carouselItem}`);
    const itemWidth = firstItem?.getBoundingClientRect()?.width || container.clientWidth;
    const gap = getGapValue(slider);
    const step = normalizedColumns * itemWidth + Math.max(normalizedColumns - 1, 0) * gap;
    const nextLeft =
      direction === 'left' ? slider.scrollLeft - step : slider.scrollLeft + step;

    slider.scrollTo({ left: nextLeft, behavior: 'smooth' });
  };

  const onSlideLeft = e => {
    slide('left');
    e.target.focus();
  };

  const onSlideRight = e => {
    slide('right');
    e.target.focus();
  };

  const onKeyDown = e => {
    if (e.keyCode === KEY_CODE_ARROW_LEFT) {
      e.preventDefault();
      slide('left');
    } else if (e.keyCode === KEY_CODE_ARROW_RIGHT) {
      e.preventDefault();
      slide('right');
    }
  };

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
          className={classNames(defaultClasses.blockContainer, css.carouselOuter, {
            [css.noSidePaddings]: isInsideContainer,
          })}
          ref={sliderContainerRef}
        >
          <div
            className={classNames(css.carouselArrows, {
              [css.hideArrows]: hideArrows,
            })}
          >
            <button className={css.carouselArrow} onClick={onSlideLeft} onKeyDown={onKeyDown}>
              ‹
            </button>
            <button className={css.carouselArrow} onClick={onSlideRight} onKeyDown={onKeyDown}>
              ›
            </button>
          </div>
          <div className={classNames(css.slider, getColumnClass(normalizedColumns))} ref={sliderRef}>
            {listings.map(l => (
              <div key={l.id.uuid} className={css.carouselItem}>
                <AVListingCard
                  listing={l}
                  intl={intl}
                  className={css.listingCard}
                  renderSizes={renderSizes}
                />
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </SectionContainer>
  );
};

export default SectionSelectedListings;
