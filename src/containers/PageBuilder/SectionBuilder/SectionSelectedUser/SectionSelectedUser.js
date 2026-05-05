import React, { useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import AVUserCard from '../../../../components/AVUserCard/AVUserCard';
import useDebouncedWindowResize from '../../../../hooks/useDebouncedWindowResize';

import Field, { hasDataInFields } from '../../Field';
import SectionContainer from '../SectionContainer';
import css from './SectionSelectedUser.module.css';

const KEY_CODE_ARROW_LEFT = 37;
const KEY_CODE_ARROW_RIGHT = 39;

const COLUMN_CONFIG = [
  { css: css.oneColumn },
  { css: css.twoColumns },
  { css: css.threeColumns },
  { css: css.fourColumns },
];

const getColumnIndex = numColumns => {
  if (!numColumns || numColumns < 1) return 0;
  return Math.min(numColumns, COLUMN_CONFIG.length) - 1;
};

const getColumnClass = numColumns => COLUMN_CONFIG[getColumnIndex(numColumns)]?.css || COLUMN_CONFIG[0].css;

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
 * SectionSelectedUser
 *
 * Carousel section that displays hand-picked user profile cards.
 * Each CMS block represents one user:
 *   - blockName: user UUID — fetched from SDK and injected as `users` prop by the AV extension
 *
 * sectionId prefix: av-selected-users
 */
const SectionSelectedUser = props => {
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
    users = [],
  } = props;

  // Build lookup: userId → block overrides (title text + media image)
  const blocksByUserId = blocks.reduce((acc, block) => {
    if (block.blockName) {
      acc[block.blockName] = block;
    }
    return acc;
  }, {});

  const sliderContainerRef = useRef(null);
  const sliderRef = useRef(null);

  const [effectiveColumns, setEffectiveColumns] = useState(numColumns);
  const normalizedColumns = Math.min(Math.max(effectiveColumns, 1), COLUMN_CONFIG.length);

  const setCarouselWidth = () => {
    if (!users.length) return;
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
  const hasUsers = users.length > 0;
  const hideArrows = users.length <= normalizedColumns;

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

  const onSlideLeft = e => { slide('left'); e.target.focus(); };
  const onSlideRight = e => { slide('right'); e.target.focus(); };
  const onKeyDown = e => {
    if (e.keyCode === KEY_CODE_ARROW_LEFT) { e.preventDefault(); slide('left'); }
    else if (e.keyCode === KEY_CODE_ARROW_RIGHT) { e.preventDefault(); slide('right'); }
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
        <header className={classNames(css.sectionHeader, defaultClasses.sectionDetailsH)}>
          <div className={css.textBlock}>
            <Field data={title} className={classNames(defaultClasses.title, css.title)} options={fieldOptions} />
            <Field data={description} className={classNames(defaultClasses.description, css.description)} options={fieldOptions} />
          </div>
          <Field data={callToAction} className={classNames(defaultClasses.ctaButton, css.ctaButton)} options={fieldOptions} />
        </header>
      ) : null}
      {hasUsers ? (
        <div
          className={classNames(defaultClasses.blockContainer, css.carouselOuter, {
            [css.noSidePaddings]: isInsideContainer,
          })}
          ref={sliderContainerRef}
        >
          <div className={classNames(css.carouselArrows, { [css.hideArrows]: hideArrows })}>
            <button className={css.carouselArrow} onClick={onSlideLeft} onKeyDown={onKeyDown} aria-label="Previous">
              ‹
            </button>
            <button className={css.carouselArrow} onClick={onSlideRight} onKeyDown={onKeyDown} aria-label="Next">
              ›
            </button>
          </div>
          <div className={classNames(css.slider, getColumnClass(normalizedColumns))} ref={sliderRef}>
            {users.map(user => {
              const userId = user.id?.uuid;
              const block = blocksByUserId[userId] || {};
              return (
                <div key={userId} className={css.carouselItem}>
                  <AVUserCard
                    user={user}
                    overrideTitle={block.title?.content || null}
                    overrideMedia={block.media || null}
                    className={css.userCard}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </SectionContainer>
  );
};

export default SectionSelectedUser;
