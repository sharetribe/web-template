import React, { useEffect, useState } from 'react';
import classNames from 'classnames';

// Import configs and components
import { useConfiguration } from '../../../../context/configurationContext';
import { lazyLoadWithDimensions } from '../../../../util/uiHelpers';
import { FormattedMessage } from '../../../../util/reactIntl';

import { ListingCard, IconSpinner, ErrorMessage } from '../../../../components';

import Field, { hasDataInFields } from '../../Field';
import SectionContainer from '../SectionContainer';

import css from './SectionListings.module.css';

const KEY_ARROW_LEFT = 'ArrowLeft';
const KEY_ARROW_RIGHT = 'ArrowRight';
const MAX_MOBILE_SCREEN_WIDTH = 768;

// Configuration for supported column layouts
// Only 3 and 4 columns are supported in this component
const COLUMN_CONFIG = {
  3: {
    css: css.threeColumns,
    responsiveImageSizes: '(max-width: 767px) 100vw, (max-width: 1024px) 33vw, 330px',
  },
  4: {
    css: css.fourColumns,
    responsiveImageSizes: '(max-width: 767px) 100vw, (max-width: 1024px) 33vw, 240px',
  },
};

/**
 * Get the CSS class for the specified number of columns
 * @param {number} numColumns - Number of columns (3 or 4)
 * @returns {string} CSS class for the column layout, defaults to 3 columns
 */
const getColumnCSS = numColumns => {
  const config = COLUMN_CONFIG[numColumns];
  return config ? config.css : COLUMN_CONFIG[3].css;
};

const getResponsiveImageSizes = numColumns => {
  const config = COLUMN_CONFIG[numColumns];
  return config ? config.responsiveImageSizes : COLUMN_CONFIG[3].responsiveImageSizes;
};

const parseAspectRatio = aspectRatio => {
  const [width, height] = aspectRatio.split('/').map(Number);
  return width / height;
};

const isMobileViewport = () => {
  const hasMatchMedia = typeof window !== 'undefined' && window?.matchMedia;
  return hasMatchMedia
    ? window.matchMedia(`(max-width: ${MAX_MOBILE_SCREEN_WIDTH}px)`)?.matches
    : false;
};

/**
 * Calculate the dynamic height for the carousel container based on card dimensions
 *
 * ⚠️ This function contains hardcoded values that refer to the properties defined in ListingCard.module.css
 * If you modify ListingCard's font sizes, padding, margins, or layout you need to also update this function to match.
 * See ListingCard.module.css for the properties this function refers to (search ⚠️ in ListingCard.module.css to find the relevant properties).
 *
 * @param {number} numColumns - Number of columns in the layout
 * @param {Object} config - Configuration object containing layout settings
 * @param {number} carouselWidth - Width of the carousel container
 * @param {boolean} isMobileBreakpoint - Whether the viewport is mobile
 * @returns {number} Calculated height in pixels
 */
const calculateCarouselHeight = (
  numColumns,
  config,
  carouselWidth,
  isMobileBreakpoint = false,
  error
) => {
  const errorMessageHeight = 250;

  if (error) {
    return errorMessageHeight;
  }
  const thumbnailAspectRatio = config.layout.listingImage.aspectRatio;
  const paddingHorizontal = 2 * 32; // 2x32px
  const titleHeightSingleLine = 16;
  const titleHeightDoubleLine = titleHeightSingleLine * 2;
  const cardInfoPadding = 14 + 2; // padding-top + padding-bottom
  const priceHeight = 16 + 4; // height + margin-bottom
  const authorInfoHeight = 24;
  const contentMaxWidthPages = 1120;
  const containerPaddingTop = 32;
  const containerPaddingBottom = 24;

  const priceHeightMobile = 18 + 4; // 18 + margin bottom
  const authorInfoHeightMobile = 18 + 4 + 4; // 18 + padding top + padding bottom
  const titleHeightSingleLineMobile = 18;
  const cardInfoHeightMobile =
    priceHeightMobile + authorInfoHeightMobile + titleHeightSingleLineMobile + cardInfoPadding;

  const parsedAspectRatio = parseAspectRatio(thumbnailAspectRatio);

  const gutters = isMobileBreakpoint ? 0 : numColumns === 3 ? 64 : 96;

  const mainColumnWidth = Math.min(contentMaxWidthPages, carouselWidth);
  const cardWidth =
    (mainColumnWidth - paddingHorizontal - gutters) / (isMobileBreakpoint ? 1 : numColumns);
  const cardImageHeight = cardWidth / parsedAspectRatio;
  const cardInfoHeight = priceHeight + titleHeightSingleLine + authorInfoHeight + cardInfoPadding;

  const totalCardHeight =
    cardImageHeight + (isMobileBreakpoint ? cardInfoHeightMobile : cardInfoHeight);
  const totalWithPaddings = totalCardHeight + containerPaddingTop + containerPaddingBottom;

  return Math.ceil(totalWithPaddings);
};

/**
 * Component that renders the listing cards in a carousel layout
 * Used with lazy loading wrapper for performance optimization
 * @param {Object} props - Component properties
 * @param {number} props.numColumns - Number of columns to display
 * @param {Array} props.listings - Array of listing data
 * @param {React.RefObject} props.sliderRef - Ref object for the slider element
 * @param {boolean} props.darkMode - Whether to apply dark mode styling
 * @returns {JSX.Element} Carousel container with listing cards
 */
const ListingCarouselComponent = props => {
  const {
    numColumns,
    listings,
    sliderRef,
    darkMode,
    onFetchFeaturedListings,
    fetched,
    inProgress,
    parentPage,
    sectionId,
    config,
    error,
    allSections,
    isInsideContainer,
  } = props;

  const listingImageConfig = config.layout.listingImage;

  useEffect(() => {
    if (!fetched && inProgress !== true && !error) {
      onFetchFeaturedListings(sectionId, parentPage, listingImageConfig, allSections);
    }
  }, []);

  if (inProgress == true) {
    return <IconSpinner className={css.centeredContent} />;
  }

  if (error) {
    return (
      <div className={css.genericErrorContainer} role="alert">
        <h4 className={css.genericErrorTitle}>
          <FormattedMessage id="SectionListings.genericErrorTitle" />
        </h4>
        <ErrorMessage error={error} />
      </div>
    );
  }

  return listings.length > 0 ? (
    <ul className={getColumnCSS(numColumns, false)} ref={sliderRef} role="list">
      {listings.map(listing => (
        <li key={listing.id.uuid} className={css.listItem}>
          <ListingCard
            className={classNames(css.card, { [css.isInsideContainer]: isInsideContainer })}
            aspectRatioClassName={css.carouselImageHoverEffect}
            listing={listing}
            darkMode={darkMode}
            renderSizes={getResponsiveImageSizes(numColumns)}
          />
        </li>
      ))}
    </ul>
  ) : null;
};

const LazyListingCarouselComponent = lazyLoadWithDimensions(ListingCarouselComponent);

/**
 * Main component for rendering a listings section with carousel functionality
 * Supports 3 or 4 column layouts with horizontal scrolling and responsive behavior
 * @param {Object} props - Component properties
 * @param {string} props.sectionId - Unique identifier for this section
 * @param {number} props.numColumns - Number of columns (3 or 4, defaults to 3)
 * @param {Object} props.appearance - Styling configuration including text color
 * @param {Object} props.title - Title field data
 * @param {Object} props.description - Description field data
 * @param {Object} props.callToAction - CTA button field data
 * @returns {JSX.Element} Complete listings section with header and carousel
 */
const SectionListings = props => {
  const config = useConfiguration();
  const {
    sectionId,
    className,
    rootClassName,
    defaultClasses,
    numColumns = 3,
    appearance,
    title,
    description,
    callToAction,
    options,
    allSections,
    isInsideContainer,
  } = props;

  const { featuredListings, isOpen } = options;
  const {
    onFetchFeaturedListings,
    getListingEntitiesById,
    parentPage,
    featuredListingData,
  } = featuredListings;

  const listingIds = featuredListingData?.[sectionId]?.listingIds;
  const listingEntities = listingIds ? getListingEntitiesById(listingIds) : [];

  const fetched = featuredListingData?.[sectionId]?.fetched || false;
  const inProgress = featuredListingData?.[sectionId]?.inProgress;

  const error = featuredListingData?.[sectionId]?.error;

  const numberOfListings = listingEntities?.length > 0 ? listingIds?.length : 0;

  const [carouselWidthConstant, setCarouselWidthConstant] = useState(null);
  const [mounted, setMounted] = useState(false);

  const containerRef = React.useRef(null);
  const sliderRef = React.useRef(null);

  // force mobile styles if we render this section within a modal
  const isMobile = mounted && isMobileViewport();
  const isMobileBreakpoint = isMobile || isInsideContainer;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const setCarouselWidth = () => {
      const elem = containerRef.current;
      if (!elem) return;

      if (isInsideContainer && !isMobile) {
        // When inside container (this is when either the ToS or Privacy Policy page are opened inside the modal on the authentication page), use the element's actual width
        const carouselWidth = 604;
        elem.style.setProperty('--carouselWidth', `${carouselWidth}px`);
        setCarouselWidthConstant(carouselWidth);
      } else {
        const windowWidth = window.innerWidth;
        const scrollbarWidth = window.innerWidth - document.body.clientWidth;
        const elementWidth =
          elem.clientWidth >= windowWidth - scrollbarWidth ? windowWidth : elem.clientWidth;
        const carouselWidth = elementWidth - scrollbarWidth;
        elem.style.setProperty('--carouselWidth', `${carouselWidth}px`);
        setCarouselWidthConstant(carouselWidth);
      }
    };
    setCarouselWidth();

    window.addEventListener('resize', setCarouselWidth);
    return () => window.removeEventListener('resize', setCarouselWidth);
  }, [isOpen]); // isOpen triggers re-render on modal to calculate correct dimensions

  const onSlideLeft = e => {
    const slider = sliderRef.current;
    if (!slider) return;
    const slideWidth = numColumns * slider.clientWidth;
    slider.scrollLeft = slider.scrollLeft - slideWidth;
    // Fix for Safari
    e.target.focus();
  };

  const onSlideRight = e => {
    const slider = sliderRef.current;
    if (!slider) return;
    const slideWidth = numColumns * slider.clientWidth;
    slider.scrollLeft = slider.scrollLeft + slideWidth;
    // Fix for Safari
    e.target.focus();
  };

  const onKeyDown = e => {
    if (e.key === KEY_ARROW_LEFT) {
      // Prevent changing cursor position in input
      e.preventDefault();
      onSlideLeft(e);
    } else if (e.key === KEY_ARROW_RIGHT) {
      // Prevent changing cursor position in input
      e.preventDefault();
      onSlideRight(e);
    }
  };

  const fieldComponents = options?.fieldComponents;
  const fieldOptions = { fieldComponents };
  const hasHeaderFields = hasDataInFields([title, description, callToAction], fieldOptions);
  const darkMode = appearance?.textColor === 'white';

  const carouselHeight = calculateCarouselHeight(
    numColumns,
    config,
    carouselWidthConstant,
    isMobileBreakpoint,
    error
  );

  return (
    <SectionContainer
      id={sectionId}
      className={className}
      rootClassName={rootClassName}
      appearance={appearance}
    >
      {hasHeaderFields ? (
        <header className={defaultClasses.sectionDetails}>
          <Field data={title} className={defaultClasses.title} options={fieldOptions} />
          <Field data={description} className={defaultClasses.description} options={fieldOptions} />
          <Field data={callToAction} className={defaultClasses.ctaButton} options={fieldOptions} />
        </header>
      ) : null}

      <div className={css.carouselContainer} ref={containerRef}>
        <div
          className={classNames(css.carouselArrows, {
            [css.notEnoughListings]: numberOfListings <= numColumns,
          })}
        >
          <button className={css.carouselArrowPrev} onClick={onSlideLeft} onKeyDown={onKeyDown}>
            ‹
          </button>
          <button className={css.carouselArrowNext} onClick={onSlideRight} onKeyDown={onKeyDown}>
            ›
          </button>
        </div>
        <div className={css.dynamicContainer} style={{ height: carouselHeight }}>
          {/* Lazy-loaded carousel component renders when in viewport. We don't use lazy loading if component is rendered within a modal */}
          {isInsideContainer ? (
            <ListingCarouselComponent
              numColumns={numColumns}
              listings={listingEntities}
              sliderRef={sliderRef}
              darkMode={darkMode}
              onFetchFeaturedListings={onFetchFeaturedListings}
              fetched={fetched}
              inProgress={inProgress}
              parentPage={parentPage}
              sectionId={sectionId}
              error={error}
              config={config}
              allSections={allSections}
              isInsideContainer={isInsideContainer}
            />
          ) : (
            <LazyListingCarouselComponent
              numColumns={numColumns}
              listings={listingEntities}
              sliderRef={sliderRef}
              darkMode={darkMode}
              onFetchFeaturedListings={onFetchFeaturedListings}
              fetched={fetched}
              inProgress={inProgress}
              parentPage={parentPage}
              sectionId={sectionId}
              error={error}
              config={config}
              allSections={allSections}
              isInsideContainer={isInsideContainer}
            />
          )}
        </div>
      </div>
    </SectionContainer>
  );
};
export default SectionListings;
