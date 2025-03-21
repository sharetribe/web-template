import React, { Component } from 'react';
import classNames from 'classnames';

import { propTypes } from '../../../util/types';

import css from './SearchMapGroupLabel.module.css';

/**
 * SearchMapGroupLabel component
 *
 * @component
 * @param {Object} props
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} [props.rootClassName] - Custom class that extends the default class for the root element
 * @param {Array<propTypes.listing>} props.listings - The listings
 * @param {Function} props.onListingClicked - The function to handle the listing click
 * @param {boolean} [props.isActive] - The active status
 * @param {string} [props.mapComponentRefreshToken] - The map component refresh token
 * @returns {JSX.Element}
 */
class SearchMapGroupLabel extends Component {
  shouldComponentUpdate(nextProps) {
    const hasSameAmountOfListings = nextProps.listings.length === this.props.listings.length;
    const hasSameActiveStatus = this.props.isActive === nextProps.isActive;
    const hasSameRefreshToken =
      this.props.mapComponentRefreshToken === nextProps.mapComponentRefreshToken;

    return !(hasSameAmountOfListings && hasSameActiveStatus && hasSameRefreshToken);
  }

  render() {
    const { className, rootClassName, listings, onListingClicked, isActive } = this.props;
    const classes = classNames(rootClassName || css.root, className);
    const countLabelClasses = classNames(css.details, { [css.detailsActive]: isActive });
    const caretClasses = classNames(css.caret, { [css.caretActive]: isActive });

    return (
      <button className={classes} onClick={() => onListingClicked(listings)}>
        <div className={css.caretShadow} />
        <div className={countLabelClasses}>{listings.length}</div>
        <div className={caretClasses} />
      </button>
    );
  }
}

export default SearchMapGroupLabel;
