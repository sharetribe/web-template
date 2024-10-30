import React, { useEffect, useMemo } from 'react';
import classNames from 'classnames';
import { useRouteConfiguration } from '../../../context/routeConfigurationContext';
import { useIntl } from '../../../util/reactIntl';
import { LISTING_PAGE_PARAM_TYPE_NEW } from '../../../util/urlHelpers';
import { withViewport } from '../../../util/uiHelpers';

import { NamedRedirect, Tabs } from '../../../components';

import BatchEditListingWizardTab, { PRODUCT_DETAILS, UPLOAD } from './BatchEditListingWizardTab';
import css from './BatchEditListingWizard.module.css';
import { createResourceLocatorString } from '../../../util/routes';
import {
  getCreateListingsError,
  getCreateListingsSuccess,
  RESET_STATE,
} from '../BatchEditListingPage.duck';
import { useDispatch, useSelector } from 'react-redux';
import { notification } from 'antd';

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
    onSaveBatchListing,
    history,
    ...rest
  } = props;
  const fileCount = uppy.getFiles().length;
  const selectedTab = params.tab;
  const rootClasses = rootClassName || css.root;
  const classes = classNames(rootClasses, className);
  const tabs = [UPLOAD, PRODUCT_DETAILS];
  const tabsStatus = useMemo(() => getTabsStatus(fileCount), [fileCount]);
  const publishListingsSuccess = useSelector(getCreateListingsSuccess);
  const publishListingError = useSelector(getCreateListingsError);
  const [api, contextHolder] = notification.useNotification();
  const dispatch = useDispatch();

  useEffect(() => {
    if (publishListingsSuccess) {
      dispatch({ type: RESET_STATE });
      const to = createResourceLocatorString('ManageListingsPage', routeConfiguration);
      history.push(to);
    }
  }, [publishListingsSuccess]);

  useEffect(() => {
    if (publishListingError) {
      api.error({
        message: 'Error',
        description: 'One or more listings failed to publish. Please try again.',
      });
    }
  }, [publishListingError]);

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
      {contextHolder}
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
              uppy={uppy}
              onSaveBatchListing={onSaveBatchListing}
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
