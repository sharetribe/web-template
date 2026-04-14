import React from 'react';
import classNames from 'classnames';

import { useConfiguration } from '../../../context/configurationContext';
import { FormattedMessage, useIntl } from '../../../util/reactIntl';
import { requireListingImage } from '../../../util/configHelpers';
import {
  LISTING_STATE_DRAFT,
  LISTING_STATE_CLOSED,
  LISTING_STATE_PENDING_APPROVAL,
  LISTING_STATE_PUBLISHED,
  STOCK_MULTIPLE_ITEMS,
} from '../../../util/types';
import { createSlug } from '../../../util/urlHelpers';
import {
  LISTING_PAGE_PARAM_TYPE_DRAFT,
  LISTING_PAGE_PARAM_TYPE_EDIT,
  LISTING_PAGE_PENDING_APPROVAL_VARIANT,
} from '../../../util/urlHelpers';
import { isBookingProcessAlias, isPurchaseProcessAlias } from '../../../transactions/transaction';

import {
  AspectRatioWrapper,
  InlineTextButton,
  NamedLink,
  PrimaryButtonInline,
  ResponsiveImage,
  ListingCardThumbnail,
} from '../../../components';

import Overlay from './Overlay';
import css from './CardThumbnail.module.css';

/**
 * Returns whether to show the out-of-stock overlay for a manage listing card.
 *
 * @param {Object} params
 * @param {Object} params.listing - Listing entity (ownListing)
 * @param {boolean} params.isBookable - Whether the listing is bookable
 * @returns {boolean}
 */
export const getShowOutOfStockOverlay = ({ listing, isBookable }) => {
  const state = listing?.attributes?.state;
  const currentStock = listing?.currentStock?.attributes?.quantity;
  return !isBookable && currentStock === 0 && state === LISTING_STATE_PUBLISHED;
};

/**
 * Returns the overlay type to show for a manage listing card, or null if no overlay.
 * Only one overlay type is active at a time.
 *
 * @param {Object} params
 * @param {string} params.state - Listing state (listing.attributes.state)
 * @param {boolean} params.showOutOfStockOverlay - Whether to show the out-of-stock overlay
 * @returns {'draft'|'closed'|'pendingApproval'|'outOfStock'|null}
 */
export const getOverlayType = ({ state, showOutOfStockOverlay }) => {
  if (state === LISTING_STATE_DRAFT) return 'draft';
  if (state === LISTING_STATE_CLOSED) return 'closed';
  if (state === LISTING_STATE_PENDING_APPROVAL) return 'pendingApproval';
  if (showOutOfStockOverlay) return 'outOfStock';
  return null;
};

const Thumbnail = props => {
  const {
    as = 'div',
    showListingImage,
    firstImage,
    variants,
    renderSizes,
    title,
    cardStyle,
    aspectWidth,
    aspectHeight,
    isBlended,
    linkProps,
  } = props;

  const Tag = as === NamedLink ? NamedLink : as;
  const tagProps = as === NamedLink ? linkProps : {};
  return (
    <Tag className={css.thumbnailTrigger} {...tagProps}>
      <AspectRatioWrapper width={aspectWidth} height={aspectHeight}>
        {showListingImage ? (
          <ResponsiveImage
            rootClassName={css.rootForImage}
            alt={title}
            image={firstImage}
            variants={variants}
            sizes={renderSizes}
          />
        ) : (
          <ListingCardThumbnail style={cardStyle} width={aspectWidth} height={aspectHeight} />
        )}
      </AspectRatioWrapper>

      {isBlended && (
        <div className={css.menuOverlayWrapper}>
          <div className={classNames(css.menuOverlay, css.menuOverlayOpen)} />
        </div>
      )}
    </Tag>
  );
};

const DraftOverlay = props => {
  const { hasImage, title, listingId, slug, intl, inProgressListingId, onDiscardDraft } = props;
  return (
    <>
      {!hasImage && <div className={css.draftNoImage} />}
      <Overlay
        message={intl.formatMessage(
          { id: 'ManageListingCard.draftOverlayText' },
          { listingTitle: title }
        )}
      >
        <NamedLink
          className={css.finishListingDraftLink}
          name="EditListingPage"
          params={{ id: listingId.uuid, slug, type: LISTING_PAGE_PARAM_TYPE_DRAFT, tab: 'photos' }}
          ariaLabel={`${intl.formatMessage({
            id: 'ManageListingCard.finishListingDraft',
          })}: ${title}`}
        >
          {intl.formatMessage({ id: 'ManageListingCard.finishListingDraft' })}
        </NamedLink>
        <div className={css.alternativeActionText}>
          {intl.formatMessage(
            { id: 'ManageListingCard.discardDraftText' },
            {
              discardDraftLink: (
                <InlineTextButton
                  key="discardDraftLink"
                  id={`discardButton_${listingId.uuid}`}
                  rootClassName={css.alternativeActionLink}
                  disabled={!!inProgressListingId}
                  onClick={() => {
                    if (!inProgressListingId) {
                      onDiscardDraft(listingId);
                    }
                  }}
                >
                  <FormattedMessage id="ManageListingCard.discardDraftLinkText" />
                </InlineTextButton>
              ),
            }
          )}
        </div>
      </Overlay>
    </>
  );
};

const ClosedOverlay = props => {
  const { title, listingId, intl, inProgressListingId, onOpenListing } = props;
  return (
    <Overlay
      message={intl.formatMessage(
        { id: 'ManageListingCard.closedListing' },
        { listingTitle: title }
      )}
    >
      <PrimaryButtonInline
        className={css.openListingButton}
        disabled={!!inProgressListingId}
        onClick={event => {
          event.preventDefault();
          event.stopPropagation();
          if (!inProgressListingId) {
            onOpenListing(listingId);
          }
        }}
      >
        {intl.formatMessage({ id: 'ManageListingCard.openListing' })}
      </PrimaryButtonInline>
    </Overlay>
  );
};

const OutOfStockOverlay = props => {
  const {
    title,
    listingId,
    slug,
    intl,
    hasStockManagementInUse,
    inProgressListingId,
    onCloseListing,
  } = props;
  return (
    <Overlay
      message={intl.formatMessage(
        { id: 'ManageListingCard.outOfStockOverlayText' },
        { listingTitle: title }
      )}
    >
      {hasStockManagementInUse ? (
        <>
          <NamedLink
            className={css.finishListingDraftLink}
            name="EditListingPage"
            params={{
              id: listingId.uuid,
              slug,
              type: LISTING_PAGE_PARAM_TYPE_EDIT,
              tab: 'pricing-and-stock',
            }}
          >
            {intl.formatMessage({ id: 'ManageListingCard.setPriceAndStock' })}
          </NamedLink>
          <div className={css.alternativeActionText}>
            {intl.formatMessage(
              { id: 'ManageListingCard.closeListingTextOr' },
              {
                closeListingLink: (
                  <InlineTextButton
                    key="closeListingLink"
                    className={css.alternativeActionLink}
                    disabled={!!inProgressListingId}
                    onClick={() => {
                      if (!inProgressListingId) {
                        onCloseListing(listingId);
                      }
                    }}
                  >
                    <FormattedMessage id="ManageListingCard.closeListingText" />
                  </InlineTextButton>
                ),
              }
            )}
          </div>
        </>
      ) : (
        <div className={css.alternativeActionText}>
          <InlineTextButton
            key="closeListingLink"
            className={css.alternativeActionText}
            disabled={!!inProgressListingId}
            onClick={() => {
              if (!inProgressListingId) {
                onCloseListing(listingId);
              }
            }}
          >
            <FormattedMessage id="ManageListingCard.closeListingText" />
          </InlineTextButton>
        </div>
      )}
    </Overlay>
  );
};

const PendingApprovalOverlay = props => {
  const { title, listingId, slug, intl } = props;
  return (
    <Overlay
      message={intl.formatMessage(
        { id: 'ManageListingCard.pendingApproval' },
        { listingTitle: title }
      )}
    >
      <NamedLink
        className={css.previewListingLink}
        name="ListingPageVariant"
        params={{ id: listingId.uuid, slug, variant: LISTING_PAGE_PENDING_APPROVAL_VARIANT }}
        ariaLabel={intl.formatMessage(
          { id: 'ManageListingCard.screenreader.previewListing' },
          { title }
        )}
      >
        <FormattedMessage id="ManageListingCard.previewListingLink" />
      </NamedLink>
    </Overlay>
  );
};

/**
 * Card thumbnail for manage listing card. Derives image, overlay and link state from listing and config.
 *
 * @param {Object} props
 * @param {Object} props.listing - Own listing entity
 * @param {Object} props.config - App configuration
 * @param {string} [props.renderSizes] - Render sizes for responsive image
 * @param {boolean} props.isBlended - Whether menu overlay is blended
 * @param {Object} [props.inProgressListingId] - Actions in progress
 * @param {function} props.onCloseListing - Close listing handler
 * @param {function} props.onOpenListing - Open listing handler
 * @param {function} props.onDiscardDraft - Discard draft handler
 * @returns {JSX.Element}
 */
const CardThumbnail = props => {
  const intl = useIntl();
  const config = useConfiguration();
  const {
    listing,
    renderSizes,
    isBlended,
    inProgressListingId,
    onCloseListing,
    onOpenListing,
    onDiscardDraft,
  } = props;

  const listingId = listing.id;
  const title = listing.attributes?.title ?? '';
  const slug = createSlug(title);
  const publicData = listing.attributes?.publicData || {};
  const cardStyle = publicData.cardStyle;
  const firstImage = listing.images && listing.images.length > 0 ? listing.images[0] : null;
  const hasImage = !!firstImage;

  const validListingTypes = config.listing?.listingTypes || [];
  const foundListingTypeConfig = validListingTypes.find(
    conf => conf.listingType === publicData.listingType
  );
  const showListingImage = requireListingImage(foundListingTypeConfig);
  const isBookable = isBookingProcessAlias(publicData.transactionProcessAlias);
  const isProductOrder = isPurchaseProcessAlias(publicData.transactionProcessAlias);
  const hasStockManagementInUse =
    isProductOrder && foundListingTypeConfig?.stockType === STOCK_MULTIPLE_ITEMS;

  const { aspectWidth = 1, aspectHeight = 1, variantPrefix = 'listing-card' } =
    config.layout?.listingImage || {};
  const variants = firstImage
    ? Object.keys(firstImage?.attributes?.variants || {}).filter(k => k.startsWith(variantPrefix))
    : [];

  const overlayType = getOverlayType({
    state: listing.attributes?.state,
    showOutOfStockOverlay: getShowOutOfStockOverlay({
      listing,
      isBookable,
    }),
  });

  const isLinked = !overlayType;
  const linkProps = isLinked
    ? {
        name: 'ListingPage',
        params: { id: listingId.uuid, slug },
        ariaLabel: intl.formatMessage(
          { id: 'ManageListingCard.screenreader.viewListing' },
          { title }
        ),
      }
    : {};

  const thumbnailProps = {
    showListingImage,
    firstImage,
    variants,
    renderSizes,
    title,
    cardStyle,
    aspectWidth,
    aspectHeight,
    isBlended,
    linkProps,
  };

  const overlayProps = {
    hasImage,
    title,
    listingId,
    slug,
    intl,
    inProgressListingId,
    onDiscardDraft,
    onOpenListing,
    onCloseListing,
    hasStockManagementInUse,
  };

  return (
    <div className={css.thumbnailWrapper}>
      <Thumbnail {...thumbnailProps} as={isLinked ? NamedLink : 'div'} linkProps={linkProps} />

      {overlayType === 'draft' ? (
        <DraftOverlay {...overlayProps} />
      ) : overlayType === 'closed' ? (
        <ClosedOverlay {...overlayProps} />
      ) : overlayType === 'outOfStock' ? (
        <OutOfStockOverlay {...overlayProps} />
      ) : overlayType === 'pendingApproval' ? (
        <PendingApprovalOverlay {...overlayProps} />
      ) : null}
    </div>
  );
};

export default CardThumbnail;
