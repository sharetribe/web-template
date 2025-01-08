import React from 'react';
import classNames from 'classnames';
import debounce from 'lodash/debounce';
import { Field, Form as FinalForm, FormSpy } from 'react-final-form';

import { FormattedMessage, useIntl } from '../../../util/reactIntl';

import { Form, RangeSlider } from '../../../components';

import css from './PriceFilterForm.module.css';

const DEBOUNCE_WAIT_TIME = 400;

// Helper function to parse value for min handle
// Value needs to be between slider's minimum value and current maximum value
const parseMin = (min, currentMax) => value => {
  const parsedValue = Number.parseInt(value, 10);
  if (isNaN(parsedValue)) {
    return '';
  }
  return parsedValue < min ? min : parsedValue > currentMax ? currentMax : parsedValue;
};

// Helper function to parse value for max handle
// Value needs to be between slider's max value and current minimum value
const parseMax = (max, currentMin) => value => {
  const parsedValue = Number.parseInt(value, 10);
  if (isNaN(parsedValue)) {
    return '';
  }
  return parsedValue < currentMin ? currentMin : parsedValue > max ? max : parsedValue;
};

/**
 * PriceFilterForm component
 *
 * @component
 * @param {Object} props
 * @param {string} props.id - The ID
 * @param {boolean} [props.liveEdit] - Whether the filter is live editable
 * @param {boolean} [props.showAsPopup] - Whether the filter is shown as a popup
 * @param {Function} props.onChange - The function to change the filter
 * @param {Function} props.onSubmit - The function to submit the filter
 * @param {Function} props.onCancel - The function to cancel the filter
 * @param {Function} props.onClear - The function to clear the filter
 * @param {boolean} [props.isOpen] - Whether the filter is open
 * @param {Function} props.contentRef - The function to get the content ref
 * @param {Object} props.style - The style
 * @param {number} props.min - The minimum price for the price range filter
 * @param {number} props.max - The maximum price for the price range filter
 * @param {number} props.step - The step for the price range filter
 * @returns {JSX.Element}
 */
const PriceFilterForm = props => {
  const intl = useIntl();
  const { liveEdit = false, onChange, onSubmit, onCancel, onClear, ...rest } = props;

  if (liveEdit && !onChange) {
    throw new Error('PriceFilterForm: if liveEdit is true you need to provide onChange function');
  }

  if (!liveEdit && !(onCancel && onClear && onSubmit)) {
    throw new Error(
      'PriceFilterForm: if liveEdit is false you need to provide onCancel, onClear, and onSubmit functions'
    );
  }

  const handleChange = debounce(
    formState => {
      if (formState.dirty) {
        const { minPrice, maxPrice, ...restValues } = formState.values;
        onChange({
          minPrice: minPrice === '' ? rest.min : minPrice,
          maxPrice: maxPrice === '' ? rest.max : maxPrice,
          ...restValues,
        });
      }
    },
    DEBOUNCE_WAIT_TIME,
    { leading: false, trailing: true }
  );

  const handleSubmit = values => {
    const { minPrice, maxPrice, ...restValues } = values;
    return onSubmit({
      minPrice: minPrice === '' ? rest.min : minPrice,
      maxPrice: maxPrice === '' ? rest.max : maxPrice,
      ...restValues,
    });
  };

  const formCallbacks = liveEdit
    ? { onSubmit: () => null }
    : { onSubmit: handleSubmit, onCancel, onClear };
  return (
    <FinalForm
      {...rest}
      {...formCallbacks}
      render={formRenderProps => {
        const {
          form,
          handleSubmit,
          id,
          showAsPopup = false,
          onClear,
          onCancel,
          isOpen = false,
          isInSideBar = false,
          contentRef,
          style,
          intl,
          values,
          min = 0,
          max = 1000,
          step = 1,
          children,
        } = formRenderProps;
        const { minPrice: minPriceRaw, maxPrice: maxPriceRaw } = values;
        const minPrice = typeof minPriceRaw !== 'string' ? minPriceRaw : min;
        const maxPrice = typeof maxPriceRaw !== 'string' ? maxPriceRaw : max;

        const handleCancel = () => {
          // reset the final form to initialValues
          form.reset();
          onCancel();
        };

        const clear = intl.formatMessage({ id: 'PriceFilterForm.clear' });
        const cancel = intl.formatMessage({ id: 'PriceFilterForm.cancel' });
        const submit = intl.formatMessage({ id: 'PriceFilterForm.submit' });

        const classes = classNames(css.root, {
          [css.popup]: showAsPopup,
          [css.isOpenAsPopup]: showAsPopup && isOpen,
          [css.plain]: !showAsPopup,
          [css.isOpen]: !showAsPopup && isOpen,
        });

        return (
          <Form
            className={classes}
            onSubmit={handleSubmit}
            tabIndex="0"
            contentRef={contentRef}
            style={{ minWidth: '300px', ...style }}
          >
            <div className={css.contentWrapper}>
              {showAsPopup ? (
                <span className={css.label}>
                  <FormattedMessage id="PriceFilterForm.label" />
                </span>
              ) : null}
              <div className={css.inputsWrapper}>
                <Field
                  className={classNames(css.minPrice, { [css.priceInSidebar]: isInSideBar })}
                  id={`${id}.minPrice`}
                  name="minPrice"
                  component="input"
                  type="number"
                  placeholder={min}
                  min={min}
                  max={max}
                  step={step}
                  parse={parseMin(min, maxPrice)}
                />
                <span className={css.priceSeparator}>-</span>
                <Field
                  className={classNames(css.maxPrice, { [css.priceInSidebar]: isInSideBar })}
                  id={`${id}.maxPrice`}
                  name="maxPrice"
                  component="input"
                  type="number"
                  placeholder={max}
                  min={min}
                  max={max}
                  step={step}
                  parse={parseMax(max, minPrice)}
                />
              </div>
            </div>

            <div className={css.sliderWrapper}>
              <RangeSlider
                min={min}
                max={max}
                step={step}
                handles={[minPrice, maxPrice]}
                onChange={handles => {
                  form.change('minPrice', handles[0]);
                  form.change('maxPrice', handles[1]);
                }}
              />
            </div>

            {liveEdit ? (
              <FormSpy onChange={handleChange} subscription={{ values: true, dirty: true }} />
            ) : (
              <div className={css.buttonsWrapper}>
                <button className={css.clearButton} type="button" onClick={onClear}>
                  {clear}
                </button>
                <button className={css.cancelButton} type="button" onClick={handleCancel}>
                  {cancel}
                </button>
                <button className={css.submitButton} type="submit">
                  {submit}
                </button>
              </div>
            )}
            {children}
          </Form>
        );
      }}
    />
  );
};

export default PriceFilterForm;
