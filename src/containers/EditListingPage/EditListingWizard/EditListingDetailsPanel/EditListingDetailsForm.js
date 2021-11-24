import React, { useEffect } from 'react';
import { arrayOf, bool, func, shape, string } from 'prop-types';
import { compose } from 'redux';
import { Field, Form as FinalForm } from 'react-final-form';
import arrayMutators from 'final-form-arrays';
import classNames from 'classnames';

// Import configs and util modules
import config from '../../../../config';
import { intlShape, injectIntl, FormattedMessage } from '../../../../util/reactIntl';
import { propTypes } from '../../../../util/types';
import { maxLength, required, composeValidators } from '../../../../util/validators';

// Import shared components
import { Form, Button, FieldSelect, FieldTextInput } from '../../../../components';
// Import modules from this directory
import CustomField from '../CustomField';
import css from './EditListingDetailsForm.module.css';

const TITLE_MAX_LENGTH = 60;

const findProcessInfo = (transactionProcessAlias, processInfos) =>
  processInfos.find(pi => transactionProcessAlias === `${pi.name}/${pi.alias}`);

// Show various error messages
const ErrorMessage = props => {
  const { fetchErrors } = props;
  const { updateListingError, createListingDraftError, showListingsError } = fetchErrors || {};
  const errorMessage = updateListingError ? (
    <FormattedMessage id="EditListingDetailsForm.updateFailed" />
  ) : createListingDraftError ? (
    <FormattedMessage id="EditListingDetailsForm.createListingDraftError" />
  ) : showListingsError ? (
    <FormattedMessage id="EditListingDetailsForm.showListingFailed" />
  ) : null;

  if (errorMessage) {
    return <p className={css.error}>{errorMessage}</p>;
  }
  return null;
};

// Show children if certain value is present
const Condition = props => {
  const { when, is, children } = props;
  return (
    <Field name={when} subscription={{ value: true }}>
      {props => {
        const inputValue = props?.input?.value;
        return inputValue === is ? children : null;
      }}
    </Field>
  );
};

// Hidden input field
const FieldHidden = props => {
  const { name } = props;
  return (
    <Field id={name} name={name} type="hidden" className={css.unitTypeHidden}>
      {props => <input {...props?.input} />}
    </Field>
  );
};

// TransactionProcess selector
// Adds a single hidden field if only one process is available.
const FieldTransactionProcessAlias = props => {
  const { name, processInfos, formApi, intl } = props;
  const handleOnChange = value => {
    const unitTypes = findProcessInfo(value, processInfos)?.unitTypes || [];
    const unitType = unitTypes?.length === 1 ? unitTypes[0] : undefined;
    formApi.change('unitType', unitType);
  };
  const hasMultipleProcesses = processInfos.length > 1;

  return hasMultipleProcesses ? (
    <FieldSelect
      id={name}
      name={name}
      className={css.processSelect}
      label={intl.formatMessage({ id: 'EditListingDetailsForm.processLabel' })}
      onChange={handleOnChange}
      validate={required(intl.formatMessage({ id: 'EditListingDetailsForm.processRequired' }))}
    >
      <option disabled value="">
        {intl.formatMessage({ id: 'EditListingDetailsForm.processPlaceholder' })}
      </option>
      {processInfos.map(processInfo => {
        const processWithAlias = `${processInfo.name}/${processInfo.alias}`;
        return (
          <option key={processWithAlias} value={processWithAlias}>
            {processInfo.name}
          </option>
        );
      })}
    </FieldSelect>
  ) : (
    <FieldHidden name={name} />
  );
};

// Unit type selector (item, day, night, hour)
// This needs unitTypes from src/util/transaction.js
const FieldSelectUnitType = props => {
  const { unitTypes, intl } = props;
  return (
    <FieldSelect
      id="unitType"
      name="unitType"
      className={css.processSelect}
      label={intl.formatMessage({ id: 'EditListingDetailsForm.unitTypesLabel' })}
      validate={required(intl.formatMessage({ id: 'EditListingDetailsForm.unitTypesRequired' }))}
    >
      <option disabled value="">
        {intl.formatMessage({ id: 'EditListingDetailsForm.unitTypesPlaceholder' })}
      </option>
      {unitTypes.map(unitType => {
        const unitTypeMsg = unitType.replace(/(^|\s)\S/g, letter => letter.toUpperCase());
        return (
          <option key={unitType} value={unitType}>
            {unitTypeMsg}
          </option>
        );
      })}
    </FieldSelect>
  );
};

// Form that asks title, description, transaction process and unit type for pricing
// In addition, it asks about custom fields according to marketplace-custom-config.js
const EditListingDetailsFormComponent = props => (
  <FinalForm
    {...props}
    mutators={{ ...arrayMutators }}
    render={formRenderProps => {
      const {
        autoFocus,
        className,
        disabled,
        ready,
        form: formApi,
        handleSubmit,
        intl,
        invalid,
        pristine,
        processInfos,
        saveActionMsg,
        updated,
        updateInProgress,
        fetchErrors,
        filterConfigs,
        values,
      } = formRenderProps;

      // This is a bug fix for Final Form.
      // Without this, React will return a warning:
      //   "Cannot update a component (`ForwardRef(Field)`)
      //   while rendering a different component (`ForwardRef(Field)`)"
      // This seems to happen because validation calls listeneres and
      // that causes state to change inside final-form.
      // https://github.com/final-form/react-final-form/issues/751
      const { pauseValidation, resumeValidation } = formApi;
      pauseValidation(false);
      useEffect(() => resumeValidation(), [values]);

      const titleRequiredMessage = intl.formatMessage({
        id: 'EditListingDetailsForm.titleRequired',
      });
      const maxLengthMessage = intl.formatMessage(
        { id: 'EditListingDetailsForm.maxLength' },
        {
          maxLength: TITLE_MAX_LENGTH,
        }
      );
      const maxLength60Message = maxLength(maxLengthMessage, TITLE_MAX_LENGTH);

      const classes = classNames(css.root, className);
      const submitReady = (updated && pristine) || ready;
      const submitInProgress = updateInProgress;
      const submitDisabled = invalid || disabled || submitInProgress;

      const unitTypes =
        findProcessInfo('flex-default-process/release-1', processInfos)?.unitTypes || [];

      // TODO: fields should be tied to process.
      // When configs are changed, this function could take process name as parameter.
      const addCustomFields = () => {
        return filterConfigs.reduce((selectedFilters, filter) => {
          const fieldId = filter.id;
          const isEnum = ['enum', 'multi-enum'].includes(filter?.config?.schemaType);
          return isEnum
            ? [...selectedFilters, <CustomField key={fieldId} id={fieldId} filterConfig={filter} />]
            : selectedFilters;
        }, []);
      };

      return (
        <Form className={classes} onSubmit={handleSubmit}>
          <ErrorMessage fetchErrors={fetchErrors} />

          <FieldTextInput
            id="title"
            name="title"
            className={css.title}
            type="text"
            label={intl.formatMessage({ id: 'EditListingDetailsForm.title' })}
            placeholder={intl.formatMessage({ id: 'EditListingDetailsForm.titlePlaceholder' })}
            maxLength={TITLE_MAX_LENGTH}
            validate={composeValidators(required(titleRequiredMessage), maxLength60Message)}
            autoFocus={autoFocus}
          />
          <FieldTextInput
            id="description"
            name="description"
            className={css.description}
            type="textarea"
            label={intl.formatMessage({ id: 'EditListingDetailsForm.description' })}
            placeholder={intl.formatMessage({
              id: 'EditListingDetailsForm.descriptionPlaceholder',
            })}
            validate={required(
              intl.formatMessage({
                id: 'EditListingDetailsForm.descriptionRequired',
              })
            )}
          />

          <FieldTransactionProcessAlias
            name="transactionProcessAlias"
            processInfos={processInfos}
            formApi={formApi}
            intl={intl}
          />

          <Condition when="transactionProcessAlias" is={'flex-product-default-process/release-1'}>
            <FieldHidden name="unitType" />
            {addCustomFields()}
          </Condition>

          <Condition when="transactionProcessAlias" is={'flex-default-process/release-1'}>
            <FieldSelectUnitType unitTypes={unitTypes} intl={intl} />
            {addCustomFields()}
          </Condition>

          <Button
            className={css.submitButton}
            type="submit"
            inProgress={submitInProgress}
            disabled={submitDisabled}
            ready={submitReady}
          >
            {saveActionMsg}
          </Button>
        </Form>
      );
    }}
  />
);

EditListingDetailsFormComponent.defaultProps = {
  className: null,
  fetchErrors: null,
  filterConfigs: config.custom.filters,
};

EditListingDetailsFormComponent.propTypes = {
  className: string,
  intl: intlShape.isRequired,
  onSubmit: func.isRequired,
  saveActionMsg: string.isRequired,
  disabled: bool.isRequired,
  ready: bool.isRequired,
  updated: bool.isRequired,
  updateInProgress: bool.isRequired,
  fetchErrors: shape({
    createListingDraftError: propTypes.error,
    showListingsError: propTypes.error,
    updateListingError: propTypes.error,
  }),
  processInfos: arrayOf(
    shape({
      name: string.isRequired,
      alias: string.isRequired,
      unitTypes: arrayOf(string).isRequired,
    })
  ).isRequired,
  filterConfigs: propTypes.filterConfig,
};

export default compose(injectIntl)(EditListingDetailsFormComponent);
