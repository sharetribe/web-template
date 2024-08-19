import React from 'react';
import { bool } from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { useConfiguration } from '../../context/configurationContext';
import appSettings from '../../config/settings';
import { useIntl } from '../../util/reactIntl';
import {
  NO_ACCESS_PAGE_POST_LISTINGS,
  NO_ACCESS_PAGE_USER_PENDING_APPROVAL,
} from '../../util/urlHelpers';
import { isScrollingDisabled } from '../../ducks/ui.duck';

import {
  Heading,
  Page,
  ResponsiveBackgroundImageContainer,
  LayoutSingleColumn,
} from '../../components';

import NotFoundPage from '../NotFoundPage/NotFoundPage';
import TopbarContainer from '../TopbarContainer/TopbarContainer';
import FooterContainer from '../FooterContainer/FooterContainer';

import IconDoor from './IconDoor';

import css from './NoAccessPage.module.css';

export const NoAccessPageComponent = props => {
  const config = useConfiguration();
  const intl = useIntl();

  const marketplaceName = config.marketplaceName;
  const { scrollingDisabled, params: pathParams } = props;

  const missingAccessRight = pathParams?.missingAccessRight;
  const isUserPendingApprovalPage = missingAccessRight === NO_ACCESS_PAGE_USER_PENDING_APPROVAL;
  const isPostingRightsPage = missingAccessRight === NO_ACCESS_PAGE_POST_LISTINGS;

  const messages = isUserPendingApprovalPage
    ? {
        schemaTitle: 'NoAccessPage.userPendingApproval.schemaTitle',
        heading: 'NoAccessPage.userPendingApproval.heading',
        content: 'NoAccessPage.userPendingApproval.content',
      }
    : isPostingRightsPage
    ? {
        schemaTitle: 'NoAccessPage.postListings.schemaTitle',
        heading: 'NoAccessPage.postListings.heading',
        content: 'NoAccessPage.postListings.content',
      }
    : {};

  // If missing rights are unknown (no messages), show NotFoundPage
  if (!(messages.heading && messages.content)) {
    if (appSettings.dev) {
      console.warn(
        `The missing access right, ${missingAccessRight}, is not handled. Translations missing.`
      );
    }
    return <NotFoundPage staticContext={props.staticContext} />;
  }

  return (
    <Page
      title={intl.formatMessage({ id: messages.schemaTitle })}
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
              {intl.formatMessage({ id: messages.heading })}
            </Heading>
            <p className={css.modalMessage}>
              {intl.formatMessage({ id: messages.content }, { marketplaceName })}
            </p>
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
  return {
    scrollingDisabled: isScrollingDisabled(state),
  };
};

const NoAccessPage = compose(connect(mapStateToProps))(NoAccessPageComponent);

export default NoAccessPage;
