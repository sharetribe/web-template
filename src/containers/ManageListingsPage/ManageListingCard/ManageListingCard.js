import React from 'react';
import classNames from 'classnames';

import { useConfiguration } from '../../../context/configurationContext';
import { useIntl, FormattedMessage } from '../../../util/reactIntl';
import {
  LISTING_STATE_DRAFT,
  LISTING_STATE_PENDING_APPROVAL,
  STOCK_MULTIPLE_ITEMS,
  propTypes,
} from '../../../util/types';
import { ensureOwnListing } from '../../../util/data';
import {
  LISTING_PAGE_DRAFT_VARIANT,
  LISTING_PAGE_PENDING_APPROVAL_VARIANT,
  LISTING_PAGE_PARAM_TYPE_DRAFT,
  LISTING_PAGE_PARAM_TYPE_EDIT,
  createSlug,
} from '../../../util/urlHelpers';
import { isBookingProcessAlias, isPurchaseProcessAlias } from '../../../transactions/transaction';

import { NamedLink, IconSpinner } from '../../../components';

import CardMenu from './CardMenu';
import CardThumbnail from './CardThumbnail';
import Overlay from './Overlay';
import PriceInfo from './PriceInfo';
import css from './ManageListingCard.module.css';

const MAX_LENGTH_FOR_WORDS_IN_TITLE = 7;

/**
 * Splits a title to break long words into spans so that
 * flexbox card layouts don't expand excessively.
 *
 * @param {string} title - Listing title
 * @param {number} maxLength - Maximum allowed word length before breaking
 * @returns {Array<React.ReactNode>} Formatted title parts
 */
export const formatTitle = (title, maxLength) => {
  const nonWhiteSpaceSequence = /([^\s]+)/gi;
  return title.split(nonWhiteSpaceSequence).map((word, index) => {
    return word.length > maxLength ? (
      <span key={index} style={{ wordBreak: 'break-all' }}>
        {word}
      </span>
    ) : (
      word
    );
  });
};

const LinkedListingTitle = props => {
  const intl = useIntl();
  const { state, id, slug, title } = props;

  return (
    <NamedLink
      className={css.title}
      {...(state === LISTING_STATE_DRAFT || state === LISTING_STATE_PENDING_APPROVAL
        ? {
            name: 'ListingPageVariant',
            params: {
              id,
              slug,
              variant:
                state === LISTING_STATE_DRAFT
                  ? LISTING_PAGE_DRAFT_VARIANT
                  : LISTING_PAGE_PENDING_APPROVAL_VARIANT,
            },
          }
        : {
            name: 'ListingPage',
            params: { id, slug },
          })}
      ariaLabel={intl.formatMessage(
        { id: 'ManageListingCard.screenreader.viewListing' },
        { title }
      )}
    >
      {formatTitle(title, MAX_LENGTH_FOR_WORDS_IN_TITLE)}
    </NamedLink>
  );
};

const LinkToStockOrAvailabilityTab = props => {
  const intl = useIntl();
  const { listing, listingTypeConfig } = props;

  const id = listing.id.uuid;
  const { title = '', state, publicData } = listing.attributes || {};
  const slug = createSlug(title);

  const { listingType, transactionProcessAlias } = publicData || {};
  const isDraft = state === LISTING_STATE_DRAFT;
  const isBookable = isBookingProcessAlias(transactionProcessAlias);
  const isProductOrder = isPurchaseProcessAlias(transactionProcessAlias);
  const hasListingType = !!listingType;
  const hasStockManagementInUse =
    isProductOrder && listingTypeConfig?.stockType === STOCK_MULTIPLE_ITEMS;
  const currentStock = listing?.currentStock?.attributes?.quantity;

  const editListingLinkType = isDraft
    ? LISTING_PAGE_PARAM_TYPE_DRAFT
    : LISTING_PAGE_PARAM_TYPE_EDIT;

  if (!hasListingType || !(isBookable || hasStockManagementInUse)) {
    return null;
  }

  return (
    <>
      <span className={css.manageLinksSeparator}>{' • '}</span>

      {isBookable ? (
        <NamedLink
          className={css.manageLink}
          name="EditListingPage"
          params={{ id, slug, type: editListingLinkType, tab: 'availability' }}
          ariaLabel={intl.formatMessage(
            { id: 'ManageListingCard.screenreader.manageAvailability' },
            { title }
          )}
        >
          <FormattedMessage id="ManageListingCard.manageAvailability" />
        </NamedLink>
      ) : (
        <NamedLink
          className={css.manageLink}
          name="EditListingPage"
          params={{ id, slug, type: editListingLinkType, tab: 'pricing-and-stock' }}
          ariaLabel={
            currentStock != null
              ? intl.formatMessage(
                  { id: 'ManageListingCard.screenreader.manageStock' },
                  { title, currentStock }
                )
              : intl.formatMessage(
                  { id: 'ManageListingCard.screenreader.setPriceAndStock' },
                  { title }
                )
          }
        >
          {currentStock != null ? (
            <FormattedMessage id="ManageListingCard.manageStock" values={{ currentStock }} />
          ) : (
            <FormattedMessage id="ManageListingCard.setPriceAndStock" />
          )}
        </NamedLink>
      )}
    </>
  );
};

/**
 * Manage listing card
 *
 * @param {Object} props
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} [props.rootClassName] - Custom class that overrides the default class for the root element
 * @param {boolean} props.hasClosingError - Whether the closing error is present
 * @param {boolean} props.hasDiscardingError - Whether the discarding error is present
 * @param {boolean} props.hasOpeningError - Whether the opening error is present
 * @param {boolean} props.isMenuOpen - Whether the menu is open
 * @param {Object} [props.actionsInProgressListingId] - The actions in progress for the specific listing
 * @param {propTypes.uuid} [props.actionsInProgressListingId.uuid] - The uuid of the listing
 * @param {propTypes.ownListing} props.listing - The listing
 * @param {string} [props.renderSizes] - The render sizes for the ResponsiveImage component
 * @param {function} props.onCloseListing - The function to close the listing
 * @param {function} props.onOpenListing - The function to open the listing
 * @param {function} props.onDiscardDraft - The function to discard the draft
 * @param {function} props.onToggleMenu - The function to toggle the menu
 * @returns {JSX.Element} Manage listing card component
 */
export const ManageListingCard = props => {
  const config = useConfiguration();
  const intl = props.intl || useIntl();
  const {
    className,
    rootClassName,
    hasClosingError,
    hasDiscardingError,
    hasOpeningError,
    isMenuOpen,
    actionsInProgressListingId,
    listing,
    renderSizes,
    onCloseListing,
    onOpenListing,
    onDiscardDraft,
    onToggleMenu,
  } = props;
  const classes = classNames(rootClassName || css.root, className);
  const currentListing = ensureOwnListing(listing);
  const id = currentListing.id.uuid;
  const { title = '', state, publicData, price } = currentListing.attributes;
  const slug = createSlug(title);
  const isDraft = state === LISTING_STATE_DRAFT;

  const { listingType, transactionProcessAlias } = publicData || {};

  const validListingTypes = config.listing.listingTypes;
  const listingTypeConfig = validListingTypes.find(conf => conf.listingType === listingType);

  const hasError = hasOpeningError || hasClosingError || hasDiscardingError;
  const thisListingInProgress =
    actionsInProgressListingId && actionsInProgressListingId.uuid === id;

  const editListingLinkType = isDraft
    ? LISTING_PAGE_PARAM_TYPE_DRAFT
    : LISTING_PAGE_PARAM_TYPE_EDIT;

  return (
    <div className={classes}>
      <div className={classNames(css.thumbnailContainer)}>
        <CardThumbnail
          listing={currentListing}
          renderSizes={renderSizes}
          isBlended={isMenuOpen}
          inProgressListingId={actionsInProgressListingId}
          onCloseListing={onCloseListing}
          onOpenListing={onOpenListing}
          onDiscardDraft={onDiscardDraft}
        />

        <CardMenu
          isMenuOpen={isMenuOpen}
          listing={currentListing}
          inProgressListingId={actionsInProgressListingId}
          onToggleMenu={onToggleMenu}
          onCloseListing={onCloseListing}
        />

        {thisListingInProgress ? (
          <Overlay>
            <IconSpinner />
          </Overlay>
        ) : hasError ? (
          <Overlay errorMessage={intl.formatMessage({ id: 'ManageListingCard.actionFailed' })} />
        ) : null}
      </div>

      <div className={css.info}>
        <PriceInfo
          price={price}
          publicData={publicData}
          isBookable={isBookingProcessAlias(transactionProcessAlias)}
          listingTypeConfig={listingTypeConfig}
        />

        <div className={css.mainInfo}>
          <div className={css.titleWrapper}>
            <LinkedListingTitle state={state} id={id} slug={slug} title={title} />
          </div>
        </div>

        <div className={css.manageLinks}>
          <NamedLink
            className={css.manageLink}
            name="EditListingPage"
            params={{ id, slug, type: editListingLinkType, tab: 'details' }}
            ariaLabel={intl.formatMessage(
              { id: 'ManageListingCard.screenreader.editListing' },
              { title }
            )}
          >
            <FormattedMessage id="ManageListingCard.editListing" />
          </NamedLink>

          <LinkToStockOrAvailabilityTab
            listing={currentListing}
            listingTypeConfig={listingTypeConfig}
          />
        </div>
      </div>
    </div>
  );
};

export default ManageListingCard;
