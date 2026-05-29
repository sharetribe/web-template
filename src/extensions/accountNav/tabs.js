import React from 'react';
import { FormattedMessage } from '../../util/reactIntl';

/**
 * Returns the ordered tab list for the account settings side nav.
 *
 * @param {Object} params
 * @param {string} params.currentPage - Active page name (e.g. 'ProfileSettingsPage')
 * @param {boolean} params.showPaymentMethods
 * @param {boolean} params.showPayoutDetails
 * @returns {Array} Tab config objects for TabNav
 */
export const getAccountSettingsTabs = ({
  currentPage,
  showPaymentMethods,
  showPayoutDetails,
  userType,
}) => {
  const profileTabLabelId =
    userType === 'vendedor-tienda'
      ? 'LayoutWrapperAccountSettingsSideNav.profileTabTitleTienda'
      : 'LayoutWrapperAccountSettingsSideNav.profileTabTitle';
  const payoutDetailsMaybe = showPayoutDetails
    ? [
        {
          text: <FormattedMessage id="LayoutWrapperAccountSettingsSideNav.paymentsTabTitle" />,
          selected: currentPage === 'StripePayoutPage',
          id: 'StripePayoutPageTab',
          linkProps: { name: 'StripePayoutPage' },
        },
      ]
    : [];

  const paymentMethodsMaybe = showPaymentMethods
    ? [
        {
          text: (
            <FormattedMessage id="LayoutWrapperAccountSettingsSideNav.paymentMethodsTabTitle" />
          ),
          selected: currentPage === 'PaymentMethodsPage',
          id: 'PaymentMethodsPageTab',
          linkProps: { name: 'PaymentMethodsPage' },
        },
      ]
    : [];

  return [
    {
      text: <FormattedMessage id={profileTabLabelId} />,
      selected: currentPage === 'ProfileSettingsPage',
      id: 'ProfileSettingsPageTab',
      linkProps: { name: 'ProfileSettingsPage' },
    },
    {
      text: <FormattedMessage id="LayoutWrapperAccountSettingsSideNav.contactDetailsTabTitle" />,
      selected: currentPage === 'ContactDetailsPage',
      id: 'ContactDetailsPageTab',
      linkProps: { name: 'ContactDetailsPage' },
    },
    {
      text: <FormattedMessage id="LayoutWrapperAccountSettingsSideNav.passwordTabTitle" />,
      selected: currentPage === 'PasswordChangePage',
      id: 'PasswordChangePageTab',
      linkProps: { name: 'PasswordChangePage' },
    },
    ...payoutDetailsMaybe,
    ...paymentMethodsMaybe,
    {
      text: <FormattedMessage id="LayoutWrapperAccountSettingsSideNav.manageAccountTabTitle" />,
      selected: currentPage === 'ManageAccountPage',
      id: 'ManageAccountPageTab',
      linkProps: { name: 'ManageAccountPage' },
    },
  ];
};
