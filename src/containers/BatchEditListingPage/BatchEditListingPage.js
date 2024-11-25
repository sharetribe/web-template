import React from 'react';
import { compose } from 'redux';
import { useParams, withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { injectIntl } from '../../util/reactIntl';
import {
  NO_ACCESS_PAGE_POST_LISTINGS,
  NO_ACCESS_PAGE_USER_PENDING_APPROVAL,
} from '../../util/urlHelpers';
import { hasPermissionToPostListings, isUserAuthorized } from '../../util/userHelpers';
import { NamedRedirect, Page } from '../../components';
import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';

import css from './BatchEditListingPage.module.css';
import { PAGE_MODE_NEW } from './constants';
import BatchEditListingWizard from './BatchEditListingWizard/BatchEditListingWizard';
import { ProductsListingEditMode } from './ProductListingsEditMode/ProductsListingEditMode';

export const BatchEditListingPageComponent = props => {
  const { currentUser, history, intl, params, page } = props;
  const hasPostingRights = hasPermissionToPostListings(currentUser);
  const shouldRedirectNoPostingRights = !!currentUser?.id && !hasPostingRights;
  const { listingFieldsOptions } = page;
  const { mode } = useParams();
  const isNew = mode === PAGE_MODE_NEW;

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
        />
      ) : (
        <ProductsListingEditMode></ProductsListingEditMode>
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

// Note: it is important that the withRouter HOC is **outside** the
// connect HOC, otherwise React Router won't rerender any Route
// components since connect implements a shouldComponentUpdate
// lifecycle hook.
//
// See: https://github.com/ReactTraining/react-router/issues/4671
const BatchEditListingPage = compose(
  withRouter,
  connect(mapStateToProps),
  injectIntl
)(BatchEditListingPageComponent);

export default BatchEditListingPage;
