import React, { useMemo } from 'react';
import { string } from 'prop-types';
import classNames from 'classnames';
import { useRouteConfiguration } from '../../../context/routeConfigurationContext';
import { useIntl } from '../../../util/reactIntl';
import {
  LISTING_PAGE_PARAM_TYPE_DRAFT,
  LISTING_PAGE_PARAM_TYPE_NEW,
} from '../../../util/urlHelpers';
import { withViewport } from '../../../util/uiHelpers';

import { NamedRedirect, Tabs } from '../../../components';

import BatchEditListingWizardTab, { PRODUCT_DETAILS, UPLOAD } from './BatchEditListingWizardTab';
import css from './BatchEditListingWizard.module.css';

/**
 * Return translations for wizard tab: label and submit button.
 *
 * @param {Object} intl
 * @param {string} tab name of the tab/panel in the wizard
 * @param {boolean} isNewListingFlow
 */
const tabLabelAndSubmit = (intl, tab, isNewListingFlow) => {
  const newOrEdit = isNewListingFlow ? 'new' : 'edit';

  let labelKey = null;
  let submitButtonKey = null;

  if (tab === UPLOAD) {
    labelKey = 'BatchEditListingWizard.tabLabelUpload';
    submitButtonKey = `BatchEditListingWizard.${newOrEdit}.saveUpload`;
  } else if (tab === PRODUCT_DETAILS) {
    labelKey = 'BatchEditListingWizard.tabLabelDetails';
    submitButtonKey = `BatchEditListingWizard.${newOrEdit}.saveProductDetails`;
  }

  return {
    label: intl.formatMessage({ id: labelKey }),
    submitButton: intl.formatMessage({ id: submitButtonKey }),
  };
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
    viewport = { width: 0 },
    intl,
    currentUser = {},
    routeConfiguration = {},
    uppy = null,
    files = [],
    listingFieldsOptions = [],
    onUpdateFileDetails,
    onSaveBatchListing,
    ...rest
  } = props;
  const fileCount = uppy.getFiles().length;
  const selectedTab = params.tab;
  const isNewListingFlow = [LISTING_PAGE_PARAM_TYPE_NEW, LISTING_PAGE_PARAM_TYPE_DRAFT].includes(
    params.type
  );
  const rootClasses = rootClassName || css.root;
  const classes = classNames(rootClasses, className);
  const tabs = [UPLOAD, PRODUCT_DETAILS];
  const tabsStatus = useMemo(() => getTabsStatus(fileCount), [fileCount]);

  // If selectedTab is not active for listing with valid listing type,
  // redirect to the beginning of wizard
  if (!tabsStatus[selectedTab]) {
    const currentTabIndex = tabs.indexOf(selectedTab);
    const nearestActiveTab = tabs
      .slice(0, currentTabIndex)
      .reverse()
      .find(t => tabsStatus[t]);

    console.log(
      `You tried to access an BatchEditListingWizard tab (${selectedTab}), which was not yet activated.`
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
          const tabTranslations = tabLabelAndSubmit(intl, tab, isNewListingFlow);
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
              routeConfiguration={routeConfiguration}
              uppy={uppy}
              files={files}
              listingFieldsOptions={listingFieldsOptions}
              onUpdateFileDetails={onUpdateFileDetails}
              onSaveBatchListing={onSaveBatchListing}
            />
          );
        })}
      </Tabs>
    </div>
  );
};

const EnhancedBatchEditListingWizard = props => {
  const routeConfiguration = useRouteConfiguration();
  const intl = useIntl();
  return <BatchEditListingWizard routeConfiguration={routeConfiguration} intl={intl} {...props} />;
};

export default withViewport(EnhancedBatchEditListingWizard);
