import React from 'react';
import { bool, func, object } from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { useConfiguration } from '../../context/configurationContext';
import { FormattedMessage, injectIntl, intlShape } from '../../util/reactIntl';
import { ensureCurrentUser, ensureOwnListing } from '../../util/data';
import { propTypes } from '../../util/types';
import { isCreativeSellerApproved, showPaymentDetailsForUser } from '../../util/userHelpers';
import { isScrollingDisabled } from '../../ducks/ui.duck';
import { getMarketplaceEntities } from '../../ducks/marketplaceData.duck';

import { H3, Page, UserNav, LayoutSideNavigation, NamedRedirect } from '../../components';

import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';
import FooterContainer from '../../containers/FooterContainer/FooterContainer';

// Import modules from this directory
import CreativeDetailsForm from './CreativeDetailsForm/CreativeDetailsForm';
import { requestUpdateListing } from './CreativeDetailsPage.duck';

import css from './CreativeDetailsPage.module.css';

export const CreativeDetailsPageComponent = props => {
  const {
    currentUser,
    listingId,
    updateListingError,
    showListingsError,
    updateInProgress = false,
    getOwnListing,
    scrollingDisabled,
    onUpdateListing,
    intl,
  } = props;
  const config = useConfiguration();
  const user = ensureCurrentUser(currentUser);
  const withCreativeProfile = isCreativeSellerApproved(user?.attributes.profile);
  const currentListing = ensureOwnListing(getOwnListing(listingId));

  if (!withCreativeProfile) {
    return <NamedRedirect name="ProfileSettingsPage" />;
  }

  const title = intl.formatMessage({ id: 'CreativeDetailsPage.title' });
  const errors = {
    updateListingError,
    showListingsError,
  };

  const { showPayoutDetails, showPaymentMethods } = showPaymentDetailsForUser(config, currentUser);
  const accountSettingsNavProps = {
    currentPage: 'CreativeDetailsPage',
    showPaymentMethods,
    showPayoutDetails,
  };

  return (
    <Page title={title} scrollingDisabled={scrollingDisabled}>
      <LayoutSideNavigation
        topbar={
          <>
            <TopbarContainer />
            <UserNav currentPage="CreativeDetailsPage" />
          </>
        }
        sideNav={null}
        useProfileSettingsNav
        withCreativeProfile
        accountSettingsNavProps={accountSettingsNavProps}
        footer={<FooterContainer />}
      >
        <div className={css.content}>
          <div className={css.headingContainer}>
            <H3 as="h1" className={css.heading}>
              <FormattedMessage id="CreativeDetailsPage.heading" />
            </H3>
          </div>
          <div className={css.headingContainer}>
            <p className={css.introText}>
              <FormattedMessage id="CreativeDetailsPage.description" />
            </p>
          </div>
          <CreativeDetailsForm
            listingId={listingId}
            listing={currentListing}
            errors={errors}
            updateInProgress={updateInProgress}
            onUpdateListing={onUpdateListing}
          />
        </div>
      </LayoutSideNavigation>
    </Page>
  );
};

CreativeDetailsPageComponent.propTypes = {
  currentUser: propTypes.currentUser,
  listingId: propTypes.uuid,
  updateListingError: object,
  showListingsError: object,
  updateInProgress: bool,
  getOwnListing: func,
  scrollingDisabled: bool.isRequired,
  onUpdateListing: func,

  // from injectIntl
  intl: intlShape.isRequired,
};

const mapStateToProps = state => {
  const { currentUser } = state.user;
  const {
    listingId,
    updateListingError,
    showListingsError,
    updateInProgress,
  } = state.CreativeDetailsPage;
  const getOwnListing = id => {
    const listings = getMarketplaceEntities(state, [{ id, type: 'ownListing' }]);
    return listings.length === 1 ? listings[0] : null;
  };
  return {
    currentUser,
    listingId,
    updateListingError,
    showListingsError,
    updateInProgress,
    getOwnListing,
    scrollingDisabled: isScrollingDisabled(state),
  };
};

const mapDispatchToProps = dispatch => ({
  onUpdateListing: (values, config) => dispatch(requestUpdateListing(values, config)),
});

const CreativeDetailsPage = compose(
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl
)(CreativeDetailsPageComponent);

export default CreativeDetailsPage;
