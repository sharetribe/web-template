import React from 'react';
import classNames from 'classnames';

// Import configs and util modules
import { FormattedMessage } from '../../../../util/reactIntl';
import { LISTING_STATE_DRAFT } from '../../../../util/types';

// Import shared components
import { Button, H3, ListingLink } from '../../../../components';

// Import your custom calendar component

import css from './EditListingAvailabilityPanel.module.css';

/**
 * EditListingAvailabilityPanel - updated for calendar-based availability
 */
const EditListingAvailabilityPanel = props => {
  const {
    className,
    rootClassName,
    listing,
    onNextTab,
    submitButtonText,
    errors,
    handlePublishListing,
    onAddAvailabilityException,
    onDeleteAvailabilityException,
  } = props;

  const classes = classNames(rootClassName || css.root, className);
  const listingAttributes = listing?.attributes;
  const isPublished = listing?.id && listingAttributes?.state !== LISTING_STATE_DRAFT;

  return (
    <main className={classes}>
      <H3 as="h1" className={css.heading}>
        Availability exceptions (optional)
      </H3>

      <p className={css.descriptionText}>
        Please mark any dates your listing is NOT available to lend so we can ensure it's not shown in search results. You can edit this in your listing details at any time.
      </p>

   

      {errors.showListingsError ? (
        <p className={css.error}>
          <FormattedMessage id="EditListingAvailabilityPanel.showListingFailed" />
        </p>
      ) : null}

      <Button 
        className={css.goToNextTabButton} 
        onClick={() => handlePublishListing(listing.id)}
      >
        Publish Listing
      </Button>
    </main>
  );
};

export default EditListingAvailabilityPanel;
