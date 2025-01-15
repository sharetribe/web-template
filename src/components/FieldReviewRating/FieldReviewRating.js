import React from 'react';
import { useIntl } from '../../util/reactIntl';
import { Field } from 'react-final-form';
import classNames from 'classnames';
import { IconReviewStar, ValidationError } from '../../components';

import css from './FieldReviewRating.module.css';

const FieldReviewRatingComponent = props => {
  /* eslint-disable no-unused-vars */
  const {
    rootClassName,
    className,
    inputRootClass,
    customErrorText,
    id,
    intl,
    label,
    input,
    meta,
    ...rest
  } = props;
  /* eslint-enable no-unused-vars */

  const handleChange = event => {
    input.onChange(event.target.value);
  };

  const { touched, error } = meta;
  const errorText = customErrorText || error;
  const fieldMeta = { touched, error: errorText };

  const { value, checked, ...restInputProps } = input;
  const inputProps = { ...restInputProps, type: 'radio', name: 'rating', ...rest };

  const classes = classNames(rootClassName || css.root, className);

  const createStarRating = starCount => {
    let inputsAndLabels = [];

    // Star inpu order: reverse order expected (5 -> 1) and also input before label
    // This is due to CSS selectors.
    // Sibling combinator (~) selects following siblings, but we want to select previous siblings
    for (let i = starCount; i > 0; i--) {
      const inputValue = `${i}`;
      const starId = `star${i}`;
      const inputId = `${id}.${starId}`;

      inputsAndLabels.push(
        <input
          key={inputId}
          id={inputId}
          className={css.rateInput}
          value={inputValue}
          checked={typeof checked !== 'undefined' ? checked : value === inputValue}
          {...inputProps}
        />
      );

      inputsAndLabels.push(
        <label
          key={`label.${inputId}`}
          className={css.label}
          htmlFor={inputId}
          title={intl.formatMessage({ id: `FieldReviewRating.${starId}` })}
        >
          <IconReviewStar rootClassName={css.star} />
        </label>
      );
    }
    return inputsAndLabels;
  };

  return (
    <div className={classes}>
      <fieldset className={css.ratingFieldSet}>
        {label ? <legend>{label}</legend> : null}
        <div className={css.rating}>{createStarRating(5)}</div>
      </fieldset>
      <ValidationError fieldMeta={fieldMeta} />
    </div>
  );
};

/**
 * Final Form Field containing review rating 'stars'
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @param {string} props.name Name of the input in Final Form
 * @param {string} props.id
 * @param {ReactNode} props.label
 * @param {string} props.customErrorText Error message that can be manually passed to input field, overrides default validation message
 * @returns {JSX.Element} Final Form Field containing review rating input
 */
const FieldReviewRating = props => {
  const intl = useIntl();
  return <Field component={FieldReviewRatingComponent} intl={intl} {...props} />;
};

export default FieldReviewRating;
