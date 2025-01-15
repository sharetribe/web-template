import React, { Component } from 'react';
import classNames from 'classnames';

import { FormattedMessage, injectIntl, intlShape } from '../../../util/reactIntl';
import { formatCurrencyMajorUnit } from '../../../util/currency';

import IconPlus from '../IconPlus/IconPlus';
import PriceFilterForm from '../PriceFilterForm/PriceFilterForm';

import css from './PriceFilterPlain.module.css';

const RADIX = 10;

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
  return !!priceRange && minPrice != null && maxPrice != null ? { minPrice, maxPrice } : null;
};

// Format value, which should look like { minPrice, maxPrice }
const format = (range, queryParamName) => {
  const { minPrice, maxPrice } = range || {};
  // Note: we compare to null, because 0 as minPrice is falsy in comparisons.
  const value = minPrice != null && maxPrice != null ? `${minPrice},${maxPrice}` : null;
  return { [queryParamName]: value };
};

/**
 * PriceFilterPlainComponent component
 *
 * @component
 * @param {Object} props
 * @param {string} [props.rootClassName] - Custom class that overrides the default class for the root element
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} props.id - The ID
 * @param {React.Node} props.label - The label
 * @param {Array<string>} props.queryParamNames - The query param names
 * @param {Object} props.initialValues - The initial values
 * @param {string} props.initialValues.minPrice - The price range: min
 * @param {string} props.initialValues.maxPrice - The price range: max
 * @param {number} props.min - The minimum price for the price range filter
 * @param {number} props.max - The maximum price for the price range filter
 * @param {number} props.step - The step for the price range filter
 * @param {string} props.marketplaceCurrency - The marketplace currency (e.g. 'USD')
 * @param {Function} props.onSubmit - The function to submit
 * @param {intlShape} props.intl - The intl object
 * @returns {JSX.Element}
 */
class PriceFilterPlainComponent extends Component {
  constructor(props) {
    super(props);
    this.state = { isOpen: true };

    this.handleChange = this.handleChange.bind(this);
    this.handleClear = this.handleClear.bind(this);
    this.toggleIsOpen = this.toggleIsOpen.bind(this);
  }

  handleChange(values) {
    const { onSubmit, queryParamNames } = this.props;
    const priceQueryParamName = getPriceQueryParamName(queryParamNames);
    onSubmit(format(values, priceQueryParamName));
  }

  handleClear() {
    const { onSubmit, queryParamNames } = this.props;
    const priceQueryParamName = getPriceQueryParamName(queryParamNames);
    onSubmit(format(null, priceQueryParamName));
  }

  toggleIsOpen() {
    this.setState(prevState => ({ isOpen: !prevState.isOpen }));
  }

  render() {
    const {
      rootClassName,
      className,
      id,
      label,
      queryParamNames,
      initialValues,
      min,
      max,
      step,
      intl,
      marketplaceCurrency,
    } = this.props;
    const classes = classNames(rootClassName || css.root, className);

    const priceQueryParam = getPriceQueryParamName(queryParamNames);
    const initialPrice = initialValues ? parse(initialValues[priceQueryParam]) : {};
    const { minPrice, maxPrice } = initialPrice || {};

    const hasValue = value => value != null;
    const hasInitialValues = initialValues && hasValue(minPrice) && hasValue(maxPrice);

    const labelSelection = hasInitialValues
      ? intl.formatMessage(
          { id: 'PriceFilter.labelSelectedPlain' },
          {
            minPrice: formatCurrencyMajorUnit(intl, marketplaceCurrency, minPrice),
            maxPrice: formatCurrencyMajorUnit(intl, marketplaceCurrency, maxPrice),
          }
        )
      : null;
    return (
      <div className={classes}>
        <div className={css.filterHeader}>
          <button type="button" className={css.labelButton} onClick={this.toggleIsOpen}>
            <span className={css.labelButtonContent}>
              <span className={css.labelWrapper}>
                <span className={css.label}>
                  {label}
                  {labelSelection ? (
                    <>
                      <span>{': '}</span>
                      <span className={css.labelSelected}>{labelSelection}</span>
                    </>
                  ) : null}
                </span>
              </span>
              <span className={css.openSign}>
                <IconPlus isOpen={this.state.isOpen} isSelected={hasInitialValues} />
              </span>
            </span>
          </button>
        </div>
        <div className={css.formWrapper}>
          <PriceFilterForm
            id={id}
            initialValues={hasInitialValues ? initialPrice : { minPrice: min, maxPrice: max }}
            onChange={this.handleChange}
            intl={intl}
            contentRef={node => {
              this.filterContent = node;
            }}
            min={min}
            max={max}
            step={step}
            liveEdit
            isOpen={this.state.isOpen}
            isInSideBar
            style={{ minWidth: '160px' }}
          >
            <button className={css.clearButton} onClick={this.handleClear}>
              <FormattedMessage id={'PriceFilter.clear'} />
            </button>
          </PriceFilterForm>
        </div>
      </div>
    );
  }
}

const PriceFilterPlain = injectIntl(PriceFilterPlainComponent);

export default PriceFilterPlain;
