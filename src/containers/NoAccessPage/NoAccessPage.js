import React, { useEffect, useState } from 'react';
import { bool } from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { useConfiguration } from '../../context/configurationContext';
import { useRouteConfiguration } from '../../context/routeConfigurationContext';
import appSettings from '../../config/settings';
import { useIntl } from '../../util/reactIntl';
import {
  NO_ACCESS_PAGE_INITIATE_TRANSACTIONS,
  NO_ACCESS_PAGE_POST_LISTINGS,
  NO_ACCESS_PAGE_USER_PENDING_APPROVAL,
  NO_ACCESS_PAGE_VIEW_LISTINGS,
} from '../../util/urlHelpers';
import { generateLinkProps } from '../../util/routes';
import { isScrollingDisabled } from '../../ducks/ui.duck';

import {
  Heading,
  Page,
  ResponsiveBackgroundImageContainer,
  LayoutSingleColumn,
  NamedLink,
  ExternalLink,
} from '../../components';

import NotFoundPage from '../NotFoundPage/NotFoundPage';
import TopbarContainer from '../TopbarContainer/TopbarContainer';
import FooterContainer from '../FooterContainer/FooterContainer';

import IconDoor from './IconDoor';

import css from './NoAccessPage.module.css';

/**
 * CTAButtonMaybe component renders a call-to-action (CTA) button if it is enabled.
 * If the link is internal, a `NamedLink` is rendered, otherwise an `ExternalLink`
 * is rendered. Uses userData to inject user data into the URL.
 */
const CTAButtonMaybe = props => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data, routeConfiguration, userId, userEmail } = props;

  // If the call to action button is not enabled, return null and don't render anything
  if (!data?.type || data.type === 'none') {
    return null;
  }

  const { type, text, href } = data;
  // Render a spacer if the window object is not available (e.g., during server-side rendering)
  // Prevents layout shifts on initial page load.
  if (!mounted) {
    return <div className={css.modalSpacer}></div>;
  }

  // Construct a the props for the NamedLink and ExternalLink components dynamically using the CTA data and user info
  const ctaLink = generateLinkProps(type, href, routeConfiguration, userId, userEmail);

  const isInternalLink = type === 'internal' && ctaLink.route;

  return isInternalLink ? (
    <NamedLink
      name={ctaLink.route.name}
      to={ctaLink.route.to}
      params={ctaLink.route.params}
      className={css.ctaButton}
    >
      {text}
    </NamedLink>
  ) : (
    <ExternalLink href={ctaLink.link} className={css.ctaButton}>
      {text}
    </ExternalLink>
  );
};

export const NoAccessPageComponent = props => {
  const config = useConfiguration();
  const routeConfiguration = useRouteConfiguration();
  const intl = useIntl();

  const marketplaceName = config.marketplaceName;
  const { scrollingDisabled, currentUser, params: pathParams } = props;

  const missingAccessRight = pathParams?.missingAccessRight;
  const isUserPendingApprovalPage = missingAccessRight === NO_ACCESS_PAGE_USER_PENDING_APPROVAL;
  const isPostingRightsPage = missingAccessRight === NO_ACCESS_PAGE_POST_LISTINGS;
  const isInitiateTransactionsPage = missingAccessRight === NO_ACCESS_PAGE_INITIATE_TRANSACTIONS;
  const isViewingRightsPage = missingAccessRight === NO_ACCESS_PAGE_VIEW_LISTINGS;

  // Destructure `callToAction` objects from the config object for ease of reference
  const { accessControl: accessControlConfig } = config || {};
  const {
    requireApprovalToJoinOptions: { callToAction: approvalToJoinCTA } = {},
    requirePermissionToInitiateTransactionsOptions: { callToAction: permissionToInitiateCTA } = {},
    requirePermissionToPostListingsOptions: { callToAction: permissionToPostCTA } = {},
    requirePermissionToReadOptions: { callToAction: permissionToViewCTA } = {},
  } = accessControlConfig?.users || {};

  const pageData = isUserPendingApprovalPage
    ? {
        schemaTitle: 'NoAccessPage.userPendingApproval.schemaTitle',
        heading: 'NoAccessPage.userPendingApproval.heading',
        content: 'NoAccessPage.userPendingApproval.content',
        ctaData: approvalToJoinCTA,
      }
    : isPostingRightsPage
    ? {
        schemaTitle: 'NoAccessPage.postListings.schemaTitle',
        heading: 'NoAccessPage.postListings.heading',
        content: 'NoAccessPage.postListings.content',
        ctaData: permissionToPostCTA,
      }
    : isInitiateTransactionsPage
    ? {
        schemaTitle: 'NoAccessPage.initiateTransactions.schemaTitle',
        heading: 'NoAccessPage.initiateTransactions.heading',
        content: 'NoAccessPage.initiateTransactions.content',
        ctaData: permissionToInitiateCTA,
      }
    : isViewingRightsPage
    ? {
        schemaTitle: 'NoAccessPage.viewListings.schemaTitle',
        heading: 'NoAccessPage.viewListings.heading',
        content: 'NoAccessPage.viewListings.content',
        ctaData: permissionToViewCTA,
      }
    : {};

  // If missing rights are unknown (no pageData), show NotFoundPage
  if (!(pageData.heading && pageData.content)) {
    if (appSettings.dev) {
      console.warn(
        `The missing access right, ${missingAccessRight}, is not handled. Translations missing.`
      );
    }
    return <NotFoundPage staticContext={props.staticContext} />;
  }

  return (
    <Page
      title={intl.formatMessage({ id: pageData.schemaTitle })}
      scrollingDisabled={scrollingDisabled}
    >
      <LayoutSingleColumn
        mainColumnClassName={css.layoutWrapperMain}
        topbar={<TopbarContainer />}
        footer={<FooterContainer />}
      >
        <ResponsiveBackgroundImageContainer
          className={css.root}
          childrenWrapperClassName={css.contentContainer}
          as="section"
          image={config.branding.brandImage}
          sizes="100%"
          useOverlay
        >
          <div className={css.emailSubmittedContent}>
            <IconDoor className={css.modalIcon} />
            <Heading as="h1" rootClassName={css.modalTitle}>
              {intl.formatMessage({ id: pageData.heading })}
            </Heading>
            <p className={css.modalMessage}>
              {intl.formatMessage({ id: pageData.content }, { marketplaceName })}
            </p>
            <CTAButtonMaybe
              data={pageData.ctaData}
              routeConfiguration={routeConfiguration}
              userId={currentUser?.id?.uuid}
              userEmail={currentUser?.attributes?.email}
            />
          </div>
        </ResponsiveBackgroundImageContainer>
      </LayoutSingleColumn>
    </Page>
  );
};

NoAccessPageComponent.defaultProps = {};

NoAccessPageComponent.propTypes = {
  scrollingDisabled: bool.isRequired,
};

const mapStateToProps = state => {
  const { currentUser } = state.user;
  return {
    scrollingDisabled: isScrollingDisabled(state),
    currentUser,
  };
};

const NoAccessPage = compose(connect(mapStateToProps))(NoAccessPageComponent);

export default NoAccessPage;
