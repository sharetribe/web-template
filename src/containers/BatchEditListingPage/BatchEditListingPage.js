import React from 'react';
import { compose } from 'redux';
import { useParams, withRouter } from 'react-router-dom';
import { connect, useSelector } from 'react-redux';
import { injectIntl } from '../../util/reactIntl';
import {
  NO_ACCESS_PAGE_POST_LISTINGS,
  NO_ACCESS_PAGE_USER_PENDING_APPROVAL,
} from '../../util/urlHelpers';
import { hasPermissionToPostListings, isUserAuthorized } from '../../util/userHelpers';
import { NamedRedirect, Page } from '../../components';
import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';

import css from './BatchEditListingPage.module.css';
import {
  getIsQueryInProgress,
  initializeUppy,
  requestSaveBatchListings,
} from './BatchEditListingPage.duck';
import BatchEditListingWizard from './BatchEditListingWizard/BatchEditListingWizard';
import { EditListingBatchProductDetails } from './BatchEditListingWizard/BatchEditListingProductDetails/EditListingBatchProductDetails';

export const BatchEditListingPageComponent = props => {
  const { currentUser, history, intl, params, page, onSaveBatchListing } = props;
  const hasPostingRights = hasPermissionToPostListings(currentUser);
  const shouldRedirectNoPostingRights = !!currentUser?.id && !hasPostingRights;
  const { listingFieldsOptions } = page;
  const { type } = useParams();
  const isNew = type === 'new';
  const isQueryLoading = useSelector(getIsQueryInProgress);

  if (!isUserAuthorized(currentUser)) {
    return (
      <NamedRedirect
        name="NoAccessPage"
        params={{ missingAccessRight: NO_ACCESS_PAGE_USER_PENDING_APPROVAL }}
      />
    );
  } else if (shouldRedirectNoPostingRights) {
    return (
      <NamedRedirect
        name="NoAccessPage"
        params={{ missingAccessRight: NO_ACCESS_PAGE_POST_LISTINGS }}
      />
    );
  }

  return (
    <Page
      title={intl.formatMessage({ id: 'EditListingPage.titleCreateListing' })}
      scrollingDisabled={false}
    >
      <TopbarContainer
        mobileRootClassName={css.mobileTopbar}
        desktopClassName={css.desktopTopbar}
        mobileClassName={css.mobileTopbar}
      />
      {isNew ? (
        <BatchEditListingWizard
          id="EditListingWizard"
          className={css.wizard}
          params={params}
          history={history}
          currentUser={currentUser}
          listingFieldsOptions={listingFieldsOptions}
          onSaveBatchListing={onSaveBatchListing}
        />
      ) : (
        <div className={css.editRoot}>
          <EditListingBatchProductDetails cssRoot={css.listingDetails} loading={isQueryLoading} />
        </div>
      )}
    </Page>
  );
};

const mapStateToProps = state => {
  const page = state.BatchEditListingPage;

  return {
    currentUser: state.user.currentUser,
    page,
  };
};

const mapDispatchToProps = dispatch => ({
  onSaveBatchListing: () => {
    dispatch(requestSaveBatchListings());
  },
});

// Note: it is important that the withRouter HOC is **outside** the
// connect HOC, otherwise React Router won't rerender any Route
// components since connect implements a shouldComponentUpdate
// lifecycle hook.
//
// See: https://github.com/ReactTraining/react-router/issues/4671
const BatchEditListingPage = compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl
)(BatchEditListingPageComponent);

export default BatchEditListingPage;
