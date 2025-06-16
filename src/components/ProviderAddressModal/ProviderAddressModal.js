import React from 'react';
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

  const classes = classNames(rootClassName || css.root, className);

  const handleSubmit = values => {
    onSubmit(values);
  };

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

        <Form
          onSubmit={handleSubmit}
          initialValues={initialValues}
          render={({ handleSubmit, values, invalid, submitting }) => (
            <form className={css.form} onSubmit={handleSubmit}>
              <FieldTextInput
                id="fullName"
                name="fullName"
                label={intl.formatMessage({ id: 'ProviderAddressModal.fullNameLabel' })}
                placeholder={intl.formatMessage({ id: 'ProviderAddressModal.fullNamePlaceholder' })}
                required
              />

              <FieldTextInput
                id="streetAddress"
                name="streetAddress"
                label={intl.formatMessage({ id: 'ProviderAddressModal.streetAddressLabel' })}
                placeholder={intl.formatMessage({ id: 'ProviderAddressModal.streetAddressPlaceholder' })}
                required
              />

              <div className={css.cityStateRow}>
                <FieldTextInput
                  id="city"
                  name="city"
                  label={intl.formatMessage({ id: 'ProviderAddressModal.cityLabel' })}
                  placeholder={intl.formatMessage({ id: 'ProviderAddressModal.cityPlaceholder' })}
                  required
                />

                <FieldTextInput
                  id="state"
                  name="state"
                  label={intl.formatMessage({ id: 'ProviderAddressModal.stateLabel' })}
                  placeholder={intl.formatMessage({ id: 'ProviderAddressModal.statePlaceholder' })}
                  required
                />
              </div>

              <FieldTextInput
                id="zipCode"
                name="zipCode"
                label={intl.formatMessage({ id: 'ProviderAddressModal.zipCodeLabel' })}
                placeholder={intl.formatMessage({ id: 'ProviderAddressModal.zipCodePlaceholder' })}
                required
              />

              <FieldTextInput
                id="email"
                name="email"
                type="email"
                label={intl.formatMessage({ id: 'ProviderAddressModal.emailLabel' })}
                placeholder={intl.formatMessage({ id: 'ProviderAddressModal.emailPlaceholder' })}
                required
              />

              <FieldTextInput
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                label={intl.formatMessage({ id: 'ProviderAddressModal.phoneNumberLabel' })}
                placeholder={intl.formatMessage({ id: 'ProviderAddressModal.phoneNumberPlaceholder' })}
                required
              />

              {submitError ? (
                <p className={css.error}>
                  <FormattedMessage id="ProviderAddressModal.submitError" />
                </p>
              ) : null}

              <div className={css.buttons}>
                <SecondaryButton onClick={onCloseModal} type="button">
                  <FormattedMessage id="ProviderAddressModal.cancel" />
                </SecondaryButton>
                <PrimaryButton
                  type="submit"
                  inProgress={inProgress || submitting}
                  disabled={invalid || inProgress || submitting}
                  className={css.submitButton}
                >
                  <FormattedMessage id="ProviderAddressModal.submit" />
                </PrimaryButton>
              </div>
            </form>
          )}
        />
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