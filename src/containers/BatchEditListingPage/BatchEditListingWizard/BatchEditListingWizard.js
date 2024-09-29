import React, { useMemo, useState } from 'react';
import { string } from 'prop-types';
import classNames from 'classnames';

// Import configs and util modules
import { useConfiguration } from '../../../context/configurationContext';
import { useRouteConfiguration } from '../../../context/routeConfigurationContext';
import { useIntl } from '../../../util/reactIntl';
import { displayPrice } from '../../../util/configHelpers';
import {
  LISTING_PAGE_PARAM_TYPE_DRAFT,
  LISTING_PAGE_PARAM_TYPE_NEW,
} from '../../../util/urlHelpers';
import { withViewport } from '../../../util/uiHelpers';
import { ensureListing } from '../../../util/data';
import { PURCHASE_PROCESS_NAME } from '../../../transactions/transaction';

// Import shared components
import { NamedRedirect, Tabs } from '../../../components';

// Import modules from this directory
import BatchEditListingWizardTab, { PRODUCT_DETAILS, UPLOAD } from './BatchEditListingWizardTab';
import css from './BatchEditListingWizard.module.css';
import { useUppy } from '../../../hooks/useUppy';
import { getFileMetadata } from '../../../util/file-metadata';

/**
 * Return translations for wizard tab: label and submit button.
 *
 * @param {Object} intl
 * @param {string} tab name of the tab/panel in the wizard
 * @param {boolean} isNewListingFlow
 * @param isPriceDisabled
 * @param {string} processName
 */
const tabLabelAndSubmit = (intl, tab, isNewListingFlow, isPriceDisabled, processName) => {
  const processNameString = isNewListingFlow ? `${processName}.` : '';
  const newOrEdit = isNewListingFlow ? 'new' : 'edit';

  let labelKey = null;
  let submitButtonKey = null;

  if (tab === UPLOAD) {
    labelKey = 'EditListingWizard.tabLabelUpload';
    submitButtonKey = `EditListingWizard.${processNameString}${newOrEdit}.saveUpload`;
  } else if (tab === PRODUCT_DETAILS) {
    labelKey = 'EditListingWizard.tabLabelDetails';
    submitButtonKey = `EditListingWizard.${processNameString}${newOrEdit}.savePhotos`;
  }

  return {
    label: intl.formatMessage({ id: labelKey }),
    submitButton: intl.formatMessage({ id: submitButtonKey }),
  };
};

const getListingTypeConfig = (listing, selectedListingType, config) => {
  const existingListingType = listing?.attributes?.publicData?.listingType;
  const validListingTypes = config.listing.listingTypes;
  const hasOnlyOneListingType = validListingTypes?.length === 1;

  return existingListingType
    ? validListingTypes.find(conf => conf.listingType === existingListingType)
    : selectedListingType
    ? validListingTypes.find(conf => conf.listingType === selectedListingType.listingType)
    : hasOnlyOneListingType
    ? validListingTypes[0]
    : null;
};

function getTabsStatus(fileCount) {
  return {
    [UPLOAD]: true,
    [PRODUCT_DETAILS]: fileCount > 0,
  };
}

const BatchEditListingWizard = props => {
  const {
    id = '',
    className = '',
    rootClassName = css.root,
    params = { id: '', type: LISTING_PAGE_PARAM_TYPE_NEW, tab: UPLOAD },
    listing = {},
    viewport = { width: 0 },
    intl,
    errors = {},
    fetchInProgress = false,
    payoutDetailsSaveInProgress = false,
    payoutDetailsSaved = false,
    onManageDisableScrolling = () => {},
    onPayoutDetailsChange = () => {},
    onGetStripeConnectAccountLink = () => {},
    getAccountLinkInProgress = false,
    createStripeAccountError = null,
    updateStripeAccountError = null,
    fetchStripeAccountError = null,
    stripeAccountFetched = false,
    stripeAccount = {},
    stripeAccountError = null,
    stripeAccountLinkError = null,
    currentUser = {},
    config = {},
    routeConfiguration = {},
    ...rest
  } = props;

  const { uuid: userId } = currentUser.id;
  const uppy = useUppy({ userId });
  const [fileCount, setFileCount] = useState(uppy.getFiles().length);

  uppy.on('file-removed', info => {
    setFileCount(uppy.getFiles().length);
  });

  uppy.on('file-added', ({ data, id }) => {
    getFileMetadata(data, metadata => {
      uppy.setFileMeta(id, metadata);
    });

    setFileCount(uppy.getFiles().length);
  });

  uppy.on('cancel-all', info => {
    setFileCount(0);
  });

  const [selectedListingType, setSelectedListingType] = useState(null);
  const selectedTab = params.tab;
  const isNewListingFlow = [LISTING_PAGE_PARAM_TYPE_NEW, LISTING_PAGE_PARAM_TYPE_DRAFT].includes(
    params.type
  );
  const rootClasses = rootClassName || css.root;
  const classes = classNames(rootClasses, className);
  const currentListing = ensureListing(listing);
  const savedProcessAlias = currentListing.attributes?.publicData?.transactionProcessAlias;
  const transactionProcessAlias = savedProcessAlias || selectedListingType?.transactionProcessAlias;

  // NOTE: If the listing has invalid configuration in place,
  // the listing is considered deprecated and we don't allow user to modify the listing anymore.
  // Instead, operator should do that through Console or Integration API.
  const validListingTypes = config.listing.listingTypes;
  const listingTypeConfig = getListingTypeConfig(currentListing, selectedListingType, config);
  const existingListingType = currentListing.attributes?.publicData?.listingType;
  const invalidExistingListingType = existingListingType && !listingTypeConfig;
  const isPriceDisabled = !displayPrice(listingTypeConfig);

  // Transaction process alias is used here, because the process defined whether the listing is supported
  // I.e. old listings might not be supported through listing types, but client app might still support those processes.
  const processName = transactionProcessAlias
    ? transactionProcessAlias.split('/')[0]
    : validListingTypes.length === 1
    ? validListingTypes[0].transactionType.process
    : PURCHASE_PROCESS_NAME;

  // For outdated draft listing, we don't show other tabs but the "details"
  const tabs = [UPLOAD, PRODUCT_DETAILS];

  // Check if wizard tab is active / linkable.
  // When creating a new listing, we don't allow users to access next tab until the current one is completed.
  const tabsStatus = useMemo(() => getTabsStatus(fileCount), [fileCount]);

  // Redirect user to first tab when encountering outdated draft listings.
  if (invalidExistingListingType && isNewListingFlow && selectedTab !== tabs[0]) {
    return <NamedRedirect name="BatchEditListingPage" params={{ ...params, tab: tabs[0] }} />;
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
    return (
      <NamedRedirect name="BatchEditListingPage" params={{ ...params, tab: nearestActiveTab }} />
    );
  }

  const tabLink = tab => {
    return { name: 'BatchEditListingPage', params: { ...params, tab } };
  };

  return (
    <div className={classes}>
      <Tabs rootClassName={css.tabsContainer} navRootClassName={css.nav} tabRootClassName={css.tab}>
        {tabs.map(tab => {
          const tabTranslations = tabLabelAndSubmit(
            intl,
            tab,
            isNewListingFlow,
            isPriceDisabled,
            processName
          );
          return (
            <BatchEditListingWizardTab
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
              fetchInProgress={fetchInProgress}
              onListingTypeChange={selectedListingType =>
                setSelectedListingType({ selectedListingType })
              }
              onManageDisableScrolling={onManageDisableScrolling}
              config={config}
              routeConfiguration={routeConfiguration}
              uppy={uppy}
            />
          );
        })}
      </Tabs>
    </div>
  );
};

const EnhancedBatchEditListingWizard = props => {
  const config = useConfiguration();
  const routeConfiguration = useRouteConfiguration();
  const intl = useIntl();
  return (
    <BatchEditListingWizard
      config={config}
      routeConfiguration={routeConfiguration}
      intl={intl}
      {...props}
    />
  );
};

export default withViewport(EnhancedBatchEditListingWizard);
