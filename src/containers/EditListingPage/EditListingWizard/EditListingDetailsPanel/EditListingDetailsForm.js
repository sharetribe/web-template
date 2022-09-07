import React, { useEffect } from 'react';
import { arrayOf, bool, func, number, oneOf, oneOfType, shape, string } from 'prop-types';
import { compose } from 'redux';
import { Field, Form as FinalForm } from 'react-final-form';
import arrayMutators from 'final-form-arrays';
import classNames from 'classnames';

// Import util modules
import { intlShape, injectIntl, FormattedMessage } from '../../../../util/reactIntl';
import { EXTENDED_DATA_SCHEMA_TYPES, propTypes } from '../../../../util/types';
import { maxLength, required, composeValidators } from '../../../../util/validators';

// Import shared components
import { Form, Button, FieldSelect, FieldTextInput } from '../../../../components';
// Import modules from this directory
import CustomExtendedDataField from '../CustomExtendedDataField';
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

// Hidden input field
const FieldHidden = props => {
  const { name } = props;
  return (
    <Field id={name} name={name} type="hidden" className={css.unitTypeHidden}>
      {fieldRenderProps => <input {...fieldRenderProps?.input} />}
    </Field>
  );
};

// TransactionProcess selector
// Adds a single hidden field if only one process is available.
const FieldTransactionProcessAlias = props => {
  const { name, processInfos, hasSetProcessAlias, onChange, formApi, intl } = props;
  const handleOnChange = value => {
    const unitTypes = findProcessInfo(value, processInfos)?.unitTypes || [];
    const unitType = unitTypes?.length === 1 ? unitTypes[0] : undefined;
    formApi.change('unitType', unitType);
    if (onChange) {
      onChange(value);
    }
  };
  const label = intl.formatMessage({ id: 'EditListingDetailsForm.processLabel' });
  const hasMultipleProcesses = processInfos.length > 1;

  return !hasSetProcessAlias && hasMultipleProcesses ? (
    <FieldSelect
      id={name}
      name={name}
      className={css.processSelect}
      label={label}
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
    <div className={css.processSelect}>
      <h5 className={css.selectedLabel}>{label}</h5>
      <p className={css.selectedValue}>{formApi.getFieldState(name)?.value}</p>
      <FieldHidden name={name} />
    </div>
  );
};

// Unit type selector (item, day, night, hour)
// This needs unitTypes from src/util/transaction.js
const FieldSelectUnitType = props => {
  const { name, unitTypes, formApi, intl } = props;
  const hasProcessAlias = formApi.getFieldState('transactionProcessAlias')?.value;
  if (!hasProcessAlias) {
    return null;
  }

  const label = intl.formatMessage({ id: 'EditListingDetailsForm.unitTypesLabel' });
  return unitTypes?.length > 1 ? (
    <FieldSelect
      id={name}
      name={name}
      className={css.unitSelect}
      label={label}
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
  ) : (
    <div className={css.unitSelect}>
      <h5 className={css.selectedLabel}>{label}</h5>
      <p className={css.selectedValue}>{formApi.getFieldState(name)?.value}</p>
      <FieldHidden name={name} />
    </div>
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
        onProcessChange,
        intl,
        invalid,
        pristine,
        processInfos,
        hasSetProcessAlias,
        saveActionMsg,
        updated,
        updateInProgress,
        fetchErrors,
        listingExtendedDataConfig,
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
      const { transactionProcessAlias } = values;

      const classes = classNames(css.root, className);
      const submitReady = (updated && pristine) || ready;
      const submitInProgress = updateInProgress;
      const submitDisabled = invalid || disabled || submitInProgress;

      const addCustomExtendedDataFields = targetProcessAlias => {
        const extendedDataConfigs = listingExtendedDataConfig || [];
        return extendedDataConfigs.reduce((pickedFields, extendedDataConfig) => {
          const { key, includeForProcessAliases = [], schemaType, scope } =
            extendedDataConfig || {};
          const isKnownSchemaType = EXTENDED_DATA_SCHEMA_TYPES.includes(schemaType);
          const isTargetProcessAlias = includeForProcessAliases.includes(targetProcessAlias);
          const isProviderScope = ['public', 'private'].includes(scope);

          return isKnownSchemaType && isTargetProcessAlias && isProviderScope
            ? [
                ...pickedFields,
                <CustomExtendedDataField key={key} name={key} fieldConfig={extendedDataConfig} defaultRequiredMessage={intl.formatMessage({ id: 'EditListingDetailsForm.defaultRequiredMessage' })} />,
              ]
            : pickedFields;
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
            hasSetProcessAlias={hasSetProcessAlias}
            onChange={onProcessChange}
            formApi={formApi}
            intl={intl}
          />

          <FieldSelectUnitType
            name="unitType"
            unitTypes={findProcessInfo(transactionProcessAlias, processInfos)?.unitTypes || []}
            formApi={formApi}
            intl={intl}
          />

          {addCustomExtendedDataFields(transactionProcessAlias)}

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
  onProcessChange: null,
  hasSetProcessAlias: false,
  listingExtendedDataConfig: null,
};

EditListingDetailsFormComponent.propTypes = {
  className: string,
  intl: intlShape.isRequired,
  onSubmit: func.isRequired,
  onProcessChange: func,
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
  hasSetProcessAlias: bool,
  listingExtendedDataConfig: propTypes.listingExtendedDataConfig,
};

export default compose(injectIntl)(EditListingDetailsFormComponent);
