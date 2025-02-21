import React from 'react';
import { Form as FinalForm } from 'react-final-form';
import { useIntl } from 'react-intl';

import { FieldTextInput, Form } from '../../../../components';
import { FIELD_LOCATION, FIELD_TEXT } from '../../common/constants';
import { composeValidators } from '../../../../util/validators';

import css from './TransactionModalForm.module.css';

const getField = ({ config, configIndex, intl }) => {
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
          className={css.fieldInput}
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
    default:
      return null;
  }
};

function TransactionModalForm({ formConfigs = [], ...restProps }) {
  const intl = useIntl();
  const fields = Array.isArray(formConfigs)
    ? formConfigs.map((config, configIndex) => getField({ config, configIndex, intl }))
    : [];

  return (
    <FinalForm
      {...restProps}
      render={formRenderProps => {
        const { children, handleSubmit } = formRenderProps;
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
