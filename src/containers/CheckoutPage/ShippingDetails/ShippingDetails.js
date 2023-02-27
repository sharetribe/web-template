import React from 'react';
import { bool, object, string } from 'prop-types';
import classNames from 'classnames';

import { FormattedMessage, intlShape } from '../../../util/reactIntl';
import * as validators from '../../../util/validators';
import getCountryCodes from '../../../translations/countryCodes';

import { FieldSelect, FieldTextInput, Heading } from '../../../components';

import css from './ShippingDetails.module.css';

const ShippingDetails = props => {
  const { rootClassName, className, locale, intl, disabled, formApi, fieldId } = props;
  const classes = classNames(rootClassName || css.root, className);

  const optionalText = intl.formatMessage({
    id: 'ShippingDetails.optionalText',
  });

  // Use the language set in config.localization.locale to get the correct translations of the country names
  const countryCodes = getCountryCodes(locale);

  return (
    <div className={classes}>
      <Heading as="h3" rootClassName={css.heading}>
        <FormattedMessage id="ShippingDetails.title" />
      </Heading>
      <FieldTextInput
        id={`${fieldId}.recipientName`}
        name="recipientName"
        disabled={disabled}
        className={css.fieldFullWidth}
        type="text"
        autoComplete="shipping name"
        label={intl.formatMessage({ id: 'ShippingDetails.recipientNameLabel' })}
        placeholder={intl.formatMessage({
          id: 'ShippingDetails.recipientNamePlaceholder',
        })}
        validate={validators.required(
          intl.formatMessage({ id: 'ShippingDetails.recipientNameRequired' })
        )}
        onUnmount={() => formApi.change('recipientName', undefined)}
      />
      <FieldTextInput
        id={`${fieldId}.recipientPhoneNumber`}
        name="recipientPhoneNumber"
        disabled={disabled}
        className={css.fieldFullWidth}
        type="text"
        autoComplete="shipping phoneNumber"
        label={intl.formatMessage(
          { id: 'ShippingDetails.recipientPhoneNumberLabel' },
          { optionalText: optionalText }
        )}
        placeholder={intl.formatMessage({
          id: 'ShippingDetails.recipientPhoneNumberPlaceholder',
        })}
        onUnmount={() => formApi.change('recipientPhoneNumber', undefined)}
      />
      <div className={css.formRow}>
        <FieldTextInput
          id={`${fieldId}.recipientAddressLine1`}
          name="recipientAddressLine1"
          disabled={disabled}
          className={css.field}
          type="text"
          autoComplete="shipping address-line1"
          label={intl.formatMessage({ id: 'ShippingDetails.addressLine1Label' })}
          placeholder={intl.formatMessage({
            id: 'ShippingDetails.addressLine1Placeholder',
          })}
          validate={validators.required(
            intl.formatMessage({ id: 'ShippingDetails.addressLine1Required' })
          )}
          onUnmount={() => formApi.change('recipientAddressLine1', undefined)}
        />

        <FieldTextInput
          id={`${fieldId}.recipientAddressLine2`}
          name="recipientAddressLine2"
          disabled={disabled}
          className={css.field}
          type="text"
          autoComplete="shipping address-line2"
          label={intl.formatMessage(
            { id: 'ShippingDetails.addressLine2Label' },
            { optionalText: optionalText }
          )}
          placeholder={intl.formatMessage({
            id: 'ShippingDetails.addressLine2Placeholder',
          })}
          onUnmount={() => formApi.change('recipientAddressLine2', undefined)}
        />
      </div>
      <div className={css.formRow}>
        <FieldTextInput
          id={`${fieldId}.recipientPostalCode`}
          name="recipientPostal"
          disabled={disabled}
          className={css.field}
          type="text"
          autoComplete="shipping postal-code"
          label={intl.formatMessage({ id: 'ShippingDetails.postalCodeLabel' })}
          placeholder={intl.formatMessage({
            id: 'ShippingDetails.postalCodePlaceholder',
          })}
          validate={validators.required(
            intl.formatMessage({ id: 'ShippingDetails.postalCodeRequired' })
          )}
          onUnmount={() => formApi.change('recipientPostal', undefined)}
        />

        <FieldTextInput
          id={`${fieldId}.recipientCity`}
          name="recipientCity"
          disabled={disabled}
          className={css.field}
          type="text"
          autoComplete="shipping address-level2"
          label={intl.formatMessage({ id: 'ShippingDetails.cityLabel' })}
          placeholder={intl.formatMessage({ id: 'ShippingDetails.cityPlaceholder' })}
          validate={validators.required(intl.formatMessage({ id: 'ShippingDetails.cityRequired' }))}
          onUnmount={() => formApi.change('recipientCity', undefined)}
        />
      </div>
      <div className={css.formRow}>
        <FieldTextInput
          id={`${fieldId}.recipientState`}
          name="recipientState"
          disabled={disabled}
          className={css.field}
          type="text"
          autoComplete="shipping address-level1"
          label={intl.formatMessage(
            { id: 'ShippingDetails.stateLabel' },
            { optionalText: optionalText }
          )}
          placeholder={intl.formatMessage({ id: 'ShippingDetails.statePlaceholder' })}
          onUnmount={() => formApi.change('recipientState', undefined)}
        />

        <FieldSelect
          id={`${fieldId}.recipientCountry`}
          name="recipientCountry"
          disabled={disabled}
          className={css.field}
          label={intl.formatMessage({ id: 'ShippingDetails.countryLabel' })}
          validate={validators.required(
            intl.formatMessage({ id: 'ShippingDetails.countryRequired' })
          )}
        >
          <option disabled value="">
            {intl.formatMessage({ id: 'ShippingDetails.countryPlaceholder' })}
          </option>
          {countryCodes.map(country => {
            return (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            );
          })}
        </FieldSelect>
      </div>
    </div>
  );
};

ShippingDetails.defaultProps = {
  rootClassName: null,
  className: null,
  disabled: false,
  fieldId: null,
};

ShippingDetails.propTypes = {
  rootClassName: string,
  className: string,
  disabled: bool,
  formApi: object.isRequired,
  fieldId: string,

  // from injectIntl
  intl: intlShape.isRequired,
};

export default ShippingDetails;
