import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';
import classNames from 'classnames';

import { useRouteConfiguration } from '../../context/routeConfigurationContext';
import { useIntl } from '../../util/reactIntl';
import { createResourceLocatorString } from '../../util/routes';
import { getSavedListingIds, toggleSavedListing } from '../../ducks/user.duck';

import IconHeart from './IconHeart';
import css from './SaveListingButton.module.css';

/**
 * Heart button that saves a listing to (or removes it from) the current user's saved listings.
 * Logged-out users are sent to the login page and returned to the current page afterwards.
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @param {string} props.listingId listing id as a string (uuid)
 * @returns {JSX.Element} save button
 */
const SaveListingButton = props => {
  const { className, rootClassName, listingId } = props;
  const intl = useIntl();
  const dispatch = useDispatch();
  const history = useHistory();
  const location = useLocation();
  const routes = useRouteConfiguration();

  const isAuthenticated = useSelector(state => state.auth.isAuthenticated);
  const currentUser = useSelector(state => state.user.currentUser);
  const isSaved = getSavedListingIds(currentUser).includes(listingId);

  if (!listingId) {
    return null;
  }

  const handleClick = e => {
    // The button can sit on top of a listing card link
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      const state = { from: `${location.pathname}${location.search}${location.hash}` };
      history.push(createResourceLocatorString('LoginPage', routes, {}, {}), state);
      return;
    }
    if (currentUser) {
      dispatch(toggleSavedListing(listingId));
    }
  };

  const label = intl.formatMessage({
    id: isSaved ? 'SaveListingButton.unsave' : 'SaveListingButton.save',
  });

  return (
    <button
      type="button"
      className={classNames(rootClassName || css.root, className, { [css.saved]: isSaved })}
      onClick={handleClick}
      aria-pressed={isSaved}
      aria-label={label}
      title={label}
    >
      <IconHeart className={css.icon} filled={isSaved} />
    </button>
  );
};

export default SaveListingButton;
