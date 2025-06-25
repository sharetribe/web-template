import React from 'react';

import { FormattedMessage } from '../../../util/reactIntl';

import { TabNav } from '../../../components';

import css from './LayoutSideNavigation.module.css';

/**
 * Side nav with navigation to different account settings.
 *
 * @component
 * @param {Object} props
 * @param {Object} props.accountSettingsNavProps
 * @param {string?} props.accountSettingsNavProps.currentPage
 * @param {boolean?} props.withCreativeProfile
 * @returns {JSX.Element} Side nav with navigation to different account settings
 */
const LayoutWrapperProfileSettingsSideNav = ({ accountSettingsNavProps, withCreativeProfile = false }) => {
  const { currentPage } = accountSettingsNavProps;
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

export default LayoutWrapperProfileSettingsSideNav;
