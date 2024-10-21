import React from 'react';
import { bool } from 'prop-types';
import { useSelector } from 'react-redux';

import PriceFilterPlain from './PriceFilterPlain';
import PriceFilterPopup from './PriceFilterPopup';

const PriceFilter = props => {
  const { showAsPopup, marketplaceCurrency, ...rest } = props;
  const { uiCurrency } = useSelector(state => state.ui);
  const listingCurrency = uiCurrency || marketplaceCurrency;

  return showAsPopup ? (
    <PriceFilterPopup marketplaceCurrency={listingCurrency} {...rest} />
  ) : (
    <PriceFilterPlain marketplaceCurrency={listingCurrency} {...rest} />
  );
};

PriceFilter.defaultProps = {
  showAsPopup: false,
};

PriceFilter.propTypes = {
  showAsPopup: bool,
};

export default PriceFilter;
