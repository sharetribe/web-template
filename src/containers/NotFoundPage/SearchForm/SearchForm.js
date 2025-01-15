import React from 'react';
import { Form as FinalForm, Field } from 'react-final-form';
import classNames from 'classnames';

import { useIntl } from '../../../util/reactIntl';
import { Form, LocationAutocompleteInput } from '../../../components';

import IconSearchDesktop from './IconSearchDesktop';

import css from './SearchForm.module.css';

const identity = v => v;

const KeywordSearchField = props => {
  const { intl, inputRef } = props;
  return (
    <div className={css.keywordSearchWrapper}>
      <button className={css.searchSubmit}>
        <div className={css.searchInputIcon}>
          <IconSearchDesktop />
        </div>
      </button>
      <Field
        name="keywords"
        render={({ input, meta }) => {
          return (
            <input
              className={css.keywordInput}
              {...input}
              id={'keyword-search-404'}
              type="text"
              placeholder={intl.formatMessage({
                id: 'NotFoundPage.SearchForm.placeholder',
              })}
              autoComplete="off"
            />
          );
        }}
      />
    </div>
  );
};

const LocationSearchField = props => {
  const { intl, handleChange } = props;
  return (
    <Field
      name="location"
      format={identity}
      render={({ input, meta }) => {
        const { onChange, ...restInput } = input;

        // Merge the standard onChange function with custom behaviur. A better solution would
        // be to use the FormSpy component from Final Form and pass this.onChange to the
        // onChange prop but that breaks due to insufficient subscription handling.
        // See: https://github.com/final-form/react-final-form/issues/159
        const searchOnChange = value => {
          onChange(value);
          handleChange(value);
        };

        const searchInput = { ...restInput, onChange: searchOnChange };
        return (
          <LocationAutocompleteInput
            placeholder={intl.formatMessage({ id: 'NotFoundPage.SearchForm.placeholder' })}
            iconClassName={css.searchInputIcon}
            inputClassName={css.searchInput}
            predictionsClassName={css.searchPredictions}
            input={searchInput}
            meta={meta}
          />
        );
      }}
    />
  );
};

/**
 * Search form
 *
 * @param {Object} props
 * @param {string} [props.rootClassName] - Custom class that overrides the default class for the root element
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {function} props.onSubmit - The function to submit the form
 * @param {boolean} props.isKeywordSearch - Whether the search is a keyword search
 * @returns {JSX.Element} Search form component
 */
const SearchForm = props => {
  const intl = useIntl();
  const handleChange = location => {
    if (location.selectedPlace) {
      // Note that we use `onSubmit` instead of the conventional
      // `handleSubmit` prop for submitting. We want to autosubmit
      // when a place is selected, and don't require any extra
      // validations for the form.
      props.onSubmit({ location });
    }
  };

  return (
    <FinalForm
      {...props}
      render={formRenderProps => {
        const { rootClassName, className, isKeywordSearch, handleSubmit } = formRenderProps;
        const classes = classNames(rootClassName || css.root, className);

        // Allow form submit only when the place has changed
        const preventFormSubmit = e => e.preventDefault();
        const submitFormFn = isKeywordSearch ? handleSubmit : preventFormSubmit;

        return (
          <Form className={classes} onSubmit={submitFormFn}>
            {isKeywordSearch ? (
              <KeywordSearchField intl={intl} />
            ) : (
              <LocationSearchField intl={intl} handleChange={handleChange} />
            )}
          </Form>
        );
      }}
    />
  );
};

export default SearchForm;
