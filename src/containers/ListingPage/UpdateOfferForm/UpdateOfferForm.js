import classNames from 'classnames';
import { bool, string } from 'prop-types';
import React, { useEffect, useState } from 'react';
import { Form as FinalForm } from 'react-final-form';
import { compose } from 'redux';

import {
  isErrorNoPermissionForInitiateTransactions,
  isErrorNoPermissionForUserPendingApproval,
  isTooManyRequestsError,
} from '../../../util/errors';
import { FormattedMessage, injectIntl, intlShape } from '../../../util/reactIntl';
import { propTypes } from '../../../util/types';
import * as validators from '../../../util/validators';

import {
  FieldCurrencyInput,
  FieldTextInput,
  Form,
  Heading,
  IconBack,
  NamedLink,
  PrimaryButton,
} from '../../../components';

import appSettings from '../../../config/settings';
import { formatMoney } from '../../../util/currency';
import { NO_ACCESS_PAGE_INITIATE_TRANSACTIONS } from '../../../util/urlHelpers';
import css from './UpdateOfferForm.module.css';
const { types } = require('sharetribe-flex-sdk');
const { Money } = types;

const ErrorMessage = props => {
  const { error } = props;
  const userPendingApproval = isErrorNoPermissionForUserPendingApproval(error);
  const userHasNoTransactionRights = isErrorNoPermissionForInitiateTransactions(error);

  // No transaction process attached to listing
  return error ? (
    <p className={css.error}>
      {error.message === 'No transaction process attached to listing' ? (
        <FormattedMessage id="InquiryForm.sendInquiryErrorNoProcess" />
      ) : isTooManyRequestsError(error) ? (
        <FormattedMessage id="InquiryForm.tooManyRequestsError" />
      ) : userPendingApproval ? (
        <FormattedMessage id="InquiryForm.userPendingApprovalError" />
      ) : userHasNoTransactionRights ? (
        <FormattedMessage
          id="InquiryForm.noTransactionRightsError"
          values={{
            NoAccessLink: msg => (
              <NamedLink
                name="NoAccessPage"
                params={{ missingAccessRight: NO_ACCESS_PAGE_INITIATE_TRANSACTIONS }}
              >
                {msg}
              </NamedLink>
            ),
          }}
        />
      ) : (
        <FormattedMessage id="InquiryForm.sendInquiryError" />
      )}
    </p>
  ) : null;
};

const getInitialValues = (description, convertedSharetribePrice, id) => {
  const offerPrice = convertedSharetribePrice;
  return { message: description, offerPrice, offerId: id };
};

// NOTE: this InquiryForm is only for booking & purchase processes
// The default-inquiry process is handled differently
const UpdateOfferFormComponent = props => {
  const { flex_price, listing } = props || {};

  const { attributes, id } = listing || {};
  const { description, price } = attributes || {};
  const defaultPrice = new Money(price?.amount ?? 0, price?.currency ?? 'EUR');
  const [inquiryFormPage, setInquiryFormPage] = useState(1);
  const [offerPriceValue, setOfferPriceValue] = useState(defaultPrice);
  const [initialValues, setInitialValues] = useState({ offerPrice: defaultPrice });
  useEffect(() => {
    if (listing) {
      const convertedSharetribePrice = new Money(price?.amount, price?.currency);
      setOfferPriceValue(convertedSharetribePrice);
      const inti = getInitialValues(description, convertedSharetribePrice, id.uuid);

      setInitialValues(inti);
    }
  }, [listing]);
  return (
    <FinalForm
      {...props}
      initialValues={initialValues}
      validate={() => {
        const errors = {};
        if (!offerPriceValue) {
          const emailTakenMessage = props.intl.formatMessage({
            id: 'CustomInquiryForm.offerPriceRequired',
          });
          errors.offerPrice = emailTakenMessage;
        }
        return errors;
      }}
      render={fieldRenderProps => {
        const {
          rootClassName,
          className,
          submitButtonWrapperClassName,
          formId,
          handleSubmit,
          inProgress,
          intl,
          authorDisplayName,
          sendInquiryError,
          marketplaceCurrency,
          form,
          values,
        } = fieldRenderProps;

        const messageLabel = intl.formatMessage(
          {
            id: 'CustomInquiryForm.messageLabel',
          },
          { authorDisplayName }
        );
        const messagePlaceholder = intl.formatMessage(
          {
            id: 'CustomInquiryForm.messagePlaceholder',
          },
          { authorDisplayName }
        );
        const messageRequiredMessage = intl.formatMessage({
          id: 'InquiryForm.messageRequired',
        });

        const offerPriceLabel = intl.formatMessage(
          {
            id: 'CustomInquiryForm.offePriceLabel',
          },
          { authorDisplayName }
        );
        const offerPricePlaceholder = intl.formatMessage(
          {
            id: 'CustomInquiryForm.offerPricePlaceholder',
          },
          { authorDisplayName }
        );
        const offerPriceRequiredMessage = intl.formatMessage({
          id: 'CustomInquiryForm.offerPriceRequired',
        });
        const messageRequired = validators.requiredAndNonEmptyString(messageRequiredMessage);

        const offerPriceRequired = validators.requiredAndNonEmptyString(offerPriceRequiredMessage);

        const classes = classNames(rootClassName || css.root, className);
        const submitInProgress = inProgress;
        const submitDisabled = submitInProgress;
        const { offerPrice } = values || {};
        if (offerPrice.amount !== 0) setOfferPriceValue(offerPrice);
        const commissionPrice =
          offerPrice && new Money(offerPrice.amount / 10, offerPrice.currency);
        const formattedCommissionPrice = commissionPrice && formatMoney(intl, commissionPrice);
        const earnPrice =
          commissionPrice &&
          new Money(offerPrice.amount - commissionPrice.amount, offerPrice.currency);
        const formattedEarnPrice = earnPrice ? formatMoney(intl, earnPrice) : '-';
        return (
          <Form
            className={classes}
            onSubmit={handleSubmit}
            enforcePagePreloadFor="OrderDetailsPage"
          >
            {inquiryFormPage === 2 ? (
              <div onClick={() => setInquiryFormPage(1)}>
                {' '}
                <IconBack />
              </div>
            ) : null}
            <Heading as="h2" rootClassName={css.heading}>
              <FormattedMessage id="CustomInquiryForm.heading" />
            </Heading>
            {inquiryFormPage === 1 ? (
              <div>
                <FieldCurrencyInput
                  className={css.field}
                  name="offerPrice"
                  id={formId ? `${formId}.offerPrice` : 'offerPrice'}
                  label={offerPriceLabel}
                  placeholder={offerPricePlaceholder}
                  currencyConfig={appSettings.getCurrencyFormatting(marketplaceCurrency)}
                  disabled={!flex_price}
                />

                <div className={classNames(css.flexContent, css.commissionContent)}>
                  <FormattedMessage id="CustomInquiryForm.commission" />
                  <div>- {formattedCommissionPrice}</div>
                </div>
                <div className={classNames(css.flexContent, css.earnContent)}>
                  <FormattedMessage id="CustomInquiryForm.earn" />
                  <div>{formattedEarnPrice}</div>
                </div>

                <div className={css.emailNoti}>
                  <FormattedMessage id="CustomInquiryForm.commissionNoti" />
                </div>

                <div className={submitButtonWrapperClassName}>
                  <PrimaryButton
                    type="button"
                    inProgress={submitInProgress}
                    disabled={submitDisabled}
                    onClick={() => {
                      // form.validate();
                      if (offerPrice) setInquiryFormPage(2);
                    }}
                  >
                    <FormattedMessage id="InquiryForm.submitButtonText" />
                  </PrimaryButton>
                </div>
              </div>
            ) : (
              <div>
                <FieldTextInput
                  className={css.field}
                  type="textarea"
                  name="message"
                  id={formId ? `${formId}.message` : 'message'}
                  label={messageLabel}
                  placeholder={messagePlaceholder}
                  validate={messageRequired}
                />
                <div className={css.emailNoti}>
                  <FormattedMessage
                    id="CustomInquiryForm.emailNoti"
                    values={{
                      boldText: <span style={{ fontWeight: 'bold' }}>Cosa succede dopo?</span>,
                    }}
                  />
                </div>
                <div className={submitButtonWrapperClassName}>
                  <ErrorMessage error={sendInquiryError} />
                  <PrimaryButton
                    type="submit"
                    inProgress={submitInProgress}
                    disabled={submitDisabled}
                  >
                    <FormattedMessage id="InquiryForm.submitButtonText" />
                  </PrimaryButton>
                </div>
                {id ? (
                  <FieldTextInput
                    className={css.offerId}
                    type="text"
                    name="offerId"
                    id={formId ? `${formId}.offerId` : 'offerId'}
                    label={messageLabel}
                  />
                ) : null}
              </div>
            )}
          </Form>
        );
      }}
    />
  );
};

UpdateOfferFormComponent.defaultProps = {
  rootClassName: null,
  className: null,
  submitButtonWrapperClassName: null,
  inProgress: false,
  sendInquiryError: null,
};

UpdateOfferFormComponent.propTypes = {
  rootClassName: string,
  className: string,
  submitButtonWrapperClassName: string,

  inProgress: bool,

  // listingTitle: string.isRequired,
  authorDisplayName: string.isRequired,
  sendInquiryError: propTypes.error,

  // from injectIntl
  intl: intlShape.isRequired,
};

const UpdateOfferForm = compose(injectIntl)(UpdateOfferFormComponent);

UpdateOfferForm.displayName = 'UpdateOfferForm';

export default UpdateOfferForm;
