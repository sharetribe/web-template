import React from 'react';
import { useIntl } from '../../util/reactIntl';
import { formatMoney } from '../../util/currency';
import { types as sdkTypes } from '../../util/sdkLoader';
import { getShippingPrice } from '../../config/configAVShipping';
import css from './AVShippingTypeSelector.module.css';

const { Money } = sdkTypes;

/**
 * Radio-card selector for AV delivery types. Buyer-facing, checkout step 1.
 * @param {('S'|'M'|'L')} size listing package size
 * @param {string[]} availableTypes delivery types to offer (already gated/priced)
 * @param {string|null} selectedType currently selected type
 * @param {Function} onSelect called with the chosen type
 * @param {string} currency listing currency
 */
const AVShippingTypeSelector = props => {
  const { size, availableTypes, selectedType, onSelect, currency } = props;
  const intl = useIntl();

  if (!availableTypes || availableTypes.length === 0) {
    return (
      <p className={css.empty}>{intl.formatMessage({ id: 'AVShippingTypeSelector.noOptions' })}</p>
    );
  }

  return (
    <fieldset className={css.root}>
      <legend className={css.legend}>
        {intl.formatMessage({ id: 'AVShippingTypeSelector.legend' })}
      </legend>
      {availableTypes.map(type => {
        const price = getShippingPrice(size, type);
        const priceLabel = price != null ? formatMoney(intl, new Money(price, currency)) : '';
        const id = `avShippingType_${type}`;
        return (
          <label key={type} className={css.card} htmlFor={id}>
            <input
              id={id}
              type="radio"
              name="avShippingType"
              value={type}
              checked={selectedType === type}
              onChange={() => onSelect(type)}
              className={css.radio}
            />
            <span className={css.typeLabel}>
              {intl.formatMessage({ id: `AVShippingTypeSelector.type.${type}` })}
            </span>
            <span className={css.price}>{priceLabel}</span>
          </label>
        );
      })}
    </fieldset>
  );
};

export default AVShippingTypeSelector;
