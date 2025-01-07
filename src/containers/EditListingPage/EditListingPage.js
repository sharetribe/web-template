import React from 'react';
import { bool, func, object, shape, string, oneOf } from 'prop-types';
import { compose } from 'redux';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';

// Import configs and util modules
import { intlShape, useIntl } from '../../util/reactIntl';
import { types as sdkTypes } from '../../util/sdkLoader';
import {
  LISTING_PAGE_PARAM_TYPE_DRAFT,
  LISTING_PAGE_PARAM_TYPE_NEW,
  LISTING_PAGE_PARAM_TYPES,
  LISTING_PAGE_PENDING_APPROVAL_VARIANT,
  NO_ACCESS_PAGE_POST_LISTINGS,
  NO_ACCESS_PAGE_USER_PENDING_APPROVAL,
  createSlug,
  parse,
} from '../../util/urlHelpers';

import { LISTING_STATE_DRAFT, LISTING_STATE_PENDING_APPROVAL, propTypes } from '../../util/types';
import { isErrorNoPermissionToPostListings } from '../../util/errors';
import { ensureOwnListing } from '../../util/data';
import { hasPermissionToPostListings, isUserAuthorized } from '../../util/userHelpers';
import { getMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import { manageDisableScrolling, isScrollingDisabled } from '../../ducks/ui.duck';
import {
  stripeAccountClearError,
  getStripeConnectAccountLink,
} from '../../ducks/stripeConnectAccount.duck';

// Import shared components
import { NamedRedirect, Page } from '../../components';
import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';

// Import modules from this directory
import {
  requestFetchAvailabilityExceptions,
  requestAddAvailabilityException,
  requestDeleteAvailabilityException,
  requestCreateListingDraft,
  requestPublishListingDraft,
  requestUpdateListing,
  requestImageUpload,
  removeListingImage,
  savePayoutDetails,
} from './EditListingPage.duck';
import EditListingWizard from './EditListingWizard/EditListingWizard';
import css from './EditListingPage.module.css';

const STRIPE_ONBOARDING_RETURN_URL_SUCCESS = 'success';
const STRIPE_ONBOARDING_RETURN_URL_FAILURE = 'failure';
const STRIPE_ONBOARDING_RETURN_URL_TYPES = [
  STRIPE_ONBOARDING_RETURN_URL_SUCCESS,
  STRIPE_ONBOARDING_RETURN_URL_FAILURE,
];

const { UUID } = sdkTypes;

// Pick images that are currently attached to listing entity and images that are going to be attached.
// Avoid duplicates and images that should be removed.
const pickRenderableImages = (
  currentListing,
  uploadedImages,
  uploadedImageIdsInOrder = [],
  removedImageIds = []
) => {
  // Images are passed to EditListingForm so that it can generate thumbnails out of them
  const currentListingImages = currentListing && currentListing.images ? currentListing.images : [];
  // Images not yet connected to the listing
  const unattachedImages = uploadedImageIdsInOrder.map(i => uploadedImages[i]);
  const allImages = currentListingImages.concat(unattachedImages);

  const pickImagesAndIds = (imgs, img) => {
    const imgId = img.imageId || img.id;
    // Pick only unique images that are not marked to be removed
    const shouldInclude = !imgs.imageIds.includes(imgId) && !removedImageIds.includes(imgId);
    if (shouldInclude) {
      imgs.imageEntities.push(img);
      imgs.imageIds.push(imgId);
    }
    return imgs;
  };

  // Return array of image entities. Something like: [{ id, imageId, type, attributes }, ...]
  return allImages.reduce(pickImagesAndIds, { imageEntities: [], imageIds: [] }).imageEntities;
};

/**
 * The EditListingPage component.
 *
 * @component
 * @param {Object} props
 * @param {propTypes.currentUser} props.currentUser - The current user
 * @param {propTypes.error} [props.createStripeAccountError] - The create stripe account error
 * @param {boolean} [props.fetchInProgress] - Whether the fetch is in progress
 * @param {propTypes.error} [props.fetchStripeAccountError] - The fetch stripe account error
 * @param {Function} [props.getOwnListing] - The get own listing function
 * @param {propTypes.error} props.getAccountLinkError - The get account link error
 * @param {boolean} props.getAccountLinkInProgress - Whether the get account link is in progress
 * @param {Function} props.onFetchExceptions - The on fetch exceptions function
 * @param {Function} props.onAddAvailabilityException - The on add availability exception function
 * @param {Function} props.onDeleteAvailabilityException - The on delete availability exception function
 * @param {Function} props.onCreateListingDraft - The on create listing draft function
 * @param {Function} props.onPublishListingDraft - The on publish listing draft function
 * @param {Function} props.onUpdateListing - The on update listing function
 * @param {Function} props.onImageUpload - The on image upload function
 * @param {Function} props.onRemoveListingImage - The on remove listing image function
 * @param {Function} props.onManageDisableScrolling - The on manage disable scrolling function
 * @param {Function} props.onPayoutDetailsChange - The on payout details change function
 * @param {Function} props.onPayoutDetailsSubmit - The on payout details submit function
 * @param {Function} props.onGetStripeConnectAccountLink - The get StripeConnectAccountLink function
 * @param {Object} props.history - The history object
 * @param {Function} props.history.push - The push function
 * @param {Object} props.location - The location object
 * @param {string} props.location.search - The search string
 * @param {Object} props.page - The page object (state of the EditListingPage)
 * @param {Object} props.params - The params object
 * @param {string} props.params.id - The id of the listing
 * @param {string} props.params.slug - The slug of the listing
 * @param {string} props.params.tab - The tab of the wizard
 * @param {string} props.params.type - The type of the listing (new, draft, pendingApproval)
 * @param {string} props.params.returnURLType - The return URL type (success or failure for stripe onboarding)
 * @param {boolean} props.scrollingDisabled - Whether the scrolling is disabled
 * @param {boolean} [props.stripeAccountFetched] - Whether the stripe account is fetched
 * @param {Object} [props.stripeAccount] - The stripe account object
 * @param {Object} [props.updateStripeAccountError] - The update stripe account error
 * @returns {JSX.Element}
 */
export const EditListingPageComponent = props => {
  const intl = useIntl();
  const {
    currentUser,
    createStripeAccountError,
    fetchInProgress,
    fetchStripeAccountError,
    getOwnListing,
    getAccountLinkError,
    getAccountLinkInProgress,
    history,
    onFetchExceptions,
    onAddAvailabilityException,
    onDeleteAvailabilityException,
    onCreateListingDraft,
    onPublishListingDraft,
    onUpdateListing,
    onImageUpload,
    onRemoveListingImage,
    onManageDisableScrolling,
    onPayoutDetailsSubmit,
    onPayoutDetailsChange,
    onGetStripeConnectAccountLink,
    page,
    params,
    location,
    scrollingDisabled,
    stripeAccountFetched,
    stripeAccount,
    updateStripeAccountError,
  } = props;

  const { id, type, returnURLType } = params;
  const isNewURI = type === LISTING_PAGE_PARAM_TYPE_NEW;
  const isDraftURI = type === LISTING_PAGE_PARAM_TYPE_DRAFT;
  const isNewListingFlow = isNewURI || isDraftURI;

  const listingId = page.submittedListingId || (id ? new UUID(id) : null);
  const currentListing = ensureOwnListing(getOwnListing(listingId));
  const { state: currentListingState } = currentListing.attributes;

  const hasPostingRights = hasPermissionToPostListings(currentUser);
  const hasPostingRightsError = isErrorNoPermissionToPostListings(page.publishListingError?.error);
  const shouldRedirectNoPostingRights =
    !!currentUser?.id && ((isNewListingFlow && !hasPostingRights) || hasPostingRightsError);

  const isPastDraft = currentListingState && currentListingState !== LISTING_STATE_DRAFT;
  const shouldRedirectAfterPosting = isNewListingFlow && listingId && isPastDraft;

  const hasStripeOnboardingDataIfNeeded = returnURLType ? !!currentUser?.id : true;
  const showWizard = hasStripeOnboardingDataIfNeeded && (isNewURI || currentListing.id);

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
  } else if (shouldRedirectAfterPosting) {
    const isPendingApproval =
      currentListing && currentListingState === LISTING_STATE_PENDING_APPROVAL;

    // If page has already listingId (after submit) and current listings exist
    // redirect to listing page
    const listingSlug = currentListing ? createSlug(currentListing.attributes.title) : null;

    const redirectProps = isPendingApproval
      ? {
          name: 'ListingPageVariant',
          params: {
            id: listingId.uuid,
            slug: listingSlug,
            variant: LISTING_PAGE_PENDING_APPROVAL_VARIANT,
          },
        }
      : {
          name: 'ListingPage',
          params: {
            id: listingId.uuid,
            slug: listingSlug,
          },
        };

    return <NamedRedirect {...redirectProps} />;
  } else if (showWizard) {
    const {
      createListingDraftError = null,
      publishListingError = null,
      updateListingError = null,
      showListingsError = null,
      uploadImageError = null,
      setStockError = null,
      uploadedImages,
      uploadedImagesOrder,
      removedImageIds,
      addExceptionError = null,
      deleteExceptionError = null,
    } = page;
    const errors = {
      createListingDraftError,
      publishListingError,
      updateListingError,
      showListingsError,
      uploadImageError,
      setStockError,
      createStripeAccountError,
      addExceptionError,
      deleteExceptionError,
    };
    // TODO: is this dead code? (shouldRedirectAfterPosting is checked before)
    const newListingPublished =
      isDraftURI && currentListing && currentListingState !== LISTING_STATE_DRAFT;

    // Show form if user is posting a new listing or editing existing one
    const disableForm = page.redirectToListing && !showListingsError;
    const images = pickRenderableImages(
      currentListing,
      uploadedImages,
      uploadedImagesOrder,
      removedImageIds
    );

    const title = isNewListingFlow
      ? intl.formatMessage({ id: 'EditListingPage.titleCreateListing' })
      : intl.formatMessage({ id: 'EditListingPage.titleEditListing' });

    return (
      <Page title={title} scrollingDisabled={scrollingDisabled}>
        <TopbarContainer
          mobileRootClassName={css.mobileTopbar}
          desktopClassName={css.desktopTopbar}
          mobileClassName={css.mobileTopbar}
        />
        <EditListingWizard
          id="EditListingWizard"
          className={css.wizard}
          params={params}
          locationSearch={parse(location.search)}
          disabled={disableForm}
          errors={errors}
          fetchInProgress={fetchInProgress}
          newListingPublished={newListingPublished}
          history={history}
          images={images}
          listing={currentListing}
          weeklyExceptionQueries={page.weeklyExceptionQueries}
          monthlyExceptionQueries={page.monthlyExceptionQueries}
          allExceptions={page.allExceptions}
          onFetchExceptions={onFetchExceptions}
          onAddAvailabilityException={onAddAvailabilityException}
          onDeleteAvailabilityException={onDeleteAvailabilityException}
          onUpdateListing={onUpdateListing}
          onCreateListingDraft={onCreateListingDraft}
          onPublishListingDraft={onPublishListingDraft}
          onPayoutDetailsChange={onPayoutDetailsChange}
          onPayoutDetailsSubmit={onPayoutDetailsSubmit}
          onGetStripeConnectAccountLink={onGetStripeConnectAccountLink}
          getAccountLinkInProgress={getAccountLinkInProgress}
          onImageUpload={onImageUpload}
          onRemoveImage={onRemoveListingImage}
          currentUser={currentUser}
          onManageDisableScrolling={onManageDisableScrolling}
          stripeOnboardingReturnURL={params.returnURLType}
          updatedTab={page.updatedTab}
          updateInProgress={page.updateInProgress || page.createListingDraftInProgress}
          payoutDetailsSaveInProgress={page.payoutDetailsSaveInProgress}
          payoutDetailsSaved={page.payoutDetailsSaved}
          stripeAccountFetched={stripeAccountFetched}
          stripeAccount={stripeAccount}
          stripeAccountError={
            createStripeAccountError || updateStripeAccountError || fetchStripeAccountError
          }
          stripeAccountLinkError={getAccountLinkError}
        />
      </Page>
    );
  } else {
    // If user has come to this page through a direct link to edit existing listing,
    // we need to load it first.
    const loadingPageMsg = {
      id: 'EditListingPage.loadingListingData',
    };
    return (
      <Page title={intl.formatMessage(loadingPageMsg)} scrollingDisabled={scrollingDisabled}>
        <TopbarContainer
          mobileRootClassName={css.mobileTopbar}
          desktopClassName={css.desktopTopbar}
          mobileClassName={css.mobileTopbar}
        />
      </Page>
    );
  }
};

const mapStateToProps = state => {
  const page = state.EditListingPage;
  const {
    getAccountLinkInProgress,
    getAccountLinkError,
    createStripeAccountInProgress,
    createStripeAccountError,
    updateStripeAccountError,
    fetchStripeAccountError,
    stripeAccount,
    stripeAccountFetched,
  } = state.stripeConnectAccount;

  const getOwnListing = id => {
    const listings = getMarketplaceEntities(state, [{ id, type: 'ownListing' }]);
    return listings.length === 1 ? listings[0] : null;
  };

  return {
    getAccountLinkInProgress,
    getAccountLinkError,
    createStripeAccountError,
    updateStripeAccountError,
    fetchStripeAccountError,
    stripeAccount,
    stripeAccountFetched,
    currentUser: state.user.currentUser,
    fetchInProgress: createStripeAccountInProgress,
    getOwnListing,
    page,
    scrollingDisabled: isScrollingDisabled(state),
  };
};

const mapDispatchToProps = dispatch => ({
  onFetchExceptions: params => dispatch(requestFetchAvailabilityExceptions(params)),
  onAddAvailabilityException: params => dispatch(requestAddAvailabilityException(params)),
  onDeleteAvailabilityException: params => dispatch(requestDeleteAvailabilityException(params)),

  onUpdateListing: (tab, values, config) => dispatch(requestUpdateListing(tab, values, config)),
  onCreateListingDraft: (values, config) => dispatch(requestCreateListingDraft(values, config)),
  onPublishListingDraft: listingId => dispatch(requestPublishListingDraft(listingId)),
  onImageUpload: (data, listingImageConfig) =>
    dispatch(requestImageUpload(data, listingImageConfig)),
  onManageDisableScrolling: (componentId, disableScrolling) =>
    dispatch(manageDisableScrolling(componentId, disableScrolling)),
  onPayoutDetailsChange: () => dispatch(stripeAccountClearError()),
  onPayoutDetailsSubmit: (values, isUpdateCall) =>
    dispatch(savePayoutDetails(values, isUpdateCall)),
  onGetStripeConnectAccountLink: params => dispatch(getStripeConnectAccountLink(params)),
  onRemoveListingImage: imageId => dispatch(removeListingImage(imageId)),
});

// Note: it is important that the withRouter HOC is **outside** the
// connect HOC, otherwise React Router won't rerender any Route
// components since connect implements a shouldComponentUpdate
// lifecycle hook.
//
// See: https://github.com/ReactTraining/react-router/issues/4671
const EditListingPage = compose(
  withRouter,
  connect(
    mapStateToProps,
    mapDispatchToProps
  )
)(EditListingPageComponent);

export default EditListingPage;
