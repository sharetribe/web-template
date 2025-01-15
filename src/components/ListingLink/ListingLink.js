import React from 'react';
import { richText } from '../../util/richText';
import { LISTING_STATE_DRAFT, LISTING_STATE_PENDING_APPROVAL } from '../../util/types';
import {
  LISTING_PAGE_DRAFT_VARIANT,
  LISTING_PAGE_PENDING_APPROVAL_VARIANT,
  createSlug,
} from '../../util/urlHelpers';
import { NamedLink } from '../../components';

import css from './ListingLink.module.css';

const MIN_LENGTH_FOR_LONG_WORDS = 16;

/**
 * A component that safely links to the ListingPage of the given listing.
 *
 * When the listing is pending approval, the normal ListingPage won't
 * work as the listing isn't yet published. This component links to the
 * correct pending-approval variant URL or to the normal ListingPage
 * based on the listing state.
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to component's own css.root
 * @param {Object} props.listing API entity: listing or ownListing
 * @param {ReactNode} props.children
 * @returns {JSX.Element} listing card to be used in search result panel etc.
 */
const ListingLink = props => {
  const { className, listing, children } = props;
  const listingLoaded = listing && listing.id;
  if (!listingLoaded) {
    return null;
  }
  const id = listing.id.uuid;
  const { title, state } = listing.attributes;
  const slug = createSlug(title);
  const richTitle = (
    <span>
      {richText(title, {
        longWordMinLength: MIN_LENGTH_FOR_LONG_WORDS,
        longWordClass: css.longWord,
      })}
    </span>
  );

  const isPendingApproval = state === LISTING_STATE_PENDING_APPROVAL;
  const isDraft = state === LISTING_STATE_DRAFT;
  const variant = isPendingApproval
    ? LISTING_PAGE_PENDING_APPROVAL_VARIANT
    : isDraft
    ? LISTING_PAGE_DRAFT_VARIANT
    : null;
  const linkProps = !!variant
    ? {
        name: 'ListingPageVariant',
        params: {
          id,
          slug,
          variant,
        },
      }
    : {
        name: 'ListingPage',
        params: { id, slug },
      };
  return (
    <NamedLink className={className} {...linkProps}>
      {children ? children : richTitle || ''}
    </NamedLink>
  );
};

export default ListingLink;
