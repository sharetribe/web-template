import React, { useEffect, useMemo } from 'react';
import { useRouteConfiguration } from '../../../context/routeConfigurationContext';
import { useIntl } from '../../../util/reactIntl';
import { LISTING_PAGE_PARAM_TYPE_NEW } from '../../../util/urlHelpers';
import { withViewport } from '../../../util/uiHelpers';

import { NamedRedirect, Tabs } from '../../../components';

import BatchEditListingWizardTab, { PRODUCT_DETAILS, UPLOAD } from './BatchEditListingWizardTab';
import css from './BatchEditListingWizard.module.css';
import {
  getCreateListingsError,
  getCreateListingsSuccess,
  getListings,
  getPublishingData,
  getUppyInstance,
  initializeUppy,
  RESET_STATE,
} from '../BatchEditListingPage.duck';
import { useDispatch, useSelector } from 'react-redux';
import { Button, notification, Result } from 'antd';
import { createResourceLocatorString } from '../../../util/routes';
import * as PropTypes from 'prop-types';
import { useParams } from 'react-router-dom';

function getTabsStatus(fileCount) {
  return {
    [UPLOAD]: true,
    [PRODUCT_DETAILS]: fileCount > 0,
  };
}

function BatchEditListingResult(props) {
  const { routeConfiguration, history } = props;
  const dispatch = useDispatch();
  const { failedListings, successfulListings, selectedRowsKeys } = useSelector(getPublishingData);
  const { category: currentCategory } = useParams();

  const { status, title, subtitle } = useMemo(() => {
    if (successfulListings.length > 0 && failedListings.length > 0) {
      return {
        status: 'warning',
        title: 'Some listings failed to publish',
        subtitle: 'Please check the listings and try again.',
      };
    }

    if (successfulListings.length === selectedRowsKeys.length) {
      return {
        status: 'success',
        title: 'All Set! Listings Submitted for Review',
        subtitle:
          'Thank you for submitting your listings. Our team will review them shortly. You can check the status in your dashboard.',
      };
    }

    return {
      status: 'error',
      title: 'All listings failed to publish',
      subtitle: 'Please check the listings and try again.',
    };
  }, [successfulListings, failedListings, selectedRowsKeys]);

  const redirectTo = (destination = 'ManageListingsPage', params = {}) => {
    dispatch({ type: RESET_STATE });
    const to = createResourceLocatorString(destination, routeConfiguration, params);
    history.push(to);
  };

  return (
    <Result
      className={css.results}
      status={status}
      title={title}
      subTitle={subtitle}
      extra={[
        <Button type="primary" key="console" onClick={() => redirectTo('ManageListingsPage')}>
          View listings
        </Button>,
      ]}
    />
  );
}

BatchEditListingResult.propTypes = { publishListingsSuccess: PropTypes.any };
const BatchEditListingWizard = props => {
  const {
    id = '',
    params = { id: '', type: LISTING_PAGE_PARAM_TYPE_NEW, tab: UPLOAD },
    viewport = { width: 0 },
    intl,
    currentUser = {},
    routeConfiguration = {},
    onSaveBatchListing,
    history,
    ...rest
  } = props;
  const listings = useSelector(getListings);
  const hasFiles = listings.length;

  const selectedTab = params.tab;
  const tabs = [UPLOAD, PRODUCT_DETAILS];
  const tabsStatus = useMemo(() => getTabsStatus(hasFiles), [hasFiles]);
  const publishListingsSuccess = useSelector(getCreateListingsSuccess);
  const publishListingError = useSelector(getCreateListingsError);
  const uppyInstance = useSelector(getUppyInstance);

  const [api, contextHolder] = notification.useNotification();
  const dispatch = useDispatch();

  useEffect(() => {
    if (currentUser.id?.uuid && !uppyInstance) {
      dispatch(initializeUppy({ userId: currentUser.id?.uuid }));
    }
  }, [currentUser.id, dispatch]);

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

  if (publishListingsSuccess || publishListingError) {
    return <BatchEditListingResult routeConfiguration={routeConfiguration} history={history} />;
  }

  return (
    <div className={css.root}>
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
              uppy={uppyInstance}
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
