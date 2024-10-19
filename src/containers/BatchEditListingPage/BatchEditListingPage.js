import React, { useContext, useEffect } from 'react';
import { compose } from 'redux';
import { withRouter } from 'react-router-dom';
import { connect, ReactReduxContext } from 'react-redux';
import { injectIntl } from '../../util/reactIntl';
import {
  LISTING_PAGE_PARAM_TYPE_DRAFT,
  LISTING_PAGE_PARAM_TYPE_NEW,
  NO_ACCESS_PAGE_POST_LISTINGS,
  NO_ACCESS_PAGE_USER_PENDING_APPROVAL,
} from '../../util/urlHelpers';
import { hasPermissionToPostListings, isUserAuthorized } from '../../util/userHelpers';
import { NamedRedirect, Page } from '../../components';
import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';

import EditListingWizard from './BatchEditListingWizard/BatchEditListingWizard';
import css from './BatchEditListingPage.module.css';
import {
  initializeUppy,
  requestSaveBatchListings,
  requestUpdateFileDetails,
} from './BatchEditListingPage.duck';
import { createUppyInstance } from '../../util/uppy';

export const BatchEditListingPageComponent = props => {
  const {
    currentUser,
    history,
    intl,
    params,
    page,
    onInitializeUppy,
    onUpdateFileDetails,
    onSaveBatchListing,
  } = props;
  const { type } = params;
  const isNewURI = type === LISTING_PAGE_PARAM_TYPE_NEW;
  const isDraftURI = type === LISTING_PAGE_PARAM_TYPE_DRAFT;
  const isNewListingFlow = isNewURI || isDraftURI;
  const hasPostingRights = hasPermissionToPostListings(currentUser);
  const shouldRedirectNoPostingRights = !!currentUser?.id && isNewListingFlow && !hasPostingRights;
  const { uppy, listingFieldsOptions } = page;
  const { store } = useContext(ReactReduxContext);

  useEffect(() => {
    if (!uppy) {
      const uppyInstance = createUppyInstance(store, { userId: currentUser.id?.uuid });
      onInitializeUppy(uppyInstance);
    }
  }, []);

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
  const title = isNewListingFlow
    ? intl.formatMessage({ id: 'EditListingPage.titleCreateListing' })
    : intl.formatMessage({ id: 'EditListingPage.titleEditListing' });

  return (
    <Page title={title} scrollingDisabled={false}>
      <TopbarContainer
        mobileRootClassName={css.mobileTopbar}
        desktopClassName={css.desktopTopbar}
        mobileClassName={css.mobileTopbar}
      />
      {uppy && (
        <EditListingWizard
          id="EditListingWizard"
          className={css.wizard}
          params={params}
          history={history}
          currentUser={currentUser}
          uppy={uppy}
          listingFieldsOptions={listingFieldsOptions}
          onUpdateFileDetails={onUpdateFileDetails}
          onSaveBatchListing={onSaveBatchListing}
        />
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
  onInitializeUppy: uppyInstance => dispatch(initializeUppy(uppyInstance)),
  onUpdateFileDetails: payload => dispatch(requestUpdateFileDetails(payload)),
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
