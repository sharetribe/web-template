import React, { useEffect } from 'react';
import { Form as FinalForm } from 'react-final-form';
import classNames from 'classnames';

import { FormattedMessage, useIntl } from '../../../util/reactIntl';
import { DOWNLOAD_PROCESS_NAME } from '../../../transactions/transaction';

import { Form, PrimaryButton, H6 } from '../../../components';

import EstimatedCustomerBreakdownMaybe from '../EstimatedCustomerBreakdownMaybe';

import FetchLineItemsError from '../FetchLineItemsError/FetchLineItemsError.js';

import css from './DigitalDownloadForm.module.css';

const handleFetchLineItems = ({
  listingId,
  isOwnListing,
  fetchLineItemsInProgress,
  onFetchTransactionLineItems,
}) => {
  const isBrowser = typeof window !== 'undefined';
  if (isBrowser && !fetchLineItemsInProgress) {
    onFetchTransactionLineItems({
      listingId,
      isOwnListing,
    });
  }
};

const renderForm = formRenderProps => {
  // FormRenderProps from final-form
  const {
    handleSubmit,
    intl,
    formId,
    payoutDetailsWarning,
    className,
    rootClassName,
    listingId,
    isOwnListing,
    lineItems,
    price,
    fetchLineItemsInProgress,
    fetchLineItemsError = true,
    onFetchTransactionLineItems,
    marketplaceName,
    finePrintComponent: FinePrint,
  } = formRenderProps;

  const classes = classNames(rootClassName || css.root, className);
  // The digital-file unit type does not have any price modifiers, so we pass an empty object as breakdownData
  const breakdownData = {};
  const showBreakdown =
    breakdownData && lineItems && !fetchLineItemsInProgress && !fetchLineItemsError;

  const submitInProgress = fetchLineItemsInProgress;
  const submitDisabled = !!fetchLineItemsError; // TODO: ask vesa if the button should be disabled on error

  useEffect(() => {
    handleFetchLineItems({
      listingId,
      isOwnListing,
      fetchLineItemsInProgress,
      onFetchTransactionLineItems,
    });
  }, []);

  return (
    <Form id={formId} onSubmit={handleSubmit} className={classes}>
      {showBreakdown ? (
        <div className={css.breakdownWrapper}>
          <H6 as="h3" className={css.bookingBreakdownTitle}>
            <FormattedMessage id="DigitalDownloadForm.breakdownTitle" />
          </H6>
          <hr className={css.totalDivider} />
          <EstimatedCustomerBreakdownMaybe
            breakdownData={breakdownData}
            lineItems={lineItems}
            currency={price.currency}
            marketplaceName={marketplaceName}
            processName={DOWNLOAD_PROCESS_NAME}
          />
        </div>
      ) : null}

      <FetchLineItemsError error={fetchLineItemsError} />

      <div className={css.submitButton}>
        <PrimaryButton inProgress={submitInProgress} disabled={submitDisabled} type="submit">
          <FormattedMessage id="DigitalDownloadForm.ctaButton" />
        </PrimaryButton>
        <FinePrint
          payoutDetailsWarning={payoutDetailsWarning}
          isOwnListing={isOwnListing}
          // omitYouWontBeChargedMessage={true} TODO: Ask Vesa should this be included or not
        />
      </div>
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
  const initialValues = {};

  return <FinalForm initialValues={initialValues} {...props} intl={intl} render={renderForm} />;
};

export default DigitalDownloadForm;
