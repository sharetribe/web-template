// ⚠️ If you modify the styling of this component and you're using the SectionListings component in your marketplace (featured listings)
// please reflect those changes in the calculateCarouselHeight function in SectionListings.js to avoid layout issues
import React from 'react';
import classNames from 'classnames';

import { useConfiguration } from '../../context/configurationContext';

import { useIntl, FormattedMessage } from '../../util/reactIntl';
import { requireListingImage } from '../../util/configHelpers';
import { lazyLoadWithDimensions } from '../../util/uiHelpers';
import { createSlug } from '../../util/urlHelpers';

import {
  AspectRatioWrapper,
  NamedLink,
  ResponsiveImage,
  ListingCardThumbnail,
} from '../../components';

import Avatar from '../Avatar/Avatar';
import IconCheckmark from '../IconCheckmark/IconCheckmark';

import {
  getListingCardTranslations,
  resolveCourseCardContent,
} from './ListingCard.helpers';

import css from './ListingCard.module.css';

const LazyImage = lazyLoadWithDimensions(ResponsiveImage, { loadAfterInitialRendering: 3000 });

// Default card: must match `landingPage-css` / design (portrait 3:4, text + pills on image)
const CARD_ASPECT_WIDTH = 3;
const CARD_ASPECT_HEIGHT = 4;

export const LISTING_CARD_VARIANT_DEFAULT = 'default';
export const LISTING_CARD_VARIANT_COURSE = 'course';

const BookmarkIcon = () => (
  <svg
    className={css.bookmarkIcon}
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
  >
    <path
      d="M4.5 2.5h7a0.5 0.5 0 0 1 0.5 0.5v10.2a0.5 0.5 0 0 1-0.8 0.4L8 10.2l-3.2 3.4a0.5 0.5 0 0 1-0.8-0.4V3a0.5 0.5 0 0 1 0.5-0.5Z"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
  </svg>
);

const PlayIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <circle cx="10" cy="10" r="9" fill="rgba(255,255,255,0.88)" />
    <path d="M8 6.5v7l5.5-3.5L8 6.5Z" fill="#1a1a1a" />
  </svg>
);

/**
 * Course / horizontal listing card (Figma layout). Data resolves from
 * `listing.attributes.publicData.courseCard` with demo fallbacks.
 *
 * @param {Object} props
 * @param {Object} props.listing
 * @param {Object} props.config
 * @param {string} props.renderSizes
 * @param {boolean} props.lazyLoadImage
 * @param {Object} props.courseContent
 * @param {string} props.variantPrefix
 * @param {string} props.cardAriaLabel
 * @param {Object} props.translations
 * @returns {JSX.Element}
 */
const ListingCardCourse = props => {
  const {
    listing,
    config,
    renderSizes,
    lazyLoadImage,
    courseContent,
    variantPrefix,
    cardAriaLabel,
    translations,
  } = props;

  const {
    priceLabel,
    title,
    badgePrimary,
    badgeSecondary,
    authorDisplayName,
    highlight,
    description,
    mediaLabel,
  } = courseContent;

  const { showPrice, priceMessage } = translations;
  const id = listing?.id?.uuid;
  const slug = createSlug(listing?.attributes?.title || title);
  const firstImage = listing?.images?.[0] || null;
  const variants = firstImage
    ? Object.keys(firstImage?.attributes?.variants).filter(k => k.startsWith(variantPrefix))
    : [];
  const ImageComponent = lazyLoadImage ? LazyImage : ResponsiveImage;
  const author = listing?.author;
  const authorId = author?.id?.uuid;

  const onSaveClick = e => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <article
      className={css.rootCourse}
      aria-label={cardAriaLabel}
    >
      <div className={css.courseLayout}>
        <div className={css.courseLeft}>
          <div className={css.coursePriceRow}>
            {showPrice && priceMessage ? (
              <div className={css.coursePrice} title={translations.priceTooltip}>
                {priceMessage}
              </div>
            ) : (
              <div className={css.coursePrice}>{priceLabel}</div>
            )}
          </div>

          <NamedLink
            className={css.courseTitleLink}
            name="ListingPage"
            params={{ id, slug }}
          >
            <h3 className={css.courseTitle}>{title}</h3>
          </NamedLink>

          <div className={css.courseMetaRow}>
            {author ? (
              <Avatar
                user={author}
                className={css.courseAvatar}
                rootClassName={css.courseAvatarRoot}
                renderSizes="48px"
                disableProfileLink
              />
            ) : (
              <div className={css.courseAvatarPlaceholder} />
            )}
            <div className={css.courseBadgeColumn}>
              <span className={classNames(css.courseBadge, css.courseBadgeGreen)}>{badgePrimary}</span>
              <span className={classNames(css.courseBadge, css.courseBadgeNeutral)}>
                {badgeSecondary}
              </span>
              <p className={css.courseByLine}>
                <FormattedMessage
                  id="ListingCard.courseByAuthor"
                  values={{
                    author:
                      authorId != null ? (
                        <NamedLink
                          name="ProfilePage"
                          params={{ id: authorId }}
                          className={css.courseAuthorNameLink}
                        >
                          {authorDisplayName}
                        </NamedLink>
                      ) : (
                        <span className={css.courseAuthorNamePlain}>{authorDisplayName}</span>
                      ),
                  }}
                />
              </p>
            </div>
          </div>



          <div className={css.courseHighlight}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="28" height="28" rx="14" fill="#A2F8CE" />
              <path fill-rule="evenodd" clip-rule="evenodd" d="M19.9457 8.62169L11.5923 16.6834L9.37568 14.315C8.96734 13.93 8.32568 13.9067 7.85901 14.2334C7.40401 14.5717 7.27568 15.1667 7.55568 15.645L10.1807 19.915C10.4373 20.3117 10.8807 20.5567 11.3823 20.5567C11.8607 20.5567 12.3157 20.3117 12.5723 19.915C12.9923 19.3667 21.0073 9.81169 21.0073 9.81169C22.0573 8.73836 20.7857 7.79336 19.9457 8.61002V8.62169Z" fill="#00A069" />
            </svg>

            <span className={css.courseHighlightText}>{highlight}</span>
          </div>

          <p className={css.courseDescription}>{description}</p>

          <div className={css.courseActions}>
            <button
              type="button"
              className={css.courseBtnSecondary}
              onClick={onSaveClick}
            >
              <BookmarkIcon />
              <FormattedMessage id="ListingCard.saveForLater" />
            </button>
            <NamedLink
              className={css.courseBtnPrimary}
              name="ListingPage"
              params={{ id, slug }}
            >
              <FormattedMessage id="ListingCard.discoverMore" />
            </NamedLink>
          </div>
        </div>

        <div className={css.courseMedia}>
          <NamedLink
            name="ListingPage"
            params={{ id, slug }}
            className={css.courseMediaLinkLayer}
            aria-label={cardAriaLabel}
          />
          {firstImage ? (
            <ImageComponent
              rootClassName={css.courseMediaImage}
              alt={title}
              image={firstImage}
              variants={variants}
              sizes={renderSizes}
            />
          ) : (
            <div className={css.courseMediaFallback} />
          )}

          <div className={css.courseMediaPresentation}>{mediaLabel}</div>

          <button
            type="button"
            className={css.coursePlayButton}
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
            }}
            aria-label={mediaLabel}
          >
            <PlayIcon />
          </button>

          <div className={css.courseVideoBar} aria-hidden>
            <span className={css.courseVideoBarPlay}>▶</span>
            <div className={css.courseVideoTrack}>
              <div className={css.courseVideoProgress} />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

/**
 * ListingCardImage
 * @component
 */
const ListingCardImage = props => {
  const {
    listing,
    setActivePropsMaybe,
    title,
    renderSizes,
    aspectWidth,
    aspectHeight,
    variantPrefix,
    aspectRatioClassName,
    lazyLoadImage,
    children,
  } = props;

  const firstImage = listing?.images?.[0] || null;
  const variants = firstImage
    ? Object.keys(firstImage?.attributes?.variants).filter(k => k.startsWith(variantPrefix))
    : [];

  const aspectRatioClass = aspectRatioClassName || css.aspectRatioWrapper;
  const ImageComponent = lazyLoadImage ? LazyImage : ResponsiveImage;

  return (
    <AspectRatioWrapper
      className={aspectRatioClass}
      width={aspectWidth}
      height={aspectHeight}
      {...setActivePropsMaybe}
    >
      <ImageComponent
        rootClassName={css.rootForImage}
        alt={title}
        image={firstImage}
        variants={variants}
        sizes={renderSizes}
      />
      <div className={css.overlayScrim} />
      {children}
    </AspectRatioWrapper>
  );
};

/**
 * ListingCard
 *
 * @param {string} [props.cardVariant] `default` (image + text below) or `course` (horizontal Figma layout)
 * @returns {JSX.Element}
 */
export const ListingCard = props => {
  const config = useConfiguration();
  const intl = props.intl || useIntl();

  const {
    className,
    rootClassName,
    aspectRatioClassName,
    darkMode,
    listing,
    renderSizes,
    setActiveListing,
    showAuthorInfo = true,
    lazyLoadImage = true,
    cardVariant = LISTING_CARD_VARIANT_DEFAULT,
  } = props;

  const translations = getListingCardTranslations(listing, config, intl);
  const {
    titlePlain,
    titleFormatted,
    cardAriaLabel,
    showPrice,
    priceTooltip,
    priceMessage,
    authorName,
  } = translations;

  const classes = classNames(
    cardVariant === LISTING_CARD_VARIANT_COURSE ? css.rootCourseWrapper : rootClassName || css.root,
    className
  );

  const id = listing?.id?.uuid;
  const { title = '', publicData } = listing?.attributes || {};
  const slug = createSlug(title);

  const { listingType, cardStyle } = publicData || {};
  const validListingTypes = config.listing.listingTypes || [];
  const foundListingTypeConfig = validListingTypes.find(conf => conf.listingType === listingType);
  const showListingImage = requireListingImage(foundListingTypeConfig);

  const { aspectWidth = 1, aspectHeight = 1, variantPrefix = 'listing-card' } = config.layout.listingImage;

  const cardAspectWidth = CARD_ASPECT_WIDTH;
  const cardAspectHeight = CARD_ASPECT_HEIGHT;

  const pillsFromPublicData =
    publicData?.cardPills || publicData?.pills || publicData?.tags || publicData?.keywords;
  const pillsArray = Array.isArray(pillsFromPublicData) ? pillsFromPublicData : [];
  const pills = [listingType, ...pillsArray].filter(Boolean).slice(0, 3);

  const setActivePropsMaybe = setActiveListing
    ? {
      onMouseEnter: () => setActiveListing(listing?.id),
      onMouseLeave: () => setActiveListing(null),
    }
    : null;

  const courseContent = resolveCourseCardContent(listing, config, intl, showPrice);

  if (cardVariant === LISTING_CARD_VARIANT_COURSE) {
    if (!showListingImage) {
      return (
        <div className={classes}>
          <ListingCardThumbnail
            style={cardStyle}
            listingTitle={title}
            className={aspectRatioClassName}
            width={aspectWidth}
            height={aspectHeight}
            setActivePropsMaybe={setActivePropsMaybe}
          />
        </div>
      );
    }
    return (
      <div className={classes}>
        <ListingCardCourse
          listing={listing}
          config={config}
          renderSizes={renderSizes}
          lazyLoadImage={lazyLoadImage}
          courseContent={courseContent}
          variantPrefix={variantPrefix}
          cardAriaLabel={cardAriaLabel}
          translations={translations}
        />
      </div>
    );
  }

  return (
    <NamedLink
      className={classes}
      name="ListingPage"
      params={{ id, slug }}
      ariaLabel={cardAriaLabel}
    >
      {showListingImage ? (
        <ListingCardImage
          renderSizes={renderSizes}
          title={titlePlain}
          listing={listing}
          setActivePropsMaybe={setActivePropsMaybe}
          aspectWidth={cardAspectWidth}
          aspectHeight={cardAspectHeight}
          variantPrefix={variantPrefix}
          aspectRatioClassName={aspectRatioClassName}
          lazyLoadImage={lazyLoadImage}
        >
          <div className={css.info}>
            <div className={css.mainInfo}>
              <div className={classNames(css.title, { [css.lightText]: darkMode })}>{titleFormatted}</div>
              {showAuthorInfo ? (
                <div className={classNames(css.authorInfo, { [css.lightText]: darkMode })}>{authorName}</div>
              ) : null}
            </div>
            {pills.length > 0 ? (
              <div className={css.pills}>
                {pills.map(p => (
                  <div className={css.pill} key={String(p)}>
                    {String(p)}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </ListingCardImage>
      ) : (
        <ListingCardThumbnail
          style={cardStyle}
          listingTitle={title}
          className={aspectRatioClassName}
          width={cardAspectWidth}
          height={cardAspectHeight}
          setActivePropsMaybe={setActivePropsMaybe}
        />
      )}
    </NamedLink>
  );
};

export default ListingCard;
