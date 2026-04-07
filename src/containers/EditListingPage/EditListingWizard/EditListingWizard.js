import React, { Component, useEffect } from 'react';
import classNames from 'classnames';

// Import configs and util modules
import { useConfiguration } from '../../../context/configurationContext';
import { useRouteConfiguration } from '../../../context/routeConfigurationContext';
import { FormattedMessage, intlShape, useIntl } from '../../../util/reactIntl';
import { displayDescription } from '../../../util/configHelpers.js';
import {
  displayDeliveryPickup,
  displayDeliveryShipping,
  displayLocation,
  displayPrice,
  requirePayoutDetails,
  requireListingImage,
} from '../../../util/configHelpers';
import {
  LISTING_PAGE_PARAM_TYPE_DRAFT,
  LISTING_PAGE_PARAM_TYPE_NEW,
} from '../../../util/urlHelpers';
import { createResourceLocatorString } from '../../../util/routes';
import {
  SCHEMA_TYPE_ENUM,
  SCHEMA_TYPE_MULTI_ENUM,
  SCHEMA_TYPE_TEXT,
  SCHEMA_TYPE_LONG,
  SCHEMA_TYPE_BOOLEAN,
  SCHEMA_TYPE_YOUTUBE,
  propTypes,
} from '../../../util/types';
import {
  isFieldForCategory,
  isFieldForListingType,
  pickCategoryFields,
} from '../../../util/fieldHelpers';
import { ensureCurrentUser, ensureListing } from '../../../util/data';
import { INQUIRY_PROCESS_NAME, resolveLatestProcessName } from '../../../transactions/transaction';

// Import shared components
import {
  Heading,
  Modal,
  NamedLink,
  NamedRedirect,
  Tabs,
  StripeConnectAccountStatusBox,
  StripeConnectAccountForm,
} from '../../../components';

// Import modules from this directory
import EditListingWizardTab, {
  DETAILS,
  PRICING,
  PRICING_AND_STOCK,
  DELIVERY,
  LOCATION,
  AVAILABILITY,
  PHOTOS,
  STYLE,
} from './EditListingWizardTab';
import css from './EditListingWizard.module.css';

// This is the initial tab on editlisting wizard.
// When listing type is known, other tabs are checked from _tabsForListingType_ function.
const TABS_DETAILS_ONLY = [DETAILS];

// Tabs are horizontal in small screens
const MAX_HORIZONTAL_NAV_SCREEN_WIDTH = 1023;

const STRIPE_ONBOARDING_RETURN_URL_SUCCESS = 'success';
const STRIPE_ONBOARDING_RETURN_URL_FAILURE = 'failure';

/**
 * Pick only allowed tabs for the given process and listing type configuration.
 * - The location tab could be omitted for booking process
 * - The delivery tab could be omitted for purchase process
 * - The location and pricing tabs could be omitted for negotiation process
 * - The location and pricing tabs could be omitted for inquiry process
 *
 * @param {string} processName - The name of the process
 * @param {Object} listingTypeConfig - The listing type configuration
 * @returns {Array<string>} - The allowed tabs for the given process and listing type configuration
 */
const tabsForListingType = (processName, listingTypeConfig) => {
  const locationMaybe = displayLocation(listingTypeConfig) ? [LOCATION] : [];
  const pricingMaybe = displayPrice(listingTypeConfig) ? [PRICING] : [];
  const deliveryMaybe =
    displayDeliveryPickup(listingTypeConfig) || displayDeliveryShipping(listingTypeConfig)
      ? [DELIVERY]
      : [];
  const styleOrPhotosTab = requireListingImage(listingTypeConfig) ? [PHOTOS] : [STYLE];

  // You can reorder these panels.
  // Note 1: You need to change save button translations for new listing flow
  // Note 2: Ensure that draft listing is created after the first panel
  //         and listing publishing happens after last panel.
  // Note 3: The first tab creates a draft listing and title is mandatory attribute for it.
  //         Details tab asks for "title" and is therefore the first tab in the wizard flow.
  const tabs = {
    ['default-booking']: [DETAILS, ...locationMaybe, PRICING, AVAILABILITY, ...styleOrPhotosTab],
    ['default-purchase']: [DETAILS, PRICING_AND_STOCK, ...deliveryMaybe, ...styleOrPhotosTab],
    ['default-negotiation']: [DETAILS, ...locationMaybe, ...pricingMaybe, ...styleOrPhotosTab],
    ['default-inquiry']: [DETAILS, ...locationMaybe, ...pricingMaybe, ...styleOrPhotosTab],
  };

  return tabs[processName] || tabs['default-inquiry'];
};

/**
 * Return translations for wizard tab: label and submit button.
 *
 * @param {Object} intl
 * @param {string} tab name of the tab/panel in the wizard
 * @param {boolean} isNewListingFlow
 * @param {string} processName
 */
const tabLabelAndSubmit = (intl, tab, isNewListingFlow, isPriceDisabled, processName) => {
  const processNameString = isNewListingFlow ? `${processName}.` : '';
  const newOrEdit = isNewListingFlow ? 'new' : 'edit';

  let labelKey = null;
  let submitButtonKey = null;
  if (tab === DETAILS) {
    labelKey = 'EditListingWizard.tabLabelDetails';
    submitButtonKey = `EditListingWizard.${processNameString}${newOrEdit}.saveDetails`;
  } else if (tab === PRICING) {
    labelKey = 'EditListingWizard.tabLabelPricing';
    submitButtonKey = `EditListingWizard.${processNameString}${newOrEdit}.savePricing`;
  } else if (tab === PRICING_AND_STOCK) {
    labelKey = 'EditListingWizard.tabLabelPricingAndStock';
    submitButtonKey = `EditListingWizard.${processNameString}${newOrEdit}.savePricingAndStock`;
  } else if (tab === DELIVERY) {
    labelKey = 'EditListingWizard.tabLabelDelivery';
    submitButtonKey = `EditListingWizard.${processNameString}${newOrEdit}.saveDelivery`;
  } else if (tab === LOCATION) {
    labelKey = 'EditListingWizard.tabLabelLocation';
    submitButtonKey =
      isPriceDisabled && isNewListingFlow
        ? `EditListingWizard.${processNameString}${newOrEdit}.saveLocationNoPricingTab`
        : `EditListingWizard.${processNameString}${newOrEdit}.saveLocation`;
  } else if (tab === AVAILABILITY) {
    labelKey = 'EditListingWizard.tabLabelAvailability';
    submitButtonKey = `EditListingWizard.${processNameString}${newOrEdit}.saveAvailability`;
  } else if (tab === PHOTOS) {
    labelKey = 'EditListingWizard.tabLabelPhotos';
    submitButtonKey = `EditListingWizard.${processNameString}${newOrEdit}.savePhotos`;
  } else if (tab === STYLE) {
    labelKey = 'EditListingWizard.tabLabelStyle';
    submitButtonKey = `EditListingWizard.${processNameString}${newOrEdit}.saveStyle`;
  }

  return {
    label: intl.formatMessage({ id: labelKey }),
    submitButton: intl.formatMessage({ id: submitButtonKey }),
  };
};

/**
 * Validate listing fields (in extended data) that are included through configListing.js
 * This is used to check if listing creation flow can show the "next" tab as active.
 *
 * @param {Object} publicData
 * @param {Object} privateData
 */
const hasValidListingFieldsInExtendedData = (publicData, privateData, config) => {
  const isValidField = (fieldConfig, fieldData) => {
    const { key, schemaType, enumOptions = [], saveConfig = {} } = fieldConfig;

    const schemaOptionKeys = enumOptions.map(o => `${o.option}`);
    const hasValidEnumValue = optionData => {
      return schemaOptionKeys.includes(optionData);
    };
    const hasValidMultiEnumValues = savedOptions => {
      return savedOptions.every(optionData => schemaOptionKeys.includes(optionData));
    };

    const categoryKey = config.categoryConfiguration.key;
    const categoryOptions = config.categoryConfiguration.categories;
    const categoriesObj = pickCategoryFields(publicData, categoryKey, 1, categoryOptions);
    const currentCategories = Object.values(categoriesObj);

    const isTargetListingType = isFieldForListingType(publicData?.listingType, fieldConfig);
    const isTargetCategory = isFieldForCategory(currentCategories, fieldConfig);
    const isRequired = !!saveConfig.isRequired && isTargetListingType && isTargetCategory;

    if (isRequired) {
      const savedListingField = fieldData[key];
      return schemaType === SCHEMA_TYPE_ENUM
        ? typeof savedListingField === 'string' && hasValidEnumValue(savedListingField)
        : schemaType === SCHEMA_TYPE_MULTI_ENUM
        ? Array.isArray(savedListingField) && hasValidMultiEnumValues(savedListingField)
        : schemaType === SCHEMA_TYPE_TEXT
        ? typeof savedListingField === 'string'
        : schemaType === SCHEMA_TYPE_LONG
        ? typeof savedListingField === 'number' && Number.isInteger(savedListingField)
        : schemaType === SCHEMA_TYPE_BOOLEAN
        ? savedListingField === true || savedListingField === false
        : schemaType === SCHEMA_TYPE_YOUTUBE
        ? typeof savedListingField === 'string'
        : false;
    }
    return true;
  };
  return config.listing.listingFields.reduce((isValid, fieldConfig) => {
    const data = fieldConfig.scope === 'private' ? privateData : publicData;
    return isValid && isValidField(fieldConfig, data);
  }, true);
};

/**
 * Check if a wizard tab is completed.
 *
 * @param tab wizard's tab
 * @param listing is contains some specific data if tab is completed
 *
 * @return true if tab / step is completed.
 */
const tabCompleted = (tab, listing, config) => {
  const {
    availabilityPlan,
    description,
    geolocation,
    price,
    title,
    publicData,
    privateData,
  } = listing.attributes;
  const images = listing.images;
  const {
    listingType,
    transactionProcessAlias,
    unitType,
    shippingEnabled,
    pickupEnabled,
    cardStyle,
  } = publicData || {};
  const listingTypeConfig = config.listing.listingTypes.find(
    config => config.listingType === listingType
  );

  const descriptionRequired = displayDescription(listingTypeConfig);
  const hasValidDescription = descriptionRequired ? description : true;

  const deliveryOptionPicked = publicData && (shippingEnabled || pickupEnabled);

  switch (tab) {
    case DETAILS:
      return !!(
        (!descriptionRequired || hasValidDescription) &&
        title &&
        listingType &&
        transactionProcessAlias &&
        unitType &&
        hasValidListingFieldsInExtendedData(publicData, privateData, config)
      );
    case PRICING:
      return !!price;
    case PRICING_AND_STOCK:
      return !!price;
    case DELIVERY:
      return !!deliveryOptionPicked;
    case LOCATION:
      return !!(geolocation && publicData?.location?.address);
    case AVAILABILITY:
      return !!availabilityPlan;
    case PHOTOS:
      return images && images.length > 0;
    case STYLE:
      return !!cardStyle;
    default:
      return false;
  }
};

/**
 * Check which wizard tabs are active and which are not yet available. Tab is active if previous
 * tab is completed. In edit mode all tabs are active.
 *
 * @param isNew flag if a new listing is being created or an old one being edited
 * @param listing data to be checked
 * @param tabs array of tabs used for this listing. These depend on transaction process.
 *
 * @return object containing activity / editability of different tabs of this wizard
 */
const tabsActive = (isNew, listing, tabs, config) => {
  return tabs.reduce((acc, tab) => {
    const previousTabIndex = tabs.findIndex(t => t === tab) - 1;
    const validTab = previousTabIndex >= 0;
    const hasListingType = !!listing?.attributes?.publicData?.listingType;
    const prevTabComletedInNewFlow = tabCompleted(tabs[previousTabIndex], listing, config);
    const isActive =
      validTab && !isNew ? hasListingType : validTab && isNew ? prevTabComletedInNewFlow : true;
    return { ...acc, [tab]: isActive };
  }, {});
};

const scrollToTab = (tabPrefix, tabId) => {
  const el = document.querySelector(`#${tabPrefix}_${tabId}`);
  if (el && el.scrollIntoView) {
    el.scrollIntoView({
      block: 'start',
      behavior: 'smooth',
    });
  }
};

// Create return URL for the Stripe onboarding form
const createReturnURL = (returnURLType, rootURL, routes, pathParams) => {
  const path = createResourceLocatorString(
    'EditListingStripeOnboardingPage',
    routes,
    { ...pathParams, returnURLType },
    {}
  );
  const root = rootURL.replace(/\/$/, '');
  return `${root}${path}`;
};

// Get attribute: stripeAccountData
const getStripeAccountData = stripeAccount => stripeAccount.attributes.stripeAccountData || null;

// Get last 4 digits of bank account returned in Stripe account
const getBankAccountLast4Digits = stripeAccountData =>
  stripeAccountData && stripeAccountData.external_accounts.data.length > 0
    ? stripeAccountData.external_accounts.data[0].last4
    : null;

// Check if there's requirements on selected type: 'past_due', 'currently_due' etc.
const hasRequirements = (stripeAccountData, requirementType) =>
  stripeAccountData != null &&
  stripeAccountData.requirements &&
  Array.isArray(stripeAccountData.requirements[requirementType]) &&
  stripeAccountData.requirements[requirementType].length > 0;

// Redirect user to Stripe's hosted Connect account onboarding form
const handleGetStripeConnectAccountLinkFn = (getLinkFn, commonParams) => type => () => {
  getLinkFn({ type, ...commonParams })
    .then(url => {
      window.location.href = url;
    })
    .catch(err => console.error(err));
};

const RedirectToStripe = ({ redirectFn }) => {
  useEffect(redirectFn('custom_account_verification'), []);
  return <FormattedMessage id="EditListingWizard.redirectingToStripe" />;
};

const getListingTypeConfig = (listing, selectedListingType, config) => {
  const existingListingType = listing?.attributes?.publicData?.listingType;
  const validListingTypes = config.listing.listingTypes;
  const hasOnlyOneListingType = validListingTypes?.length === 1;

  const listingTypeConfig = existingListingType
    ? validListingTypes.find(conf => conf.listingType === existingListingType)
    : selectedListingType
    ? validListingTypes.find(conf => conf.listingType === selectedListingType.listingType)
    : hasOnlyOneListingType
    ? validListingTypes[0]
    : null;
  return listingTypeConfig;
};

/**
 * EditListingWizard is a component that renders the tabs that update the different parts of the listing.
 * It also handles the payout details modal and the Stripe onboarding form if the listing is a new one.
 * TODO: turn this into a functional component
 *
 * @component
 * @param {Object} props - The props object
 * @param {string} props.id - The id of the listing
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} [props.rootClassName] - Custom class that overrides the default class for the root element
 * @param {Object} props.config - The config object
 * @param {Object} props.routeConfiguration - The route configuration object
 * @param {Object} props.params - The params object
 * @param {string} props.params.id - The id of the listing
 * @param {string} props.params.slug - The slug of the listing
 * @param {'new'|'draft'|'edit'} props.params.type - The type of the listing
 * @param {DETAILS | PRICING | PRICING_AND_STOCK | DELIVERY | LOCATION | AVAILABILITY | PHOTOS} props.params.tab - The name of the tab
 * @param {propTypes.ownListing} props.listing - The listing object
 * @param {propTypes.error} [props.errors.createListingDraftError] - The error object for createListingDraft
 * @param {propTypes.error} [props.errors.publishListingError] - The error object for publishListing
 * @param {propTypes.error} [props.errors.updateListingError] - The error object for updateListing
 * @param {propTypes.error} [props.errors.showListingsError] - The error object for showListings
 * @param {propTypes.error} [props.errors.uploadImageError] - The upload image error object
 * @param {propTypes.error} [props.errors.createStripeAccountError] - The error object for createStripeAccount
 * @param {propTypes.error} [props.errors.addExceptionError] - The error object for addException
 * @param {propTypes.error} [props.errors.deleteExceptionError] - The error object for deleteException
 * @param {propTypes.error} [props.errors.setStockError] - The error object for setStock
 * @param {boolean} props.fetchInProgress - Whether the fetch is in progress
 * @param {boolean} props.getAccountLinkInProgress - Whether the get account link is in progress
 * @param {boolean} props.payoutDetailsSaveInProgress - Whether the payout details save is in progress
 * @param {boolean} props.payoutDetailsSaved - Whether the payout details saved is in progress
 * @param {Function} props.onPayoutDetailsChange - The on payout details change function
 * @param {Function} props.onPayoutDetailsSubmit - The on payout details submit function
 * @param {Function} props.onGetStripeConnectAccountLink - The get StripeConnectAccountLink function
 * @param {propTypes.error} [props.createStripeAccountError] - The error object for createStripeAccount (TODO: errors object contains this)
 * @param {propTypes.error} [props.updateStripeAccountError] - The error object for updateStripeAccount (TODO: errors object contains this)
 * @param {propTypes.error} [props.fetchStripeAccountError] - The error object for fetchStripeAccount
 * @param {propTypes.error} [props.stripeAccountError] - The error object for stripeAccount (TODO: errors object contains this)
 * @param {propTypes.error} [props.stripeAccountLinkError] - The error object for stripeAccountLink
 * @param {Function} props.onManageDisableScrolling - The on manage disable scrolling function
 * @param {intlShape} props.intl - The intl object
 * @returns {JSX.Element} EditListingWizard component
 */
class EditListingWizard extends Component {
  constructor(props) {
    super(props);

    // Having this info in state would trigger unnecessary rerendering
    this.hasScrolledToTab = false;

    this.state = {
      draftId: null,
      showPayoutDetails: false,
      showTCModal: false,
      selectedListingType: null,
      mounted: false,
    };
    this.handleCreateFlowTabScrolling = this.handleCreateFlowTabScrolling.bind(this);
    this.handlePublishListing = this.handlePublishListing.bind(this);
    this.handlePayoutModalClose = this.handlePayoutModalClose.bind(this);
    this.handleTCModalClose = this.handleTCModalClose.bind(this);
  }

  componentDidMount() {
    const { stripeOnboardingReturnURL } = this.props;

    if (stripeOnboardingReturnURL != null && !this.showPayoutDetails) {
      this.setState({ showPayoutDetails: true });
    }
    if (!this.mounted) {
      this.mounted = true;
    }
  }

  handleCreateFlowTabScrolling(shouldScroll) {
    this.hasScrolledToTab = shouldScroll;
  }

  handlePublishListing(id) {
    const { onPublishListingDraft, currentUser, stripeAccount, listing, config } = this.props;
    const processName = listing?.attributes?.publicData?.transactionProcessAlias.split('/')[0];
    const isInquiryProcess = processName === INQUIRY_PROCESS_NAME;

    const listingTypeConfig = getListingTypeConfig(listing, this.state.selectedListingType, config);

    const stripeConnected = !!currentUser?.stripeAccount?.id;
    const stripeAccountData = stripeConnected ? getStripeAccountData(stripeAccount) : null;
    const stripeRequirementsMissing =
      stripeAccount &&
      (hasRequirements(stripeAccountData, 'past_due') ||
        hasRequirements(stripeAccountData, 'currently_due'));

    const hasManualPayoutDetails =
      !!currentUser?.attributes?.profile?.privateData?.manualPayoutDetails;

    if (
      isInquiryProcess ||
      hasManualPayoutDetails ||
      (stripeConnected && !stripeRequirementsMissing)
    ) {
      this.setState({ draftId: id, showTCModal: true });
    } else {
      this.setState({ draftId: id, showTCModal: true, showPayoutDetails: false });
    }
  }

  handlePayoutModalClose() {
    this.setState({ showPayoutDetails: false });
  }

  handleTCModalClose() {
    this.setState({ showTCModal: false });
  }

  render() {
    const {
      id,
      className,
      rootClassName,
      params,
      listing,
      intl,
      errors,
      fetchInProgress,
      payoutDetailsSaveInProgress,
      payoutDetailsSaved,
      onManageDisableScrolling,
      onPayoutDetailsChange,
      onGetStripeConnectAccountLink,
      getAccountLinkInProgress,
      createStripeAccountError,
      updateStripeAccountError,
      fetchStripeAccountError,
      stripeAccountFetched,
      stripeAccount,
      stripeAccountError,
      stripeAccountLinkError,
      currentUser,
      config,
      routeConfiguration,
      authScopes,
      ...rest
    } = this.props;

    const selectedTab = params.tab;
    const isNewListingFlow = [LISTING_PAGE_PARAM_TYPE_NEW, LISTING_PAGE_PARAM_TYPE_DRAFT].includes(
      params.type
    );
    const rootClasses = rootClassName || css.root;
    const classes = classNames(rootClasses, className);
    const currentListing = ensureListing(listing);
    const savedProcessAlias = currentListing.attributes?.publicData?.transactionProcessAlias;
    const transactionProcessAlias =
      savedProcessAlias || this.state.selectedListingType?.transactionProcessAlias;

    // NOTE: If the listing has invalid configuration in place,
    // the listing is considered deprecated and we don't allow user to modify the listing anymore.
    // Instead, operator should do that through Console or Integration API.
    const validListingTypes = config.listing.listingTypes;
    const listingTypeConfig = getListingTypeConfig(
      currentListing,
      this.state.selectedListingType,
      config
    );
    const existingListingType = currentListing.attributes?.publicData?.listingType;
    const invalidExistingListingType = existingListingType && !listingTypeConfig;
    // TODO: displayPrice aka config.defaultListingFields?.price with false value is only available with inquiry process
    //       if it's enabled with other processes, translations for "new" flow needs to be updated.
    const isPriceDisabled = !displayPrice(listingTypeConfig);

    // Transaction process alias is used here, because the process defineds whether the listing is supported
    // I.e. old listings might not be supported through listing types, but client app might still support those processes.
    const processName = transactionProcessAlias
      ? transactionProcessAlias.split('/')[0]
      : validListingTypes.length === 1
      ? validListingTypes[0].transactionType.process
      : INQUIRY_PROCESS_NAME;

    const hasListingTypeSelected =
      existingListingType || this.state.selectedListingType || validListingTypes.length === 1;

    // For oudated draft listing, we don't show other tabs but the "details"
    const tabs =
      isNewListingFlow && (invalidExistingListingType || !hasListingTypeSelected)
        ? TABS_DETAILS_ONLY
        : tabsForListingType(processName, listingTypeConfig);

    // Check if wizard tab is active / linkable.
    // When creating a new listing, we don't allow users to access next tab until the current one is completed.
    const tabsStatus = tabsActive(isNewListingFlow, currentListing, tabs, config);

    // Redirect user to first tab when encoutering outdated draft listings.
    if (invalidExistingListingType && isNewListingFlow && selectedTab !== tabs[0]) {
      return <NamedRedirect name="EditListingPage" params={{ ...params, tab: tabs[0] }} />;
    }

    // If selectedTab is not active for listing with valid listing type,
    // redirect to the beginning of wizard
    if (!invalidExistingListingType && !tabsStatus[selectedTab]) {
      const currentTabIndex = tabs.indexOf(selectedTab);
      const nearestActiveTab = tabs
        .slice(0, currentTabIndex)
        .reverse()
        .find(t => tabsStatus[t]);

      console.log(
        `You tried to access an EditListingWizard tab (${selectedTab}), which was not yet activated.`
      );
      return <NamedRedirect name="EditListingPage" params={{ ...params, tab: nearestActiveTab }} />;
    }

    const isBrowser = typeof window !== 'undefined';
    const hasMatchMedia = isBrowser && window?.matchMedia;
    const isMobileLayout = hasMatchMedia
      ? window.matchMedia(`(max-width: ${MAX_HORIZONTAL_NAV_SCREEN_WIDTH}px)`)?.matches
      : true;

    const hasHorizontalTabLayout = this.mounted && isMobileLayout;
    const hasVerticalTabLayout = this.mounted && !isMobileLayout;

    // Check if scrollToTab call is needed (tab is not visible on mobile)
    if (hasVerticalTabLayout) {
      this.hasScrolledToTab = true;
    } else if (hasHorizontalTabLayout && !this.hasScrolledToTab) {
      const tabPrefix = id;
      scrollToTab(tabPrefix, selectedTab);
      this.hasScrolledToTab = true;
    }

    const tabLink = tab => {
      return { name: 'EditListingPage', params: { ...params, tab } };
    };

    const formDisabled = getAccountLinkInProgress;
    const ensuredCurrentUser = ensureCurrentUser(currentUser);
    const currentUserLoaded = !!ensuredCurrentUser.id;
    const stripeConnected = currentUserLoaded && !!stripeAccount && !!stripeAccount.id;

    const rootURL = config.marketplaceRootURL;
    const { returnURLType, ...pathParams } = params;
    const successURL = createReturnURL(
      STRIPE_ONBOARDING_RETURN_URL_SUCCESS,
      rootURL,
      routeConfiguration,
      pathParams
    );
    const failureURL = createReturnURL(
      STRIPE_ONBOARDING_RETURN_URL_FAILURE,
      rootURL,
      routeConfiguration,
      pathParams
    );

    const accountId = stripeConnected ? stripeAccount.id : null;
    const stripeAccountData = stripeConnected ? getStripeAccountData(stripeAccount) : null;

    const requirementsMissing =
      stripeAccount &&
      (hasRequirements(stripeAccountData, 'past_due') ||
        hasRequirements(stripeAccountData, 'currently_due'));

    const savedCountry = stripeAccountData ? stripeAccountData.country : null;
    const savedAccountType = stripeAccountData ? stripeAccountData.business_type : null;

    const { marketplaceName } = config;
    const payoutModalInfo = stripeAccountData ? (
      <FormattedMessage id="EditListingWizard.payoutModalInfo" values={{ marketplaceName }} />
    ) : (
      <FormattedMessage id="EditListingWizard.payoutModalInfoNew" values={{ marketplaceName }} />
    );

    const handleGetStripeConnectAccountLink = handleGetStripeConnectAccountLinkFn(
      onGetStripeConnectAccountLink,
      {
        accountId,
        successURL,
        failureURL,
      }
    );

    const returnedNormallyFromStripe = returnURLType === STRIPE_ONBOARDING_RETURN_URL_SUCCESS;
    const returnedAbnormallyFromStripe = returnURLType === STRIPE_ONBOARDING_RETURN_URL_FAILURE;
    const showVerificationNeeded = stripeConnected && requirementsMissing;

    // Check if user has limited rights and set button titles accordingly
    const limitedRights = authScopes?.indexOf('user:limited') >= 0;
    const stripeButtonTitle = limitedRights
      ? intl.formatMessage({ id: 'StripePayoutPage.submitButtonText' })
      : null;

    // Redirect from success URL to basic path for StripePayoutPage
    if (returnedNormallyFromStripe && stripeConnected && !requirementsMissing) {
      return <NamedRedirect name="EditListingPage" params={pathParams} />;
    }

    return (
      <div className={classes}>
        <Tabs
          rootClassName={css.tabsContainer}
          navRootClassName={css.nav}
          tabRootClassName={css.tab}
          ariaLabel={intl.formatMessage({ id: 'EditListingWizard.screenreader.tabNavigation' })}
        >
          {tabs.map(tab => {
            const tabTranslations = tabLabelAndSubmit(
              intl,
              tab,
              isNewListingFlow,
              isPriceDisabled,
              resolveLatestProcessName(processName)
            );
            return (
              <EditListingWizardTab
                {...rest}
                key={tab}
                tabId={`${id}_${tab}`}
                tabLabel={tabTranslations.label}
                tabSubmitButtonText={tabTranslations.submitButton}
                tabLinkProps={tabLink(tab)}
                selected={selectedTab === tab}
                disabled={isNewListingFlow && !tabsStatus[tab]}
                tab={tab}
                params={params}
                listing={listing}
                marketplaceTabs={tabs}
                errors={errors}
                handleCreateFlowTabScrolling={this.handleCreateFlowTabScrolling}
                handlePublishListing={this.handlePublishListing}
                fetchInProgress={fetchInProgress}
                onListingTypeChange={selectedListingType => this.setState({ selectedListingType })}
                onManageDisableScrolling={onManageDisableScrolling}
                config={config}
                routeConfiguration={routeConfiguration}
                intl={intl}
              />
            );
          })}
        </Tabs>

        {/* T&C Modal */}
        <Modal
          id="EditListingWizard.tcModal"
          isOpen={this.state.showTCModal}
          onClose={() => this.handleTCModalClose()}
          onManageDisableScrolling={onManageDisableScrolling}
          usePortal
        >
          <div className={css.modalPayoutDetailsWrapper}>
            <Heading as="h2" rootClassName={css.modalTitle}>
              One more thing
            </Heading>
            <p style={{ color: '#666', marginBottom: 16, lineHeight: 1.6 }}>
              Please read and accept our Terms and Conditions before publishing your listing.
            </p>

            {/* Scroll hint */}
            <p
              id="tc-hint"
              style={{ fontSize: 12, color: '#999', marginBottom: 12, fontStyle: 'italic' }}
            >
              ↓ Scroll to the bottom to accept
            </p>

            {/* Scrollable T&C box */}
            <div
              id="tc-scroll-box"
              onScroll={e => {
                const el = e.target;
                const atBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 10;
                
                console.log('scrollHeight:', el.scrollHeight, 'scrollTop:', el.scrollTop, 'clientHeight:', el.clientHeight, 'atBottom:', atBottom);

                if (atBottom) {
                  document.getElementById('tc-checkbox').disabled = false;
                  document.getElementById('tc-checkbox-label').style.color = '#333';
                  document.getElementById('tc-hint').style.display = 'none';
                }
              }}
              style={{
                height: 260,
                overflowY: 'scroll',
                border: '1px solid #e0e0e0',
                borderRadius: 4,
                padding: '16px',
                fontSize: 13,
                lineHeight: 1.8,
                color: '#444',
                marginBottom: 12,
                backgroundColor: '#fafafa',
              }}
            >
              <strong>Terms and Conditions</strong><br />
              <em>Last updated: 14 March 2026</em>
              <br /><br />
              These Terms and Conditions ("Terms") govern the use of the Patamali platform ("Platform"), accessible via http://patamali.com, which connects guests seeking furnished mid-term accommodation with hosts offering such properties.
              <br /><br />
              By accessing or using the platform as a guest or host, you agree to comply with these Terms.
              <br /><br />
              <strong>1. About Patamali</strong><br />
              Patamali operates an online platform that connects guests with furnished apartments available for stays of 30 days or longer. Patamali facilitates bookings and manages payments between guests and hosts in order to create a secure and reliable rental experience. Unless explicitly stated, Patamali does not own, operate, or manage the properties listed on the platform.
              <br /><br />
              <strong>2. Eligibility</strong><br />
              To use the Patamali platform, users must: be at least 18 years of age, provide accurate and complete information when creating an account, and comply with all applicable laws and regulations. Patamali reserves the right to suspend or terminate accounts that violate these Terms.
              <br /><br />
              <strong>3. Bookings and Payments</strong><br />
              All bookings must be made through the Patamali platform. To reduce fraud and protect both guests and hosts, Patamali collects payment from guests on behalf of hosts. Payments are held securely until the guest has checked into the property. Hosts receive payment one (1) day after the guest has successfully checked in. This payment structure applies even if a booking is made weeks or months in advance.
              <br /><br />
              <strong>4. Patamali Service Fee and Platform Integrity</strong><br />
              Patamali charges hosts a 10% commission on the total booking amount paid by the guest. This commission is deducted before payment is transferred to the host. All bookings initiated through the Patamali platform must be completed through the platform's booking and payment system. Hosts and guests agree not to bypass or attempt to bypass the Patamali platform in order to avoid service fees or commissions. If Patamali determines that a user has attempted to circumvent the platform, the account may be suspended or permanently removed, active bookings may be cancelled, and Patamali may charge the applicable service fee that would have been due.
              <br /><br />
              <strong>5. Host Responsibilities</strong><br />
              Hosts listing properties on Patamali agree to: provide accurate descriptions and information about their property, upload real and current photos of the actual unit offered, ensure they are the legal owner or authorized host of the property, maintain the property in a safe and habitable condition, and honor confirmed bookings made through the platform. Hosts are responsible for ensuring their listings comply with local laws and regulations.
              <br /><br />
              <strong>6. Host Misrepresentation and Removal</strong><br />
              Patamali may remove hosts or listings from the platform if the property listed does not match the photos or description, the property offered is not the actual unit shown in the listing, the host is not the rightful owner or authorized host, the host attempts to move bookings off the platform, or the host engages in fraudulent or misleading behavior.
              <br /><br />
              <strong>7. Guest Responsibilities</strong><br />
              Guests agree to provide accurate booking and contact information, respect the property and house rules provided by the host, and use the property only for lawful purposes. Guests must not attempt to arrange bookings outside the Patamali platform after discovering a property through Patamali.
              <br /><br />
              <strong>8. Verification and Trust</strong><br />
              Patamali takes reasonable steps to review listings and verify host identities where possible. However, Patamali cannot guarantee the accuracy, legality, or safety of all listings, and users should report concerns immediately.
              <br /><br />
              <strong>9. Check-In Issues and Property Accuracy</strong><br />
              If a guest encounters a serious issue at check-in or within the first two (2) days of the stay, the guest must notify Patamali immediately. Upon notification, Patamali will make reasonable efforts to assist the guest in securing alternative accommodation or provide a partial or full refund where appropriate.
              <br /><br />
              <strong>10. Cancellation Policy</strong><br />
              More than 14 days before check-in: full refund. Within 14 days of check-in: 25% cancellation fee. Within 7 days of check-in: 50% cancellation fee. No-show or cancellation after check-in: no refund. Where a cancellation fee applies, Patamali deducts a 10% service commission from the cancellation amount, the remaining balance is paid to the host as compensation, and any remaining amount is refunded to the guest.
              <br /><br />
              <strong>11. Security Deposit</strong><br />
              Some properties may require a security deposit, typically equal to one month of rent. Hosts are responsible for returning the security deposit within a reasonable period after check-out, provided the property is left in good condition, no damage has occurred, and all house rules have been respected.
              <br /><br />
              <strong>12. Payment Processing</strong><br />
              Patamali may use third-party payment processors to facilitate transactions. Patamali is not responsible for delays caused by payment processors, banks, currency conversion providers, or technical issues outside Patamali's control.
              <br /><br />
              <strong>13. Platform Rules</strong><br />
              Users may not attempt to bypass Patamali's payment system, engage in fraud or misrepresentation, or interfere with the operation or security of the platform.
              <br /><br />
              <strong>14. Termination of Accounts</strong><br />
              Patamali reserves the right to suspend or terminate accounts that violate these Terms, engage in fraudulent activity, or attempt to circumvent the platform.
              <br /><br />
              <strong>15. Limitation of Liability</strong><br />
              To the fullest extent permitted by law, Patamali and its affiliates shall not be liable for indirect, incidental, or consequential damages arising from the use of the platform. Patamali's total liability related to a booking shall not exceed the service fees paid to Patamali for that booking.
              <br /><br />
              <strong>16. Indemnification</strong><br />
              Users agree to indemnify and hold harmless Patamali, its founders, employees, and affiliates from claims, damages, losses, or expenses arising from violation of these Terms, a host's listing or rental of a property, a guest's use of a property, property damage or personal injury during a stay, or disputes between hosts and guests.
              <br /><br />
              <strong>17. Force Majeure</strong><br />
              Patamali shall not be liable for delays or failure to perform obligations due to events beyond its reasonable control, including natural disasters, government actions, political instability, internet outages, labor disputes, war, terrorism, or public health emergencies.
              <br /><br />
              <strong>18. Governing Law</strong><br />
              These Terms shall be governed by and interpreted in accordance with the laws of Kenya. Any disputes arising from the use of the platform shall be subject to the courts of Kenya.
              <br /><br />
              <strong>19. Changes to These Terms</strong><br />
              Patamali may update these Terms from time to time. Continued use of the platform after updates constitutes acceptance of the revised Terms.
            </div>

            {/* Checkbox */}
            <label
              id="tc-checkbox-label"
              style={{
                display: 'grid',
                gridTemplateColumns: '16px 1fr',
                gap: 10,
                fontSize: 13,
                color: '#999',
                marginBottom: 24,
                lineHeight: 1.6,
                width: '100%',
                boxSizing: 'border-box',
                overflow: 'hidden',
              }}
            >
              <input
                id="tc-checkbox"
                type="checkbox"
                disabled
                onChange={e => {
                  const btn = document.getElementById('tc-publish-btn');
                  const checked = e.target.checked;
                  btn.style.backgroundColor = checked ? '#6e42e5' : '#f5f5f5';
                  btn.style.color = checked ? '#fff' : '#aaa';
                  btn.style.borderColor = checked ? '#6e42e5' : '#e0e0e0';
                  btn.style.cursor = checked ? 'pointer' : 'default';
                  document.getElementById('tc-checkbox-label').style.color = checked ? '#333' : '#999';
                }}
                style={{ marginTop: 3 }}
              />
              <span style={{ minWidth: 0, wordBreak: 'break-word' }}>
                I understand that payouts are made only 24 hours after the guest has checked in, and I agree to Patamali's Terms and Conditions.
              </span>
            </label>

            {/* Publish button */}
            <button
              id="tc-publish-btn"
              onClick={() => {
                const checkbox = document.getElementById('tc-checkbox');
                if (!checkbox.checked) return;
                const hasManualPayoutDetails =
                  !!ensuredCurrentUser?.attributes?.profile?.privateData?.manualPayoutDetails;
                this.handleTCModalClose();
                if (hasManualPayoutDetails) {
                  this.props.onPublishListingDraft(this.state.draftId);
                } else {
                  this.setState({ showPayoutDetails: true });
                }
              }}
              style={{
                display: 'block',
                width: '100%',
                padding: '14px',
                backgroundColor: '#f5f5f5',
                color: '#aaa',
                textAlign: 'center',
                borderRadius: 4,
                fontWeight: 500,
                boxSizing: 'border-box',
                border: '1px solid #e0e0e0',
                cursor: 'default',
                fontFamily: 'inherit',
                fontSize: 16,
              }}
            >
              Accept & Continue
            </button>
          </div>
        </Modal>

        {/* Payout Modal */}  
        <Modal
          id="EditListingWizard.payoutModal"
          isOpen={this.state.showPayoutDetails}
          onClose={() => {
            this.handlePayoutModalClose();
            const main = document.getElementsByTagName('main')?.[0];
            const submitButtons = main?.querySelectorAll('button[type="submit"]');
            const lastSubmitButton = submitButtons?.[submitButtons.length - 1];
            if (lastSubmitButton) {
              lastSubmitButton.focus();
            }
          }}
          onManageDisableScrolling={onManageDisableScrolling}
          usePortal
        >
          <div className={css.modalPayoutDetailsWrapper}>
            <Heading as="h2" rootClassName={css.modalTitle}>
              Payout details required
            </Heading>
            <p style={{ color: '#666', marginBottom: 24, lineHeight: 1.6 }}>
              Don't worry — your listing has been saved as a draft. You need to add your payout details before publishing. Add them now, then come back here to publish.
            </p>
            <NamedLink
              name="StripePayoutPage"
              style={{
                display: 'block',
                width: '100%',
                padding: '14px',
                backgroundColor: '#6e42e5',
                color: '#fff',
                textAlign: 'center',
                borderRadius: 4,
                textDecoration: 'none',
                fontWeight: 500,
                boxSizing: 'border-box',
              }}
            >
              Continue to payout details
            </NamedLink>
          </div>
        </Modal>
      </div>
    );
  }
}

const EnhancedEditListingWizard = props => {
  const config = useConfiguration();
  const routeConfiguration = useRouteConfiguration();
  const intl = useIntl();
  return (
    <EditListingWizard
      config={config}
      routeConfiguration={routeConfiguration}
      intl={intl}
      {...props}
    />
  );
};

export default EnhancedEditListingWizard;
