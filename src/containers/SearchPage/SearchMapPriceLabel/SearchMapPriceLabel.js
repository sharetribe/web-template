import React, { Component } from 'react';
import classNames from 'classnames';

import { injectIntl, intlShape } from '../../../util/reactIntl';
import { propTypes } from '../../../util/types';
import { formatMoney } from '../../../util/currency';
import { ensureListing } from '../../../util/data';

import css from './SearchMapPriceLabel.module.css';

/**
 * SearchMapPriceLabel component
 * TODO: change to functional component
 *
 * @component
 * @param {Object} props
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} [props.rootClassName] - Custom class that extends the default class for the root element
 * @param {propTypes.listing} props.listing - The listing
 * @param {Function} props.onListingClicked - The function to handle the listing click
 * @param {Object} props.config - The configuration
 * @param {intlShape} props.intl - The intl object
 * @returns {JSX.Element}
 */
class SearchMapPriceLabel extends Component {
  shouldComponentUpdate(nextProps) {
    const currentListing = ensureListing(this.props.listing);
    const nextListing = ensureListing(nextProps.listing);
    const isSameListing = currentListing.id.uuid === nextListing.id.uuid;
    const hasSamePrice = currentListing.attributes.price === nextListing.attributes.price;
    const hasSameActiveStatus = this.props.isActive === nextProps.isActive;
    const hasSameRefreshToken =
      this.props.mapComponentRefreshToken === nextProps.mapComponentRefreshToken;

    return !(isSameListing && hasSamePrice && hasSameActiveStatus && hasSameRefreshToken);
  }

  render() {
    const {
      className,
      rootClassName,
      intl,
      listing,
      onListingClicked,
      isActive,
      config,
    } = this.props;
    const currentListing = ensureListing(listing);
    const { price } = currentListing.attributes;

    // Create formatted price if currency is known or alternatively show just the unknown currency.
    const formattedPrice =
      price && price.currency === config.currency
        ? formatMoney(intl, price)
        : price?.currency
        ? price.currency
        : null;

    const classes = classNames(rootClassName || css.root, className);
    const priceLabelClasses = classNames(css.priceLabel, {
      [css.mapLabelActive]: isActive,
      [css.noPriceSetLabel]: !formattedPrice,
    });
    const caretClasses = classNames(css.caret, { [css.caretActive]: isActive });

    return (
      <button className={classes} onClick={() => onListingClicked(currentListing)}>
        <div className={css.caretShadow} />
        <div className={priceLabelClasses}>{formattedPrice}</div>
        <div className={caretClasses} />
      </button>
    );
  }
}

export default injectIntl(SearchMapPriceLabel);
