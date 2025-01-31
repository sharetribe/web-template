import React, { useEffect, useMemo } from 'react';
import { useRouteConfiguration } from '../../../context/routeConfigurationContext';
import { useIntl } from '../../../util/reactIntl';
import { LISTING_PAGE_PARAM_TYPE_NEW } from '../../../util/urlHelpers';
import { withViewport } from '../../../util/uiHelpers';

import { NamedRedirect, Tabs } from '../../../components';

import BatchEditListingWizardTab, { PRODUCT_DETAILS, UPLOAD } from './BatchEditListingWizardTab';
import css from './BatchEditListingWizard.module.css';
import {
  getCreateListingsSuccess,
  getFailedListings,
  getListings,
  getUppyInstance,
  initializeUppy,
} from '../BatchEditListingPage.duck';
import { useDispatch, useSelector } from 'react-redux';
import { BatchEditListingResult } from './BatchEditListingResult/BatchEditListingResult';

function getTabsStatus(fileCount) {
  return {
    [UPLOAD]: true,
    [PRODUCT_DETAILS]: fileCount > 0,
  };
}

const BatchEditListingWizard = props => {
  const {
    id = '',
    params = { id: '', type: LISTING_PAGE_PARAM_TYPE_NEW, tab: UPLOAD },
    viewport = { width: 0 },
    intl,
    currentUser = {},
    routeConfiguration = {},
    history,
    ...rest
  } = props;
  const listings = useSelector(getListings);
  const hasFiles = listings.length;

  const selectedTab = params.tab;
  const tabs = [UPLOAD, PRODUCT_DETAILS];
  const tabsStatus = useMemo(() => getTabsStatus(hasFiles), [hasFiles]);
  const publishListingsSuccess = useSelector(getCreateListingsSuccess);
  const failedListings = useSelector(getFailedListings);
  const uppyInstance = useSelector(getUppyInstance);
  const hasErrors = failedListings.length > 0;

  const dispatch = useDispatch();

  useEffect(() => {
    if (currentUser.id?.uuid && !uppyInstance) {
      dispatch(initializeUppy({ userId: currentUser.id?.uuid }));
    }
  }, [currentUser.id, dispatch]);

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

  if (publishListingsSuccess || hasErrors) {
    return <BatchEditListingResult routeConfiguration={routeConfiguration} history={history} />;
  }

  return (
    <div className={css.root}>
      <Tabs rootClassName={css.tabsContainer} navRootClassName={css.nav} tabRootClassName={css.tab}>
        {tabs.map(tab => {
          const tabLabelId =
            tab === UPLOAD
              ? 'BatchEditListingWizard.tabLabelUpload'
              : 'BatchEditListingWizard.tabLabelDetails';
          const tabLabel = intl.formatMessage({ id: tabLabelId });

          return (
            <BatchEditListingWizardTab
              {...rest}
              key={tab}
              tabId={`${id}_${tab}`}
              tabLabel={tabLabel}
              tabLinkProps={tabLink(tab)}
              selected={selectedTab === tab}
              disabled={!tabsStatus[tab]}
              tab={tab}
              params={params}
              routeConfiguration={routeConfiguration}
              uppy={uppyInstance}
              history={history}
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
