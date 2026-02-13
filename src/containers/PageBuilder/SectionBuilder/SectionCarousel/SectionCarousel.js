import React, { useEffect, useRef, useState } from 'react';
import classNames from 'classnames';

import Field, { hasDataInFields } from '../../Field';
import BlockBuilder from '../../BlockBuilder';

import SectionContainer from '../SectionContainer';
import ProductCard from '../../../../components/ProductCard';
import css from './SectionCarousel.module.css';

const KEY_CODE_ARROW_LEFT = 37;
const KEY_CODE_ARROW_RIGHT = 39;

// The number of columns (numColumns) affects styling and responsive images
const COLUMN_CONFIG = [
  { css: css.oneColumn, responsiveImageSizes: '(max-width: 767px) 100vw, 1200px' },
  { css: css.twoColumns, responsiveImageSizes: '(max-width: 767px) 100vw, 600px' },
  { css: css.threeColumns, responsiveImageSizes: '(max-width: 767px) 100vw, 400px' },
  { css: css.fourColumns, responsiveImageSizes: '(max-width: 767px) 100vw, 290px' },
];
const getIndex = numColumns => numColumns - 1;
const getColumnCSS = numColumns => {
  const config = COLUMN_CONFIG[getIndex(numColumns)];
  return config ? config.css : COLUMN_CONFIG[0].css;
};
const getResponsiveImageSizes = numColumns => {
  const config = COLUMN_CONFIG[getIndex(numColumns)];
  return config ? config.responsiveImageSizes : COLUMN_CONFIG[0].responsiveImageSizes;
};

/**
 * @typedef {Object} BlockConfig
 * @property {string} blockId
 * @property {string} blockName
 * @property {'defaultBlock' | 'footerBlock' | 'socialMediaLink'} blockType
 */

/**
 * @typedef {Object} FieldComponentConfig
 * @property {ReactNode} component
 * @property {Function} pickValidProps
 */

/**
 * Section component that's able to show blocks in a carousel.
 * The number blocks visible is defined by "numColumns" prop.
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @param {Object} props.defaultClasses
 * @param {string} props.defaultClasses.sectionDetails
 * @param {string} props.defaultClasses.title
 * @param {string} props.defaultClasses.description
 * @param {string} props.defaultClasses.ctaButton
 * @param {string} props.sectionId id of the section
 * @param {'carousel'} props.sectionType
 * @param {number?} props.numColumns
 * @param {Object?} props.title
 * @param {Object?} props.description
 * @param {Object?} props.appearance
 * @param {Object?} props.callToAction
 * @param {Array<BlockConfig>?} props.blocks array of block configs
 * @param {boolean?} props.isInsideContainer
 * @param {Object} props.options extra options for the section component (e.g. custom fieldComponents)
 * @param {Object<string,FieldComponentConfig>?} props.options.fieldComponents custom fields
 * @returns {JSX.Element} Section for article content
 */
const SectionCarousel = props => {
  const {
    sectionId,
    className,
    rootClassName,
    defaultClasses,
    numColumns = 1,
    title,
    description,
    appearance,
    callToAction,
    blocks = [],
    options,
  } = props;
  const sliderContainerId = `${props.sectionId}-container`;
  const sliderId = `${props.sectionId}-slider`;
  const numberOfBlocks = blocks?.length;
  const hasBlocks = numberOfBlocks > 0;

  const [swiperModules, setSwiperModules] = useState(null);
  const [isMounted, setIsMounted] = useState(false);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [wishlistItems, setWishlistItems] = useState([]);
  const swiperRef = useRef(null);
  const nextButtonRef = useRef(null);
  const prevButtonRef = useRef(null);


  useEffect(() => {
    setIsMounted(true);
  }, []);



  useEffect(() => {
    if (typeof window !== 'undefined' && isMounted) {
      Promise.all([import('swiper/react'), import('swiper/modules')])
        .then(([swiperReact, swiperModulesImport]) => {
          if (
            swiperReact?.Swiper &&
            swiperReact?.SwiperSlide &&
            swiperModulesImport?.Navigation
          ) {
            setSwiperModules({
              Swiper: swiperReact.Swiper,
              SwiperSlide: swiperReact.SwiperSlide,
              Navigation: swiperModulesImport.Navigation,
            });
          }
        })
        .catch(error => {
          console.error('Failed to load Swiper in ExploreCards:', error);
        });
    }
  }, [isMounted]);

  const Swiper = swiperModules?.Swiper;
  const SwiperSlide = swiperModules?.SwiperSlide;
  const NavigationModule = swiperModules?.Navigation;

  useEffect(() => {
    const setCarouselWidth = () => {
      if (hasBlocks) {
        const windowWidth = window.innerWidth;
        const elem = window.document.getElementById(sliderContainerId);
        const scrollbarWidth = window.innerWidth - document.body.clientWidth;
        const elementWidth =
          elem.clientWidth >= windowWidth - scrollbarWidth ? windowWidth : elem.clientWidth;
        const carouselWidth = elementWidth - scrollbarWidth;

        elem.style.setProperty('--carouselWidth', `${carouselWidth}px`);
      }
    };
    setCarouselWidth();

    window.addEventListener('resize', setCarouselWidth);
    return () => window.removeEventListener('resize', setCarouselWidth);
  }, []);

  // If external mapping has been included for fields
  // E.g. { h1: { component: MyAwesomeHeader } }
  const fieldComponents = options?.fieldComponents;
  const fieldOptions = { fieldComponents };

  const hasHeaderFields = hasDataInFields([title, description, callToAction], fieldOptions);

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


  // Sample data for featured listings
  const featuredListings = [
    {
      image: 'https://via.placeholder.com/300x200/4a90e2/ffffff?text=Rods',
      title: 'Rods',
      price: '£95.00',
      location: 'Kent, England',
      actionText: 'Buyer Crosscast',
      actionIcon: '📦'
    },
    {
      image: 'https://via.placeholder.com/300x200/7b68ee/ffffff?text=Reels',
      title: 'Reels',
      price: '£120.00',
      location: 'Surrey, England',
      actionText: 'Fast Shipping',
      actionIcon: '🚚'
    },
    {
      image: 'https://via.placeholder.com/300x200/50c878/ffffff?text=Lures',
      title: 'Lures',
      price: '£45.00',
      location: 'Collection A419',
      actionText: 'Collection A419',
      actionIcon: '📍'
    },
    {
      image: 'https://via.placeholder.com/300x200/ff6347/ffffff?text=Terminal+Tackle',
      title: 'Terminal Tackle',
      price: '£35.00',
      originalPrice: '£60.00',
      location: 'Collection A419',
      actionText: 'Collection A419',
      actionIcon: '📍'
    }
  ];

  if (sectionId == "landing-shop-by-category") {
    return (
      <>
        <SectionContainer
          id={sectionId}
          className={className}
          rootClassName={rootClassName}
          appearance={appearance}
          options={fieldOptions}
        >
          {hasHeaderFields ? (
            <header className={defaultClasses.sectionDetails}>
              <div className={css.headerWrapper}>
                <div>

                  <Field data={title} className={defaultClasses.title} options={fieldOptions} />
                  <Field data={description} className={defaultClasses.description} options={fieldOptions} />
                </div>
                <div className={css.filterButtonWrapper}>
                  <select>
                    <option value="all">All</option>
                    <option value="rods">Rods</option>
                    <option value="reels">Reels</option>
                    <option value="lures">Lures</option>
                    <option value="terminal-tackle">Terminal Tackle</option>
                  </select>
                </div>
              </div>
            </header>
          ) : null}

          <div className={css.featuredListingWrapper}>
            {isMounted && Swiper && SwiperSlide && NavigationModule ? (
              <>
                <Swiper
                  modules={[NavigationModule]}
                  spaceBetween={20}
                  slidesPerView={"auto"}
                  navigation={{
                    nextEl: nextButtonRef.current,
                    prevEl: prevButtonRef.current,
                  }}
                  allowTouchMove
                  watchOverflow
                  speed={350}
                  onSwiper={instance => {
                    if (instance && typeof instance === 'object') {
                      swiperRef.current = instance;
                      // snapGrid length corresponds to number of pagination "pages"
                      if (Array.isArray(instance.snapGrid) && instance.snapGrid.length > 0) {
                        setPageCount(instance.snapGrid.length);
                      }
                      setActivePageIndex(instance.activeIndex || 0);
                    }
                  }}
                  onSlideChange={instance => {
                    if (instance && typeof instance === 'object') {
                      setActivePageIndex(instance.activeIndex || 0);
                    }
                  }}
                  breakpoints={{
                    320: {
                      slidesPerView: 1,
                      spaceBetween: 16,
                    },
                    640: {
                      slidesPerView: 2,
                      spaceBetween: 20,
                    },
                    1024: {
                      slidesPerView: 3,
                      spaceBetween: 24,
                    },
                    1280: {
                      slidesPerView: 4,
                      spaceBetween: 32,
                    },
                  }}
                  className={css.swiper}
                >
                  <div className={css.featuredCards}>
                    {featuredListings.map((listing, index) => (
                      <SwiperSlide key={index} className={css.slide}>

                        <ProductCard
                          key={index}
                          image={listing.image}
                          title={listing.title}
                          price={listing.price}
                          originalPrice={listing.originalPrice}
                          location={listing.location}
                          actionText={listing.actionText}
                          actionIcon={listing.actionIcon}
                        />
                      </SwiperSlide>
                    ))}
                  </div>
                </Swiper>
              </>
            ) : (
              <div className={css.swiper}>

              </div>
            )}
          </div>

        </SectionContainer>
      </>
    )

  }



  return (
    <SectionContainer
      id={sectionId}
      className={className}
      rootClassName={rootClassName}
      appearance={appearance}
      options={fieldOptions}
    >
      {hasHeaderFields ? (
        <header className={defaultClasses.sectionDetails}>
          <Field data={title} className={defaultClasses.title} options={fieldOptions} />
          <Field data={description} className={defaultClasses.description} options={fieldOptions} />
          <Field data={callToAction} className={defaultClasses.ctaButton} options={fieldOptions} />
        </header>
      ) : null}

      {hasBlocks ? (
        <div className={css.carouselContainer} id={sliderContainerId}>
          <div
            className={classNames(css.carouselArrows, {
              [css.notEnoughBlocks]: numberOfBlocks <= numColumns,
            })}
          >
            <button className={css.carouselArrowPrev} onClick={onSlideLeft} onKeyDown={onKeyDown}>
              ‹
            </button>
            <button className={css.carouselArrowNext} onClick={onSlideRight} onKeyDown={onKeyDown}>
              ›
            </button>
          </div>
          <div className={getColumnCSS(numColumns)} id={sliderId}>
            <BlockBuilder
              rootClassName={css.block}
              ctaButtonClass={defaultClasses.ctaButton}
              blocks={blocks}
              sectionId={sectionId}
              responsiveImageSizes={getResponsiveImageSizes(numColumns)}
              options={options}
            />
          </div>
        </div>
      ) : null}
    </SectionContainer>
  );
};

export default SectionCarousel;
