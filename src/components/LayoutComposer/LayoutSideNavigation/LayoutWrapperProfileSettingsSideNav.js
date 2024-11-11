import React from 'react';
import { bool, node, string } from 'prop-types';

import { FormattedMessage } from '../../../util/reactIntl';

import { TabNav } from '../../../components';

import css from './LayoutSideNavigation.module.css';

const LayoutWrapperProfileSettingsSideNav = props => {
  const { currentPage, withCreativeProfile } = props;
  const isProfileSettingsPage = currentPage === 'ProfileSettingsPage';
  const isCreativeDetailsPage = currentPage === 'CreativeDetailsPage';
  const tabs = [
    {
      text: <FormattedMessage id="ProfileSettingsPage.profileSettingsTabTitle" />,
      selected: isProfileSettingsPage,
      id: 'ProfileSettingsPageTab',
      linkProps: {
        name: 'ProfileSettingsPage',
      },
    },
    ...(withCreativeProfile
      ? [
          {
            text: <FormattedMessage id="ProfileSettingsPage.creativeDetailsTabTitle" />,
            selected: isCreativeDetailsPage,
            id: 'CreativeDetailsPageTab',
            linkProps: {
              name: 'CreativeDetailsPage',
            },
          },
        ]
      : []),
  ];

  return <TabNav rootClassName={css.tabs} tabRootClassName={css.tab} tabs={tabs} />;
};

LayoutWrapperProfileSettingsSideNav.defaultProps = {
  className: null,
  rootClassName: null,
  children: null,
  currentPage: null,
  withCreativeProfile: false,
};

LayoutWrapperProfileSettingsSideNav.propTypes = {
  children: node,
  className: string,
  rootClassName: string,
  currentPage: string,
  withCreativeProfile: bool,
};

export default LayoutWrapperProfileSettingsSideNav;
