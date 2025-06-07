import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, useIntl } from 'react-intl';
import classNames from 'classnames';
import { Modal, Form, FieldTextInput, PrimaryButton, SecondaryButton } from '../../components';
import css from './ProviderAddressModal.module.css';

const ProviderAddressModal = props => {
  const {
    id,
    className,
    rootClassName,
    isOpen,
    onCloseModal,
    onSubmit,
    onManageDisableScrolling,
    currentUser,
    initialValues,
    inProgress,
    submitError,
  } = props;

  const intl = useIntl();
  const [formValues, setFormValues] = useState({
    fullName: '',
    streetAddress: '',
    city: '',
    state: '',
    zipCode: '',
    email: '',
    phoneNumber: '',
  });

  // Initialize form with user data
  useEffect(() => {
    if (currentUser) {
      setFormValues(prev => ({
        ...prev,
        fullName: currentUser.profile?.displayName || '',
        email: currentUser.attributes?.email || '',
        ...initialValues,
      }));
    }
  }, [currentUser, initialValues]);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormValues(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = e => {
    e.preventDefault();
    onSubmit(formValues);
  };

  const isFormValid = () => {
    const { fullName, streetAddress, city, state, zipCode, email, phoneNumber } = formValues;
    return (
      fullName.trim() &&
      streetAddress.trim() &&
      city.trim() &&
      state.trim() &&
      zipCode.trim() &&
      email.trim() &&
      phoneNumber.trim()
    );
  };

  const classes = classNames(rootClassName || css.root, className);
  const submitButtonClasses = classNames(css.submitButton, {
    [css.submitButtonDisabled]: !isFormValid(),
  });

  return (
    <Modal
      id={id}
      containerClassName={classes}
      isOpen={isOpen}
      onCloseModal={onCloseModal}
      onManageDisableScrolling={onManageDisableScrolling}
      closeButtonMessage={intl.formatMessage({ id: 'ProviderAddressModal.closeModal' })}
    >
      <div className={css.modalContent}>
        <h1 className={css.title}>
          <FormattedMessage id="ProviderAddressModal.title" />
        </h1>
        <p className={css.description}>
          <FormattedMessage id="ProviderAddressModal.description" />
        </p>

        <Form className={css.form} onSubmit={handleSubmit}>
          <FieldTextInput
            id="fullName"
            name="fullName"
            label={intl.formatMessage({ id: 'ProviderAddressModal.fullNameLabel' })}
            placeholder={intl.formatMessage({ id: 'ProviderAddressModal.fullNamePlaceholder' })}
            value={formValues.fullName}
            onChange={handleChange}
            required
          />

          <FieldTextInput
            id="streetAddress"
            name="streetAddress"
            label={intl.formatMessage({ id: 'ProviderAddressModal.streetAddressLabel' })}
            placeholder={intl.formatMessage({ id: 'ProviderAddressModal.streetAddressPlaceholder' })}
            value={formValues.streetAddress}
            onChange={handleChange}
            required
          />

          <div className={css.cityStateRow}>
            <FieldTextInput
              id="city"
              name="city"
              label={intl.formatMessage({ id: 'ProviderAddressModal.cityLabel' })}
              placeholder={intl.formatMessage({ id: 'ProviderAddressModal.cityPlaceholder' })}
              value={formValues.city}
              onChange={handleChange}
              required
            />

            <FieldTextInput
              id="state"
              name="state"
              label={intl.formatMessage({ id: 'ProviderAddressModal.stateLabel' })}
              placeholder={intl.formatMessage({ id: 'ProviderAddressModal.statePlaceholder' })}
              value={formValues.state}
              onChange={handleChange}
              required
            />
          </div>

          <FieldTextInput
            id="zipCode"
            name="zipCode"
            label={intl.formatMessage({ id: 'ProviderAddressModal.zipCodeLabel' })}
            placeholder={intl.formatMessage({ id: 'ProviderAddressModal.zipCodePlaceholder' })}
            value={formValues.zipCode}
            onChange={handleChange}
            required
          />

          <FieldTextInput
            id="email"
            name="email"
            type="email"
            label={intl.formatMessage({ id: 'ProviderAddressModal.emailLabel' })}
            placeholder={intl.formatMessage({ id: 'ProviderAddressModal.emailPlaceholder' })}
            value={formValues.email}
            onChange={handleChange}
            required
          />

          <FieldTextInput
            id="phoneNumber"
            name="phoneNumber"
            type="tel"
            label={intl.formatMessage({ id: 'ProviderAddressModal.phoneNumberLabel' })}
            placeholder={intl.formatMessage({ id: 'ProviderAddressModal.phoneNumberPlaceholder' })}
            value={formValues.phoneNumber}
            onChange={handleChange}
            required
          />

          {submitError ? (
            <p className={css.error}>
              <FormattedMessage id="ProviderAddressModal.submitError" />
            </p>
          ) : null}

          <div className={css.buttons}>
            <SecondaryButton onClick={onCloseModal}>
              <FormattedMessage id="ProviderAddressModal.cancel" />
            </SecondaryButton>
            <PrimaryButton
              type="submit"
              inProgress={inProgress}
              disabled={!isFormValid() || inProgress}
              className={submitButtonClasses}
            >
              <FormattedMessage id="ProviderAddressModal.submit" />
            </PrimaryButton>
          </div>
        </Form>
      </div>
    </Modal>
  );
};

ProviderAddressModal.defaultProps = {
  className: null,
  rootClassName: null,
  initialValues: {},
  inProgress: false,
  submitError: null,
};

ProviderAddressModal.propTypes = {
  id: PropTypes.string.isRequired,
  className: PropTypes.string,
  rootClassName: PropTypes.string,
  isOpen: PropTypes.bool.isRequired,
  onCloseModal: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onManageDisableScrolling: PropTypes.func.isRequired,
  currentUser: PropTypes.object.isRequired,
  initialValues: PropTypes.object,
  inProgress: PropTypes.bool,
  submitError: PropTypes.object,
};

export default ProviderAddressModal; 