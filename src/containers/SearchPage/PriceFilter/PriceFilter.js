import React from 'react';
import { useIntl } from '../../../util/reactIntl';
import { formatCurrencyMajorUnit } from '../../../util/currency';

import IntegerRangeFilter from '../IntegerRangeFilter/IntegerRangeFilter';

const RADIX = 10;

const hasValue = value => value != null;

const getPriceQueryParamName = queryParamNames => {
  return Array.isArray(queryParamNames)
    ? queryParamNames[0]
    : typeof queryParamNames === 'string'
    ? queryParamNames
    : 'price';
};

// Parse value, which should look like "0,1000"
const parse = priceRange => {
  const [minPrice, maxPrice] = !!priceRange
    ? priceRange.split(',').map(v => Number.parseInt(v, RADIX))
    : [];
  // Note: we compare to null, because 0 as minPrice is falsy in comparisons.
  return !!priceRange && hasValue(minPrice) && hasValue(maxPrice) ? { minPrice, maxPrice } : null;
};

/**
 * PriceFilter component
 *
 * @component
 * @param {Object} props
 * @param {boolean} [props.showAsPopup] - Whether to show the filter as a popup
 * @param {string} props.marketplaceCurrency - The marketplace currency (e.g. 'USD')
 * @param {intlShape} props.intl - The intl object
 * @returns {JSX.Element}
 */
const PriceFilter = props => {
  const { marketplaceCurrency, label, initialValues, queryParamNames, ...rest } = props;
  const intl = useIntl();

  // Format function to convert minValue and maxValue to currency strings
  const formatValidRangeValues = rangeValues => {
    const { minValue, maxValue } = rangeValues;
    return hasValue(minValue) && hasValue(maxValue)
      ? {
          minValue: formatCurrencyMajorUnit(intl, marketplaceCurrency, minValue),
          maxValue: formatCurrencyMajorUnit(intl, marketplaceCurrency, maxValue),
        }
      : {};
  };

  const priceQueryParam = getPriceQueryParamName(queryParamNames);
  const initialPrice = initialValues?.[priceQueryParam]
    ? parse(initialValues[priceQueryParam])
    : {};
  const { minPrice, maxPrice } = initialPrice || {};

  const hasInitialValues = initialValues && hasValue(minPrice) && hasValue(maxPrice);

  const currentLabel =
    hasInitialValues && rest.showAsPopup
      ? intl.formatMessage(
          { id: 'PriceFilter.labelSelectedButton' },
          {
            minPrice: formatCurrencyMajorUnit(intl, marketplaceCurrency, minPrice),
            maxPrice: formatCurrencyMajorUnit(intl, marketplaceCurrency, maxPrice),
          }
        )
      : label;

  const getLabelForRangeInput = (priceInMajorUnit, handleName) => {
    const formattedPrice = formatCurrencyMajorUnit(intl, marketplaceCurrency, priceInMajorUnit);
    return intl.formatMessage(
      { id: 'PriceFilter.screenreader.rangeHandle' },
      { formattedPrice, currency: marketplaceCurrency, handle: handleName }
    );
  };

  return (
    <IntegerRangeFilter
      label={currentLabel}
      initialValues={initialValues}
      formatValidRangeValues={formatValidRangeValues}
      queryParamNames={queryParamNames}
      getLabelForRangeInput={getLabelForRangeInput}
      {...rest}
    />
  );
};

export default PriceFilter;
