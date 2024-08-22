import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { FormattedMessage } from '../../util/reactIntl';
import { propTypes } from '../../util/types';
import { ensureCurrentUser } from '../../util/data';

import { Button } from '../../components';

import css from './LimitedAccessBanner.module.css';

// Due to the layout structure, do not render the banner on the following pages
const disabledPages = ['SearchPage'];

const LimitedAccessBanner = props => {
  const {
    rootClassName,
    className,
    isAuthenticated,
    isLoggedInAs,
    authScopes,
    currentUser,
    onLogout,
    currentPage,
  } = props;
  const classes = classNames(rootClassName || css.root, className);
  const user = ensureCurrentUser(currentUser);

  const showBanner =
    user.id && isAuthenticated && isLoggedInAs && !disabledPages.includes(currentPage);

  const { firstName, lastName } = user.attributes.profile;

  const limitedRights = authScopes?.indexOf('user:limited') >= 0;
  const fullRights = authScopes?.indexOf('user') >= 0;

  return showBanner ? (
    <div className={classes}>
      <p className={css.text}>
        {limitedRights ? (
          <FormattedMessage id="LimitedAccessBanner.message" values={{ firstName, lastName }} />
        ) : fullRights ? (
          <FormattedMessage
            id="LimitedAccessBanner.fullRightsMessage"
            values={{ firstName, lastName }}
          />
        ) : (
          <FormattedMessage
            id="LimitedAccessBanner.fallbackMessage"
            values={{ firstName, lastName }}
          />
        )}
      </p>
      <Button rootClassName={css.button} onClick={onLogout}>
        <FormattedMessage id="LimitedAccessBanner.logout" />
      </Button>
    </div>
  ) : null;
};

LimitedAccessBanner.defaultProps = {
  rootClassName: null,
  className: null,
  currentUser: null,
  authScopes: [],
  currentPage: null,
};

const { array, bool, func, string } = PropTypes;

LimitedAccessBanner.propTypes = {
  rootClassName: string,
  className: string,
  isAuthenticated: bool.isRequired,
  isLoggedInAs: bool.isRequired,
  authScopes: array,
  currentUser: propTypes.currentUser,
  onLogout: func.isRequired,
  currentPage: string,
};

export default LimitedAccessBanner;
