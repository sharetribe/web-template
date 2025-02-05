import React, { useMemo } from 'react';
import { useRouteConfiguration } from '../../../context/routeConfigurationContext';
import { useIntl } from '../../../util/reactIntl';
import { LISTING_PAGE_PARAM_TYPE_NEW } from '../../../util/urlHelpers';
import { withViewport } from '../../../util/uiHelpers';

import { Tabs } from '../../../components';

import { DETAILS, EditPortfolioListingWizardTab, ITEMS } from './EditPortfolioListingWizardTab';
import css from './EditPortfolioListingWizard.module.css';
import classNames from 'classnames';
import { useConfiguration } from '../../../context/configurationContext';
import { useSelector } from 'react-redux';

function getTabsStatus(portfolioListing) {
  return {
    [DETAILS]: true,
    [ITEMS]: !!(portfolioListing && portfolioListing.id),
  };
}

const EditPortfolioListingWizard = props => {
  const {
    id = '',
    params = { id: '', type: LISTING_PAGE_PARAM_TYPE_NEW, tab: DETAILS },
    viewport = { width: 0 },
    intl,
    currentUser = {},
    routeConfiguration = {},
    history,
    className,
    config,
    currentListing = null,
    ...rest
  } = props;
  const selectedTab = params.tab;
  const tabs = [DETAILS, ITEMS];
  const isLoading = useSelector(state => state.EditPortfolioListingPage.loading);
  const tabsStatus = useMemo(() => getTabsStatus(currentListing), [currentListing]);

  const tabLink = tab => {
    return { name: 'EditPortfolioListingPage', params: { ...params, tab } };
  };

  return (
    <div className={classNames(css.root, className)}>
      <Tabs rootClassName={css.tabsContainer} navRootClassName={css.nav} tabRootClassName={css.tab}>
        {tabs.map(tab => {
          const tabLabel = tab === DETAILS ? 'Details' : 'Items';

          return (
            <EditPortfolioListingWizardTab
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
              history={history}
              config={config}
              isLoading={isLoading}
            />
          );
        })}
      </Tabs>
    </div>
  );
};

const EnhancedEditPortfolioListingWizard = props => {
  const routeConfiguration = useRouteConfiguration();
  const config = useConfiguration();
  const intl = useIntl();
  return (
    <EditPortfolioListingWizard
      routeConfiguration={routeConfiguration}
      intl={intl}
      config={config}
      {...props}
    />
  );
};

export default withViewport(EnhancedEditPortfolioListingWizard);
