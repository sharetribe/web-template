import React from 'react';
import ActionBar from './ActionBar';

/**
 * Shared author-facing notification/edit bars for listing page variants.
 *
 * @param {Object} props
 * @param {boolean} props.mounted - True when component has mounted on client
 * @param {Object} props.listing - Current listing entity
 * @param {boolean} props.isOwnListing - True if current user is listing author
 * @param {boolean} props.noPayoutDetailsSetWithOwnListing - True when payout warning should be shown
 * @param {Object} props.currentUser - Logged-in user
 * @param {Object} props.editParams - Listing edit route params
 * @param {string} props.className - Base class for ActionBar
 * @returns {JSX.Element|null}
 */
const Notifications = props => {
  const {
    mounted,
    listing,
    isOwnListing,
    noPayoutDetailsSetWithOwnListing,
    currentUser,
    editParams,
    className,
  } = props;

  // Keep rendering available to non-authors too, so closed-listing messaging is visible for all users.
  const canShowBars = mounted && listing?.id;
  if (!canShowBars) {
    return null;
  }

  return (
    <>
      {noPayoutDetailsSetWithOwnListing ? (
        <ActionBar
          className={className}
          isOwnListing={isOwnListing}
          listing={listing}
          showNoPayoutDetailsSet={noPayoutDetailsSetWithOwnListing}
          currentUser={currentUser}
        />
      ) : null}
      <ActionBar
        className={className}
        isOwnListing={isOwnListing}
        listing={listing}
        currentUser={currentUser}
        editParams={editParams}
      />
    </>
  );
};

export default Notifications;
