import React, { useEffect, useState } from 'react';
import classNames from 'classnames';

// Import configs and components
import { useConfiguration } from '../../../../context/configurationContext';
import { lazyLoadWithDimensions } from '../../../../util/uiHelpers';
import { createListing, createUser } from '../../../../util/testData';

import Field, { hasDataInFields } from '../../Field';
import SectionContainer from '../SectionContainer';
import { ListingCard } from '../../../../components';

import css from './SectionListings.module.css';

const listing1 = createListing('listing1', {}, { author: createUser('user1') });
const listing2 = createListing('listing2', {}, { author: createUser('user1') });
const listing3 = createListing('listing3', {}, { author: createUser('user1') });
const listing4 = createListing('listing4', {}, { author: createUser('user1') });
const listing5 = createListing('listing5', {}, { author: createUser('user1') });
const listing6 = createListing('listing6', {}, { author: createUser('user1') });
const listing7 = createListing('listing7', {}, { author: createUser('user1') });
const listing8 = createListing('listing8', {}, { author: createUser('user1') });
const listing9 = createListing('listing9', {}, { author: createUser('user1') });
const listing10 = createListing('listing10', {}, { author: createUser('user1') });

const listings = [
  listing1,
  listing2,
  listing3,
  listing4,
  listing5,
  listing6,
  listing7,
  listing8,
  listing9,
  listing10,
];

const KEY_CODE_ARROW_LEFT = 37;
const KEY_CODE_ARROW_RIGHT = 39;

// Configuration for supported column layouts
// Only 3 and 4 columns are supported in this component
const COLUMN_CONFIG = {
  3: { css: css.threeColumns },
  4: { css: css.fourColumns },
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

const parseAspectRatio = aspectRatio => {
  const [width, height] = aspectRatio.split('/').map(Number);
  return width / height;
};

const isMobileViewport = () => typeof window !== 'undefined' && window.innerWidth < 768;

/**
 * Calculate the dynamic height for the carousel container based on card dimensions
 * @param {number} numColumns - Number of columns in the layout
 * @param {Object} config - Configuration object containing layout settings
 * @param {number} carouselWidth - Width of the carousel container
 * @param {boolean} isMobile - Whether the viewport is mobile
 * @returns {number} Calculated height in pixels
 */
const calculateCarouselHeight = (numColumns, config, carouselWidth, isMobile = false) => {
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

  const gutters = isMobile ? 0 : numColumns === 3 ? 64 : 96;

  const mainColumnWidth = Math.min(contentMaxWidthPages, carouselWidth);
  const cardWidth = (mainColumnWidth - paddingHorizontal - gutters) / (isMobile ? 1 : numColumns);
  const cardImageHeight = cardWidth / parsedAspectRatio;
  const cardInfoHeight = priceHeight + titleHeightSingleLine + authorInfoHeight + cardInfoPadding;


  const totalCardHeight = cardImageHeight + (isMobile ? cardInfoHeightMobile : cardInfoHeight);
  const totalWithPaddings = totalCardHeight + containerPaddingTop + containerPaddingBottom;

  return Math.ceil(totalWithPaddings);
};

/**
 * Component that renders the listing cards in a carousel layout
 * Used with lazy loading wrapper for performance optimization
 * @param {Object} props - Component properties
 * @param {number} props.numColumns - Number of columns to display
 * @param {Array} props.listings - Array of listing data
 * @param {string} props.sliderId - Unique ID for the slider element
 * @param {boolean} props.darkMode - Whether to apply dark mode styling
 * @returns {JSX.Element} Carousel container with listing cards
 */
const ListingCarouselComponent = props => {
  const { numColumns, listings, sliderId, darkMode } = props;
  return (
    <div className={getColumnCSS(numColumns)} id={sliderId}>
      {listings.map(listing => (
        <ListingCard
          className={css.card}
          aspectRatioClassName={css.carouselImageHoverEffect}
          key={listing.id.uuid}
          listing={listing}
          darkMode={darkMode}
        />
      ))}
    </div>
  );
};

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
  } = props;

  const sliderContainerId = `${sectionId}-container`;
  const sliderId = `${sectionId}-slider`;

  // TODO: calculate dynamically
  const numberOfListings = 10;
  const hasListings = numberOfListings > 0;

  const [carouselWidthConstant, setCarouselWidthConstant] = useState(null);

  useEffect(() => {
    const setCarouselWidth = () => {
      if (hasListings) {
        const windowWidth = window.innerWidth;
        const elem = window.document.getElementById(sliderContainerId);
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
  }, []);

  const onSlideLeft = e => {
    var slider = window.document.getElementById(sliderId);
    const slideWidth = numColumns * slider?.firstChild?.clientWidth;
    slider.scrollLeft = slider.scrollLeft - slideWidth;
    // Fix for Safari
    e.target.focus();
  };

  const onSlideRight = e => {
    var slider = window.document.getElementById(sliderId);
    const slideWidth = numColumns * slider?.firstChild?.clientWidth;
    slider.scrollLeft = slider.scrollLeft + slideWidth;
    // Fix for Safari
    e.target.focus();
  };

  const onKeyDown = e => {
    if (e.keyCode === KEY_CODE_ARROW_LEFT) {
      // Prevent changing cursor position in input
      e.preventDefault();
      onSlideLeft(e);
    } else if (e.keyCode === KEY_CODE_ARROW_RIGHT) {
      // Prevent changing cursor position in input
      e.preventDefault();
      onSlideRight(e);
    }
  };

  const fieldComponents = options?.fieldComponents;
  const fieldOptions = { fieldComponents };
  const hasHeaderFields = hasDataInFields([title, description, callToAction], fieldOptions);
  const darkMode = appearance?.textColor === 'white';

  // Create lazy-loaded version of carousel component for performance
  const LazyListingCarouselComponent = lazyLoadWithDimensions(ListingCarouselComponent);
  const isMobile = isMobileViewport();

  const carouselHeight = calculateCarouselHeight(
    numColumns,
    config,
    carouselWidthConstant,
    isMobile
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

      {hasListings ? (
        <div className={css.carouselContainer} id={sliderContainerId}>
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
            {/* Lazy-loaded carousel component renders when in viewport */}
            <LazyListingCarouselComponent
              numberOfListings={numberOfListings}
              numColumns={numColumns}
              listings={listings}
              sliderId={sliderId}
              darkMode={darkMode}
            />
          </div>
        </div>
      ) : null}
    </SectionContainer>
  );
};

export default SectionListings;
