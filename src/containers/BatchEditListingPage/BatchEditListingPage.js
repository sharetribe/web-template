import React from 'react';
import { compose } from 'redux';
import { useParams, withRouter } from 'react-router-dom';
import { connect } from 'react-redux';

import { FormattedMessage, injectIntl } from '../../util/reactIntl';
import {
  NO_ACCESS_PAGE_POST_LISTINGS,
  NO_ACCESS_PAGE_USER_PENDING_APPROVAL,
} from '../../util/urlHelpers';
import { hasPermissionToPostListings, isUserAuthorized } from '../../util/userHelpers';
import { NamedRedirect, NamedLink, Page, Heading, LayoutSingleColumn } from '../../components';
import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';
import FooterContainer from '../../containers/FooterContainer/FooterContainer';

import { PAGE_MODE_NEW } from './constants';
import BatchEditListingWizard from './BatchEditListingWizard/BatchEditListingWizard';
import { ProductsListingEditMode } from './ProductListingsEditMode/ProductsListingEditMode';

import css from './BatchEditListingPage.module.css';

export const BatchEditListingPageComponent = props => {
  const { currentUser, history, intl, params, page } = props;
  const noPayoutDetails = !currentUser?.attributes?.stripeConnected;
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

  const EditPageContent = isNew ? BatchEditListingWizard : ProductsListingEditMode;
  const editPageContentProps = isNew
    ? {
        id: 'EditListingWizard',
        className: css.wizard,
        params,
        history,
        currentUser,
        listingFieldsOptions,
      }
    : {};

  return (
    <Page
      title={intl.formatMessage({ id: 'EditListingPage.titleCreateListing' })}
      scrollingDisabled={false}
    >
      {noPayoutDetails ? (
        <LayoutSingleColumn topbar={<TopbarContainer />} footer={<FooterContainer />}>
          <div className={css.root}>
            <div className={css.content}>
              <Heading as="h1" rootClassName={css.heading}>
                <FormattedMessage id="BatchEditListingPage.noPayoutDetails.heading" />
              </Heading>
              <p className={css.description}>
                <FormattedMessage id="BatchEditListingPage.noPayoutDetails.description" />
              </p>
              <p className={css.description}>
                <NamedLink name="StripePayoutPage">
                  <FormattedMessage id="BatchEditListingPage.noPayoutDetails.link" />
                </NamedLink>
              </p>
            </div>
          </div>
        </LayoutSingleColumn>
      ) : (
        <>
          <TopbarContainer
            mobileRootClassName={css.mobileTopbar}
            desktopClassName={css.desktopTopbar}
            mobileClassName={css.mobileTopbar}
          />
          <EditPageContent {...editPageContentProps} />
        </>
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
