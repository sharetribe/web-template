import React, { useState } from 'react';
import { Field } from 'react-final-form';
import classNames from 'classnames';

import { useIntl } from '../../../../../util/reactIntl';
import { OutsideClickHandler, RangeSlider } from '../../../../../components';

import css from './FilterBudget.module.css';

export const PRICE_MIN = 0;
export const PRICE_MAX = 10000;
export const PRICE_STEP = 50;

const formatPrice = (value, intl) =>
  intl.formatNumber(value, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const formatBudget = (value, intl) =>
  value >= PRICE_MAX ? `$${PRICE_MAX.toLocaleString()}+` : formatPrice(value, intl);

const IconBudget = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M16 12h2" />
    <path d="M2 10h20" />
  </svg>
);

const FilterBudget = props => {
  const [isOpen, setIsOpen] = useState(false);
  const { className, rootClassName, alignLeft } = props;
  const intl = useIntl();
  const classes = classNames(rootClassName || css.root, className);

  return (
    <Field name="price">
      {({ input }) => {
        const { minValue = PRICE_MIN, maxValue = PRICE_MAX } = input.value || {};
        const hasSelection = minValue > PRICE_MIN || maxValue < PRICE_MAX;

        // Always show the full range when a selection has been made
        const toggleLabel = hasSelection
          ? `${formatPrice(minValue, intl)} – ${formatBudget(maxValue, intl)}/mo`
          : intl.formatMessage({ id: 'PageBuilder.SearchCTA.budgetFilterPlaceholder' });

        const labelClasses = classNames(css.label, { [css.active]: hasSelection || isOpen });

        const handleSliderChange = handles => {
          input.onChange({ minValue: handles[0], maxValue: handles[1] });
        };

        return (
          <OutsideClickHandler className={classes} onOutsideClick={() => setIsOpen(false)}>
            <div
              role="button"
              className={css.toggleButton}
              onClick={() => setIsOpen(prev => !prev)}
              tabIndex={0}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setIsOpen(prev => !prev);
                }
              }}
              aria-expanded={isOpen}
            >
              <IconBudget className={css.iconBudget} />
              <span className={labelClasses}>{toggleLabel}</span>
            </div>

            {isOpen ? (
              <div className={classNames(css.dropdown, { [css.alignLeft]: alignLeft })}>
                <div className={css.rangeLabels}>
                  <div className={css.rangeItem}>
                    <span className={css.rangeItemHeading}>
                      {intl.formatMessage({ id: 'PageBuilder.SearchCTA.budgetMin' })}
                    </span>
                    <span className={css.rangeItemValue}>
                      {formatPrice(minValue, intl)}
                    </span>
                  </div>
                  <div className={classNames(css.rangeItem, css.rangeItemRight)}>
                    <span className={css.rangeItemHeading}>
                      {intl.formatMessage({ id: 'PageBuilder.SearchCTA.budgetMax' })}
                    </span>
                    <span className={css.rangeItemValue}>
                      {formatBudget(maxValue, intl)}
                    </span>
                  </div>
                </div>
                <div className={css.sliderWrapper}>
                  <RangeSlider
                    min={PRICE_MIN}
                    max={PRICE_MAX}
                    step={PRICE_STEP}
                    handles={[minValue, maxValue]}
                    ariaLabels={[
                      intl.formatMessage(
                        { id: 'PageBuilder.SearchCTA.budgetMinAriaLabel' },
                        { value: minValue }
                      ),
                      intl.formatMessage(
                        { id: 'PageBuilder.SearchCTA.budgetMaxAriaLabel' },
                        { value: maxValue }
                      ),
                    ]}
                    onChange={handleSliderChange}
                  />
                </div>
                {hasSelection ? (
                  <button
                    className={css.clearButton}
                    onClick={() => input.onChange({ minValue: PRICE_MIN, maxValue: PRICE_MAX })}
                  >
                    {intl.formatMessage({ id: 'PageBuilder.SearchCTA.budgetClear' })}
                  </button>
                ) : null}
              </div>
            ) : null}
          </OutsideClickHandler>
        );
      }}
    </Field>
  );
};

export default FilterBudget;
