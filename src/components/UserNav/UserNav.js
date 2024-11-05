import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { FormattedMessage } from '../../util/reactIntl';
import { ACCOUNT_SETTINGS_PAGES } from '../../routing/routeConfiguration';
import { LinkTabNavHorizontal } from '..';

import css from './UserNav.module.css';

function UserNav(props) {
  const { className, rootClassName, currentPage, user } = props;
  const classes = classNames(rootClassName || css.root, className);
  const role = user?.attributes?.profile?.publicData?.role;

  const tabs = [
    ...(role !== 'customer' ? [
      {
        text: <FormattedMessage id="UserNav.yourListings" />,
        selected: currentPage === 'ManageListingsPage',
        linkProps: {
          name: 'ManageListingsPage',
        },
      }
    ] : []),
    {
      text: <FormattedMessage id="UserNav.profileSettings" />,
      selected: currentPage === 'ProfileSettingsPage',
      disabled: false,
      linkProps: {
        name: 'ProfileSettingsPage',
      },
    },
    {
      text: <FormattedMessage id="UserNav.accountSettings" />,
      selected: ACCOUNT_SETTINGS_PAGES.includes(currentPage),
      disabled: false,
      linkProps: {
        name: 'ContactDetailsPage',
      },
    },
  ];

  return (
    <LinkTabNavHorizontal className={classes} tabRootClassName={css.tab} tabs={tabs} skin="dark" />
  );
}

UserNav.defaultProps = {
  className: null,
  rootClassName: null,
};

const { string } = PropTypes;

UserNav.propTypes = {
  className: string,
  rootClassName: string,
  currentPage: string.isRequired,
};

export default UserNav;
