import React from 'react';

import PriceFilterPlain from './PriceFilterPlain';
import PriceFilterPopup from './PriceFilterPopup';

/**
 * PriceFilter component
 *
 * @component
 * @param {Object} props
 * @param {boolean} [props.showAsPopup] - Whether to show the filter as a popup
 * @param {string} props.marketplaceCurrency - The marketplace currency (e.g. 'USD')
 * @returns {JSX.Element}
 */
const PriceFilter = props => {
  const { showAsPopup = false, marketplaceCurrency, ...rest } = props;
  return showAsPopup ? (
    <PriceFilterPopup marketplaceCurrency={marketplaceCurrency} {...rest} />
  ) : (
    <PriceFilterPlain marketplaceCurrency={marketplaceCurrency} {...rest} />
  );
};

export default PriceFilter;
