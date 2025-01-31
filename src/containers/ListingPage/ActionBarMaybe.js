import React from 'react';
import { bool, oneOfType, object, string, shape } from 'prop-types';
import classNames from 'classnames';

import { useConfiguration } from '../../context/configurationContext';
import { useRouteConfiguration } from '../../context/routeConfigurationContext';
import { FormattedMessage } from '../../util/reactIntl';
import { generateLinkProps } from '../../util/routes';
import {
  LISTING_STATE_PENDING_APPROVAL,
  LISTING_STATE_CLOSED,
  LISTING_STATE_DRAFT,
  propTypes,
} from '../../util/types';

import { NamedLink, ExternalLink } from '../../components';
import EditIcon from './EditIcon';

import css from './ListingPage.module.css';

/**
 * CTAButtonMaybe component renders a call-to-action (CTA) button if it is enabled.
 * If the link is internal, a `NamedLink` is rendered, otherwise an `ExternalLink`
 * is rendered. Uses userData to inject user data into the URL.
 */
const CTAButtonMaybe = props => {
  const { data, routeConfiguration, userId, userEmail, listingId, isPendingApproval } = props;

  // If the call to action button is not enabled, return null and don't render anything
  const hasValidType = data?.type && data.type !== 'none';
  const isCTAEnabled = hasValidType && isPendingApproval;

  if (!isCTAEnabled) {
    return null;
  }

  const { type, text, href } = data;

  // Construct a the props for the NamedLink and ExternalLink components dynamically using the CTA data and user info
  const ctaLink = generateLinkProps(type, href, routeConfiguration, userId, userEmail, listingId);

  const isInternalLink = type === 'internal' && ctaLink.route;

  return isInternalLink ? (
    <NamedLink
      name={ctaLink.route.name}
      to={ctaLink.route.to}
      params={ctaLink.route.params}
      className={css.actionBarCTA}
    >
      {text}
    </NamedLink>
  ) : (
    <ExternalLink href={ctaLink.link} className={css.actionBarCTA}>
      {text}
    </ExternalLink>
  );
};

export const ActionBarMaybe = props => {
  const {
    rootClassName,
    className,
    isOwnListing,
    listing,
    currentUser,
    editParams,
    showNoPayoutDetailsSet,
  } = props;
  const classes = classNames(rootClassName || css.actionBar, className);

  const state = listing.attributes.state;
  const isPendingApproval = state === LISTING_STATE_PENDING_APPROVAL;
  const isClosed = state === LISTING_STATE_CLOSED;
  const isDraft = state === LISTING_STATE_DRAFT;

  const routeConfiguration = useRouteConfiguration();
  const config = useConfiguration();
  const approvalToPublishOptions =
    config?.accessControl?.listings?.requireApprovalToPublishOptions?.callToAction || {};

  if (isOwnListing && showNoPayoutDetailsSet) {
    return (
      <div className={classes}>
        <p className={classNames(css.ownListingText, css.missingPayoutDetailsText)}>
          <FormattedMessage id="ListingPage.addPayoutDetailsMessage" />
        </p>
        <NamedLink className={css.addPayoutDetails} name="StripePayoutPage">
          <EditIcon className={css.editIcon} />
          <FormattedMessage id="ListingPage.addPayoutDetails" />
        </NamedLink>
      </div>
    );
  } else if (isOwnListing) {
    let ownListingTextTranslationId = 'ListingPage.ownListing';

    if (isPendingApproval) {
      ownListingTextTranslationId = 'ListingPage.ownListingPendingApproval';
    } else if (isClosed) {
      ownListingTextTranslationId = 'ListingPage.ownClosedListing';
    } else if (isDraft) {
      ownListingTextTranslationId = 'ListingPage.ownListingDraft';
    }

    const message = isDraft ? 'ListingPage.finishListing' : 'ListingPage.editListing';

    const ownListingTextClasses = classNames(css.ownListingText, {
      [css.ownListingTextPendingApproval]: isPendingApproval,
    });

    const hasValidType = approvalToPublishOptions?.type && approvalToPublishOptions.type !== 'none';
    const isCTAEnabled = hasValidType && isPendingApproval;

    return (
      <div
        className={classNames(classes, {
          [css.actionBarWithCTAEnabled]: isCTAEnabled,
        })}
      >
        <p className={classNames(ownListingTextClasses, { [css.CTAEnabled]: isCTAEnabled })}>
          <FormattedMessage id={ownListingTextTranslationId} />
        </p>
        <span className={isCTAEnabled ? css.linkContainer : css.noShrink}>
          <NamedLink
            className={classNames(css.editListingLink, { [css.CTAEnabled]: isCTAEnabled })}
            name="EditListingPage"
            params={editParams}
          >
            <EditIcon className={css.editIcon} />
            <FormattedMessage id={message} />
          </NamedLink>
          <CTAButtonMaybe
            data={approvalToPublishOptions}
            routeConfiguration={routeConfiguration}
            listingId={listing?.id?.uuid}
            userId={currentUser?.id?.uuid}
            userEmail={currentUser?.attributes?.email}
            isPendingApproval={isPendingApproval}
          />
        </span>
      </div>
    );
  } else if (isClosed) {
    return (
      <div className={classes}>
        <p className={css.closedListingText}>
          <FormattedMessage id="ListingPage.closedListing" />
        </p>
      </div>
    );
  }
  return null;
};
ActionBarMaybe.defaultProps = {
  rootClassName: null,
  className: null,
};

ActionBarMaybe.propTypes = {
  rootClassName: string,
  className: string,
  isOwnListing: bool.isRequired,
  listing: oneOfType([propTypes.listing, propTypes.ownListing]).isRequired,
  editParams: shape({
    id: string,
    slug: string,
    type: string,
    tab: string,
  }),
};

ActionBarMaybe.displayName = 'ActionBarMaybe';

export default ActionBarMaybe;
