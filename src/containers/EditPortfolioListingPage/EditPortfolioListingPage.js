import { compose } from 'redux';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { injectIntl } from '../../util/reactIntl';
import { Page } from '../../components';
import TopbarContainer from '../TopbarContainer/TopbarContainer';
import React from 'react';
import css from './EditPortfolioListingPage.module.css';
import EditPortfolioListingWizard from './EditPortfolioListingWizard/EditPortfolioListingWizard';
import { types as sdkTypes } from '../../util/sdkLoader';

const { UUID } = sdkTypes;

export const EditPortfolioListingPageComponent = props => {
  const { currentUser, history, params, page, getOwnListing } = props;
  const { id } = params;
  const listingId = page.submittedListingId || (id ? new UUID(id) : null);
  const currentListing = getOwnListing(listingId);

  return (
    <Page scrollingDisabled={false}>
      <TopbarContainer
        mobileRootClassName={css.mobileTopbar}
        desktopClassName={css.desktopTopbar}
        mobileClassName={css.mobileTopbar}
      />
      <EditPortfolioListingWizard
        id="EditPortfolioListing"
        className={css.wizard}
        params={params}
        history={history}
        currentUser={currentUser}
        currentListing={currentListing}
      />
    </Page>
  );
};

const mapStateToProps = state => {
  const page = state.EditPortfolioListingPage;

  const getOwnListing = id => {
    if (!id) return null;
    return state.EditPortfolioListingPage.portfolioListing || null;
  };

  return {
    currentUser: state.user.currentUser,
    getOwnListing,
    page,
  };
};

const mapDispatchToProps = dispatch => ({});

const EditListingPage = compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl
)(EditPortfolioListingPageComponent);

export default EditListingPage;
