import React from 'react';
import classNames from 'classnames';

import { FormattedMessage, useIntl } from '../../../util/reactIntl';
import {
  LISTING_STATE_CLOSED,
  LISTING_STATE_DRAFT,
  LISTING_STATE_PENDING_APPROVAL,
  LISTING_STATE_PUBLISHED,
} from '../../../util/types';
import { isBookingProcessAlias } from '../../../transactions/transaction';

import { InlineTextButton, Menu, MenuContent, MenuItem, MenuLabel } from '../../../components';

import MenuIcon from './MenuIcon';
import css from './CardMenu.module.css';

const MENU_CONTENT_OFFSET = -12;
const MOBILE_MAX_WIDTH = 550;

const isOutOfStock = listing => {
  const state = listing?.attributes?.state;
  const publicData = listing?.attributes?.publicData;
  const isBookable = isBookingProcessAlias(publicData.transactionProcessAlias);
  const currentStock = listing?.currentStock?.attributes?.quantity;
  return !isBookable && currentStock === 0 && state === LISTING_STATE_PUBLISHED;
};

/**
 * Returns an array of menu item keys that are relevant for the given listing state.
 * If the array is empty, the menu should not be shown.
 *
 * @param {Object} listing - Listing entity (ownListing)
 * @returns {string[]} relevant menu item keys
 */
const getMenuItems = listing => {
  const state = listing?.attributes?.state;
  const isClosed = state === LISTING_STATE_CLOSED;
  const isDraft = state === LISTING_STATE_DRAFT;
  const isPendingApproval = state === LISTING_STATE_PENDING_APPROVAL;

  // Currently, we only show "close listing" for active listings
  if (!listing || isDraft || isClosed || isPendingApproval || isOutOfStock(listing)) {
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
  const menuItems = getMenuItems(listing);

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
            ariaLabel={intl.formatMessage(
              {
                id: 'ManageListingCard.screenreader.menu',
              },
              { title: listing.attributes.title }
            )}
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
