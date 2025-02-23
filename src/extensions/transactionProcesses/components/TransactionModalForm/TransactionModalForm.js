import React from 'react';
import { Form as FinalForm } from 'react-final-form';
import { useIntl } from 'react-intl';

import { FieldLocationAutocompleteInput, FieldTextInput, Form } from '../../../../components';
import { FIELD_LOCATION, FIELD_TEXT } from '../../common/constants';
import { composeValidators } from '../../../../util/validators';

import css from './TransactionModalForm.module.css';
import { get, merge, set } from 'lodash';

const getField = ({ config, configIndex, intl, values }) => {
  const {
    type,
    labelTranslationId,
    placeholderTranslationId,
    name,
    validators: validatorsConfig = [],
  } = config;

  const validators = Array.isArray(validatorsConfig)
    ? validatorsConfig.map(({ validatorFn, messageTranslationId }) =>
        validatorFn(intl.formatMessage({ id: messageTranslationId }))
      )
    : [];

  switch (type) {
    case FIELD_TEXT:
      return (
        <FieldTextInput
          key={configIndex}
          id={name}
          name={name}
          type="text"
          label={labelTranslationId && intl.formatMessage({ id: labelTranslationId })}
          placeholder={
            placeholderTranslationId && intl.formatMessage({ id: placeholderTranslationId })
          }
          validate={composeValidators(...validators)}
        />
      );

    case FIELD_LOCATION:
      return (
        <FieldLocationAutocompleteInput
          key={configIndex}
          iconClassName={css.locationAutocompleteInputIcon}
          name={name}
          label={labelTranslationId && intl.formatMessage({ id: labelTranslationId })}
          placeholder={
            placeholderTranslationId && intl.formatMessage({ id: placeholderTranslationId })
          }
          useDefaultPredictions={false}
          format={v => v}
          valueFromForm={values[name]}
          validate={composeValidators(...validators)}
        />
      );
    default:
      return null;
  }
};

function TransactionModalForm({ onSubmit, formConfigs = [], ...restProps }) {
  const intl = useIntl();

  const handleSubmit = values => {
    const locationFields = formConfigs.filter(field => field.type === FIELD_LOCATION);
    const locationValues = locationFields.reduce((acc, current) => {
      const { name } = current;

      const value = get(values, name);
      set(acc, name, value?.selectedPlace?.address);
      return acc;
    }, {});

    onSubmit(merge({}, values, locationValues));
  };

  return (
    <FinalForm
      onSubmit={handleSubmit}
      {...restProps}
      render={formRenderProps => {
        const { children, handleSubmit, values } = formRenderProps;

        const fields = Array.isArray(formConfigs)
          ? formConfigs.map((config, configIndex) =>
              getField({ config, configIndex, intl, values })
            )
          : [];

        return (
          <Form onSubmit={handleSubmit}>
            {fields}
            {children}
          </Form>
        );
      }}
    />
  );
}

export default TransactionModalForm;
