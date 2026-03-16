import React from 'react';
import classNames from 'classnames';

import {
  LISTING_STATE_CLOSED,
  LISTING_STATE_DRAFT,
  LISTING_STATE_PENDING_APPROVAL,
} from '../../../util/types';
import { FormattedMessage, useIntl } from '../../../util/reactIntl';
import { InlineTextButton, Menu, MenuContent, MenuItem, MenuLabel } from '../../../components';

import MenuIcon from './MenuIcon';
import css from './CardMenu.module.css';

const MENU_CONTENT_OFFSET = -12;
const MOBILE_MAX_WIDTH = 550;

/**
 * Returns an array of menu item keys that are relevant for the given listing state.
 * If the array is empty, the menu should not be shown.
 *
 * @param {string} state - Listing state (listing.attributes.state)
 * @returns {string[]} relevant menu item keys
 */
const getMenuItemsForState = state => {
  const isClosed = state === LISTING_STATE_CLOSED;
  const isDraft = state === LISTING_STATE_DRAFT;
  const isPendingApproval = state === LISTING_STATE_PENDING_APPROVAL;

  // Currently, we only show "close listing" for active listings
  if (isDraft || isClosed || isPendingApproval) {
    return [];
  }

  return ['close-listing'];
};

/**
 * Card menu for manage listing card.
 * Only shows the "close listing" menu item for active listings at the moment.
 *
 * @param {Object} props
 * @param {boolean} props.isMenuOpen - Whether the menu is open
 * @param {Object} props.listing - The listing (own listing)
 * @param {Object} [props.inProgressListingId] - The actions in progress for the listing
 * @param {function} props.onToggleMenu - The function to toggle the menu
 * @param {function} props.onCloseListing - The function to close the listing
 * @returns {JSX.Element|null}
 */
const CardMenu = props => {
  const { isMenuOpen, listing, inProgressListingId, onToggleMenu, onCloseListing } = props;
  const intl = useIntl();

  const state = listing?.attributes?.state;
  const menuItems = getMenuItemsForState(state);

  if (menuItems.length === 0) {
    return null;
  }

  const menuItemClasses = classNames(css.menuItem, {
    [css.menuItemDisabled]: !!inProgressListingId,
  });

  return (
    <div className={css.menubarWrapper}>
      <div className={css.menubarGradient} />
      <div className={css.menubar}>
        <Menu
          contentPlacementOffset={MENU_CONTENT_OFFSET}
          mobileMaxWidth={MOBILE_MAX_WIDTH}
          contentPosition="left"
          useArrow={false}
          onToggleActive={isOpen => {
            const listingOpen = isOpen ? listing : null;
            onToggleMenu(listingOpen);
          }}
          isOpen={isMenuOpen}
        >
          <MenuLabel
            className={css.menuLabel}
            isOpenClassName={css.listingMenuIsOpen}
            ariaLabel={intl.formatMessage({
              id: 'ManageListingCard.screenreader.menu',
            })}
          >
            <div className={css.iconWrapper}>
              <MenuIcon className={css.menuIcon} isActive={isMenuOpen} />
            </div>
          </MenuLabel>
          <MenuContent rootClassName={css.menuContent}>
            {menuItems.map(itemKey => {
              if (itemKey === 'close-listing') {
                return (
                  <MenuItem key={itemKey}>
                    <InlineTextButton
                      rootClassName={menuItemClasses}
                      onClick={event => {
                        event.preventDefault();
                        event.stopPropagation();
                        if (!inProgressListingId) {
                          onToggleMenu(null);
                          onCloseListing(listing.id);
                        }
                      }}
                    >
                      <FormattedMessage id="ManageListingCard.closeListing" />
                    </InlineTextButton>
                  </MenuItem>
                );
              }

              return null;
            })}
          </MenuContent>
        </Menu>
      </div>
    </div>
  );
};

export default CardMenu;
