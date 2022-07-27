import React, { Component } from 'react';
import { arrayOf, func, node, number, shape, string } from 'prop-types';
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

PriceFilterPlainComponent.defaultProps = {
  rootClassName: null,
  className: null,
  initialValues: null,
  step: number,
};

PriceFilterPlainComponent.propTypes = {
  rootClassName: string,
  className: string,
  id: string.isRequired,
  label: node,
  queryParamNames: arrayOf(string).isRequired,
  onSubmit: func.isRequired,
  initialValues: shape({
    price: string,
  }),
  min: number.isRequired,
  max: number.isRequired,
  step: number,
  marketplaceCurrency: string.isRequired,

  // form injectIntl
  intl: intlShape.isRequired,
};

const PriceFilterPlain = injectIntl(PriceFilterPlainComponent);

export default PriceFilterPlain;
