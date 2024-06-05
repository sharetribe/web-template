import React from 'react';
import { bool, oneOfType, object, string, shape } from 'prop-types';
import { FormattedMessage } from '../../util/reactIntl';
import classNames from 'classnames';
import {
  LISTING_STATE_PENDING_APPROVAL,
  LISTING_STATE_CLOSED,
  LISTING_STATE_DRAFT,
  propTypes,
} from '../../util/types';
import { NamedLink } from '../../components';
import EditIcon from './EditIcon';

import css from './ListingPage.module.css';

export const ActionBarMaybe = props => {
  const {
    rootClassName,
    className,
    isOwnListing,
    listing,
    editParams,
    showNoPayoutDetailsSet,
  } = props;
  const classes = classNames(rootClassName || css.actionBar, className);

  const state = listing.attributes.state;
  const isPendingApproval = state === LISTING_STATE_PENDING_APPROVAL;
  const isClosed = state === LISTING_STATE_CLOSED;
  const isDraft = state === LISTING_STATE_DRAFT;

  if (isOwnListing && showNoPayoutDetailsSet) {
    return (
      <div className={classes}>
        <p className={classNames(css.ownListingText, css.missingPayoutDetailsText)}>
          <FormattedMessage id="ListingPage.addPayoutDetailsMessage" />
        </p>
        <NamedLink className={css.addPayoutDetails} name="StripePayoutPage">
          <EditIcon className={css.editIcon} />
          <FormattedMessage id="ListingPage.addPayoutDetails" />
        </NamedLink>
      </div>
    );
  } else if (isOwnListing) {
    let ownListingTextTranslationId = 'ListingPage.ownListing';

    if (isPendingApproval) {
      ownListingTextTranslationId = 'ListingPage.ownListingPendingApproval';
    } else if (isClosed) {
      ownListingTextTranslationId = 'ListingPage.ownClosedListing';
    } else if (isDraft) {
      ownListingTextTranslationId = 'ListingPage.ownListingDraft';
    }

    const message = isDraft ? 'ListingPage.finishListing' : 'ListingPage.editListing';

    const ownListingTextClasses = classNames(css.ownListingText, {
      [css.ownListingTextPendingApproval]: isPendingApproval,
    });

    return (
      <div className={classes}>
        <p className={ownListingTextClasses}>
          <FormattedMessage id={ownListingTextTranslationId} />
        </p>
        <NamedLink className={css.editListingLink} name="EditListingPage" params={editParams}>
          <EditIcon className={css.editIcon} />
          <FormattedMessage id={message} />
        </NamedLink>
      </div>
    );
  } else if (isClosed) {
    return (
      <div className={classes}>
        <p className={css.closedListingText}>
          <FormattedMessage id="ListingPage.closedListing" />
        </p>
      </div>
    );
  }
  return null;
};
ActionBarMaybe.defaultProps = {
  rootClassName: null,
  className: null,
};

ActionBarMaybe.propTypes = {
  rootClassName: string,
  className: string,
  isOwnListing: bool.isRequired,
  listing: oneOfType([propTypes.listing, propTypes.ownListing]).isRequired,
  editParams: shape({
    id: string,
    slug: string,
    type: string,
    tab: string,
  }),
};

ActionBarMaybe.displayName = 'ActionBarMaybe';

export default ActionBarMaybe;
