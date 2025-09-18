import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Field, useFormState } from 'react-final-form';
import FieldTextInput from '../FieldTextInput/FieldTextInput';
import FieldSelect from '../FieldSelect/FieldSelect';
import css from './AddressForm.module.css';
import { US_STATES, CA_PROVINCES } from '../../util/geoData';

// Country options with ISO-2 codes
const COUNTRY_OPTIONS = [
  { label: 'United States', value: 'US' },
  { label: 'Canada', value: 'CA' },
  { label: 'Mexico', value: 'MX' },
  { label: 'United Kingdom', value: 'GB' },
  { label: 'Germany', value: 'DE' },
  { label: 'France', value: 'FR' },
  { label: 'Italy', value: 'IT' },
  { label: 'Spain', value: 'ES' },
  { label: 'Australia', value: 'AU' },
  { label: 'Japan', value: 'JP' },
  { label: 'China', value: 'CN' },
  { label: 'India', value: 'IN' },
  { label: 'Brazil', value: 'BR' },
  { label: 'Argentina', value: 'AR' },
  { label: 'Chile', value: 'CL' },
  { label: 'Colombia', value: 'CO' },
  { label: 'Peru', value: 'PE' },
  { label: 'Venezuela', value: 'VE' },
  { label: 'Ecuador', value: 'EC' },
  { label: 'Uruguay', value: 'UY' },
  { label: 'Paraguay', value: 'PY' },
  { label: 'Bolivia', value: 'BO' },
  { label: 'Guyana', value: 'GY' },
  { label: 'Suriname', value: 'SR' },
  { label: 'Falkland Islands', value: 'FK' },
];

export default function AddressForm({
  namespace,
  title,
  requiredFields = {},
  disabled = false,
  countryAfterZipForUSCA = true,
}) {
  // Guard: prevent nameless <Field> crash
  if (!namespace) {
    /* eslint-disable no-console */
    console.error('[AddressForm] namespace prop is required ("billing" or "shipping").');
    return null;
  }

  const { values } = useFormState({ subscription: { values: true } });
  const cfg = useMemo(() => {
    const c = (values?.[namespace]?.country || 'US').toUpperCase();
    const isUS = c === 'US';
    const isCA = c === 'CA';
    return {
      country: c,
      isUS,
      isCA,
      stateLabel: isUS ? 'State' : isCA ? 'Province' : 'State / Region',
      postalLabel: isUS ? 'ZIP Code' : 'Postal Code',
      stateRequired: !!requiredFields.state && (isUS || isCA),
      postalRequired: !!requiredFields.postalCode,
      placeCountryAfterZip: countryAfterZipForUSCA && (isUS || isCA),
      stateOptions: isUS ? US_STATES : isCA ? CA_PROVINCES : null,
    };
  }, [values, namespace, requiredFields.state, requiredFields.postalCode, countryAfterZipForUSCA]);

  return (
    <div className={css.root} aria-disabled={disabled}>
      {title ? <h3 className={css.title}>{title}</h3> : null}
      
      {/* Full name */}
      <FieldTextInput
        className={css.field}
        id={`${namespace}-name`}
        name={`${namespace}.name`}
        label="Full Name"
        required={!!requiredFields.name}
        autoComplete="name"
        disabled={disabled}
        key={`${namespace}-name`}
      />

      {/* Street line 1 */}
      <FieldTextInput
        className={css.field}
        id={`${namespace}-line1`}
        name={`${namespace}.line1`}
        label="Street Address"
        placeholder="123 Example Street"
        required={!!requiredFields.line1}
        autoComplete="address-line1"
        disabled={disabled}
      />

      {/* Street line 2 */}
      <FieldTextInput
        className={css.field}
        id={`${namespace}-line2`}
        name={`${namespace}.line2`}
        label="Apartment, Suite, etc. (Optional)"
        placeholder="Apt / Suite (optional)"
        required={false}
        autoComplete="address-line2"
        disabled={disabled}
      />

      {/* City */}
      <FieldTextInput
        className={css.field}
        id={`${namespace}-city`}
        name={`${namespace}.city`}
        label="City"
        required={!!requiredFields.city}
        autoComplete="address-level2"
        disabled={disabled}
      />

      {/* Country BEFORE state for non-US/CA (so state rules can react) */}
      {!cfg.placeCountryAfterZip && (
        <FieldSelect
          className={css.field}
          id={`${namespace}-country`}
          name={`${namespace}.country`}
          label="Country"
          required={!!requiredFields.country}
          autoComplete="country"
          disabled={disabled}
        >
          <option value="" disabled>Select a country</option>
          {COUNTRY_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </FieldSelect>
      )}

      {/* State / Region (dropdown for US/CA, input otherwise) */}
      {cfg.stateOptions ? (
        <FieldSelect
          className={css.field}
          id={`${namespace}-state`}
          name={`${namespace}.state`}
          label={cfg.stateLabel}
          required={cfg.stateRequired}
          autoComplete="address-level1"
          disabled={disabled}
        >
          <option value="" disabled>Select a {cfg.stateLabel.toLowerCase()}</option>
          {cfg.stateOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </FieldSelect>
      ) : (
        <FieldTextInput
          className={css.field}
          id={`${namespace}-state`}
          name={`${namespace}.state`}
          label={cfg.stateLabel}
          required={cfg.stateRequired}
          autoComplete="address-level1"
          disabled={disabled}
        />
      )}

      {/* ZIP / Postal */}
      <FieldTextInput
        className={css.field}
        id={`${namespace}-postalCode`}
        name={`${namespace}.postalCode`}
        label={cfg.postalLabel}
        required={!!requiredFields.postalCode}
        autoComplete="postal-code"
        disabled={disabled}
      />

      {/* Country AFTER ZIP for US/CA */}
      {cfg.placeCountryAfterZip && (
        <FieldSelect
          className={css.field}
          id={`${namespace}-country`}
          name={`${namespace}.country`}
          label="Country"
          required={!!requiredFields.country}
          autoComplete="country"
          disabled={disabled}
        >
          <option value="" disabled>Select a country</option>
          {COUNTRY_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </FieldSelect>
      )}

      {/* Email */}
      <FieldTextInput
        className={css.field}
        id={`${namespace}-email`}
        name={`${namespace}.email`}
        label="Email Address"
        type="email"
        required={!!requiredFields.email}
        autoComplete="email"
        disabled={disabled}
      />

      {/* Phone */}
      <FieldTextInput
        className={css.field}
        id={`${namespace}-phone`}
        name={`${namespace}.phone`}
        label="Phone Number"
        type="tel"
        required={!!requiredFields.phone}
        autoComplete="tel"
        disabled={disabled}
      />

    </div>
  );
}

AddressForm.propTypes = {
  namespace: PropTypes.oneOf(['billing', 'shipping']).isRequired,
  title: PropTypes.string,
  requiredFields: PropTypes.object,
  disabled: PropTypes.bool,
  countryAfterZipForUSCA: PropTypes.bool,
};