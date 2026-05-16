import React, { useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { useIntl } from '../../../../util/reactIntl';
import AVCategoryCard from '../../../../components/AVCategoryCard/AVCategoryCard';
import useDebouncedWindowResize from '../../../../hooks/useDebouncedWindowResize';

import Field, { hasDataInFields } from '../../Field';
import AVSectionContainer from '../SectionContainer/AVSectionContainer';
import css from './SectionSelectedCat.module.css';

const KEY_CODE_ARROW_LEFT = 37;
const KEY_CODE_ARROW_RIGHT = 39;

const COLUMN_CONFIG = [
  { css: css.oneColumn, responsiveImageSizes: '(max-width: 767px) 100vw, 1200px' },
  { css: css.twoColumns, responsiveImageSizes: '(max-width: 767px) 100vw, 600px' },
  { css: css.threeColumns, responsiveImageSizes: '(max-width: 767px) 100vw, 400px' },
  { css: css.fourColumns, responsiveImageSizes: '(max-width: 767px) 100vw, 265px' },
];

const getColumnIndex = numColumns => {
  if (!numColumns || numColumns < 1) return 0;
  return Math.min(numColumns, COLUMN_CONFIG.length) - 1;
};
const getColumnClass = numColumns =>
  COLUMN_CONFIG[getColumnIndex(numColumns)]?.css || COLUMN_CONFIG[0].css;

const getEffectiveColumns = numColumns => {
  if (typeof window === 'undefined') return numColumns;
  const w = window.innerWidth;
  if (w < 550) return 1;
  if (w < 768) return Math.min(2, numColumns);
  return numColumns;
};

const getGapValue = slider => {
  if (!slider || typeof window === 'undefined') return 0;
  const gap = window.getComputedStyle(slider).columnGap || '0';
  const parsed = parseInt(gap, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
};

/**
 * SectionSelectedCat
 *
 * Carousel section that displays listing categories as visual cards.
 * Each CMS block represents one category:
 *   - blockName: category ID (e.g. "blazers") — used for the search link
 *   - title:     optional display name override (falls back to formatted blockName)
 *   - media:     image shown in the card
 *
 * No SDK fetch needed — all data comes from the CMS section blocks.
 */
const SectionSelectedCat = props => {
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
    blocks = [],
  } = props;

  const sliderContainerRef = useRef(null);
  const sliderRef = useRef(null);

  const [effectiveColumns, setEffectiveColumns] = useState(numColumns);
  const normalizedColumns = Math.min(Math.max(effectiveColumns, 1), COLUMN_CONFIG.length);

  const setCarouselWidth = () => {
    if (!blocks.length) return;
    const container = sliderContainerRef.current;
    if (!container) return;
    const scrollbarWidth = window.innerWidth - document.body.clientWidth;
    const containerWidth =
      container.clientWidth >= window.innerWidth - scrollbarWidth
        ? window.innerWidth
        : container.clientWidth;
    container.style.setProperty('--carouselWidth', `${containerWidth - scrollbarWidth}px`);
    setEffectiveColumns(getEffectiveColumns(numColumns));
  };
  useDebouncedWindowResize(setCarouselWidth);

  const fieldComponents = options?.fieldComponents;
  const fieldOptions = { fieldComponents };
  const hasHeaderFields = hasDataInFields([title, description, callToAction], fieldOptions);
  const hasBlocks = blocks.length > 0;
  const hideArrows = blocks.length <= normalizedColumns;
  const previousLabel = intl.formatMessage({ id: 'AVCarousel.previous' });
  const nextLabel = intl.formatMessage({ id: 'AVCarousel.next' });

  const slide = direction => {
    const slider = sliderRef.current;
    const container = sliderContainerRef.current;
    if (!slider || !container || typeof window === 'undefined') return;
    const firstItem = slider.querySelector(`.${css.carouselItem}`);
    const itemWidth = firstItem?.getBoundingClientRect()?.width || container.clientWidth;
    const gap = getGapValue(slider);
    const step = normalizedColumns * itemWidth + Math.max(normalizedColumns - 1, 0) * gap;
    slider.scrollTo({
      left: direction === 'left' ? slider.scrollLeft - step : slider.scrollLeft + step,
      behavior: 'smooth',
    });
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
    <AVSectionContainer
      id={sectionId}
      className={className}
      rootClassName={rootClassName}
      appearance={appearance}
      options={fieldOptions}
      customOption={customOption}
    >
      {hasHeaderFields ? (
        <header className={classNames(css.sectionHeader, defaultClasses.sectionDetailsH)}>
          <div className={css.textBlock}>
            <Field
              data={title}
              className={classNames(defaultClasses.title, css.title)}
              options={fieldOptions}
            />
            <Field
              data={description}
              className={classNames(defaultClasses.description, css.description)}
              options={fieldOptions}
            />
          </div>
          <Field
            data={callToAction}
            className={classNames(defaultClasses.ctaButton, css.ctaButton)}
            options={fieldOptions}
          />
        </header>
      ) : null}
      {hasBlocks ? (
        <div
          className={classNames(defaultClasses.blockContainer, css.carouselOuter, {
            [css.noSidePaddings]: isInsideContainer,
          })}
          ref={sliderContainerRef}
        >
          <div className={classNames(css.carouselArrows, { [css.hideArrows]: hideArrows })}>
            <button
              className={css.carouselArrow}
              onClick={onSlideLeft}
              onKeyDown={onKeyDown}
              aria-label={previousLabel}
            >
              ‹
            </button>
            <button
              className={css.carouselArrow}
              onClick={onSlideRight}
              onKeyDown={onKeyDown}
              aria-label={nextLabel}
            >
              ›
            </button>
          </div>
          <div
            className={classNames(css.slider, getColumnClass(normalizedColumns))}
            ref={sliderRef}
          >
            {blocks.map(block => (
              <div key={block.blockId || block.blockName} className={css.carouselItem}>
                <AVCategoryCard
                  categoryId={block.blockName}
                  name={block.title?.content}
                  media={block.media}
                  className={css.categoryCard}
                />
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </AVSectionContainer>
  );
};

export default SectionSelectedCat;
