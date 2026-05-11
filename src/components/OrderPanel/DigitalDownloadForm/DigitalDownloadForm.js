import React from 'react';
import { Form as FinalForm } from 'react-final-form';

import { FormattedMessage, useIntl } from '../../../util/reactIntl';
import { propTypes } from '../../../util/types';
import { DOWNLOAD_PROCESS_NAME } from '../../../transactions/transaction';

import { Form, PrimaryButton, H3, H6 } from '../../../components';

import EstimatedCustomerBreakdownMaybe from '../EstimatedCustomerBreakdownMaybe';

import FetchLineItemsError from '../FetchLineItemsError/FetchLineItemsError.js';

import css from './DigitalDownloadForm.module.css';

const renderForm = formRenderProps => {
  const { handleSubmit, intl, formId, payoutDetailsWarning, isOwnListing } = formRenderProps;

  return (
    <Form onSubmit={handleSubmit}>
      <div className={css.submitButton}>
        <PrimaryButton type="submit">
          {intl.formatMessage({ id: 'DigitalDownloadForm.ctaButton' })}
        </PrimaryButton>
      </div>
      <p className={css.finePrint}>
        {payoutDetailsWarning
          ? payoutDetailsWarning
          : isOwnListing
          ? intl.formatMessage({ id: 'DigitalDownloadForm.ownListing' })
          : intl.formatMessage({ id: 'DigitalDownloadForm.finePrint' })}
      </p>
    </Form>
  );
};

/**
 * A form for initiating a digital download purchase.
 *
 * @component
 * @param {Object} props
 * @param {string} [props.rootClassName] - Custom class that overrides the default class for the root element
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} props.formId - The ID of the form
 * @param {Function} props.onSubmit - The function to handle the form submission
 * @param {boolean} props.isOwnListing - Whether the listing is owned by the current user
 * @param {string} [props.payoutDetailsWarning] - Warning about payout details
 * @returns {JSX.Element}
 */
const DigitalDownloadForm = props => {
  const intl = useIntl();

  return <FinalForm {...props} intl={intl} render={renderForm} />;
};

export default DigitalDownloadForm;
