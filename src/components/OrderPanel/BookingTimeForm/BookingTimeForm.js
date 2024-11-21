import React, { Component } from 'react';
import { array, bool, func, number, object, string } from 'prop-types';
import { compose } from 'redux';
import { Form as FinalForm, FormSpy } from 'react-final-form';
import classNames from 'classnames';
import arrayMutators from 'final-form-arrays';
import { size } from 'lodash';
import { NamedLink, Form, H6, PrimaryButton, FieldCheckbox } from '../..';
import { FormattedMessage, intlShape, injectIntl } from '../../../util/reactIntl';
import { timestampToDate } from '../../../util/dates';
import { propTypes } from '../../../util/types';
import { BOOKING_PROCESS_NAME, FREE_BOOKING_PROCESS_NAME } from '../../../transactions/transaction';
import EstimatedCustomerBreakdownMaybe from '../EstimatedCustomerBreakdownMaybe';
import FieldDateAndTimeInput from './FieldDateAndTimeInput';
import VoucherForm from '../../VoucherForm/VoucherForm';

import css from './BookingTimeForm.module.css';

export class BookingTimeFormComponent extends Component {
  constructor(props) {
    super(props);
    this.handleFormSubmit = this.handleFormSubmit.bind(this);
    this.handleOnChange = this.handleOnChange.bind(this);
    this.state = {
      isSeatsInputValid: false,
    };
  }

  handleFormSubmit(e) {
    this.props.onSubmit(e);
  }

  handleSeatsInputValidChange = (isValid) => {
    this.setState({ isSeatsInputValid: isValid });
  };

  // When the values of the form are updated we need to fetch
  // lineItems from this template's backend for the EstimatedTransactionMaybe
  // In case you add more fields to the form, make sure you add
  // the values here to the orderData object.
  handleOnChange(formValues) {
    const {
      bookingStartTime,
      bookingEndTime,
      seats = 1,
      voucherFee = {},
      fee = [],
      lineItems = [],
    } = formValues.values;
    const startDate = bookingStartTime ? timestampToDate(bookingStartTime) : null;
    const endDate = bookingEndTime ? timestampToDate(bookingEndTime) : null;

    const { listingId } = this.props;
    const { isOwnListing } = this.props;

    const isStartBeforeEnd = bookingStartTime < bookingEndTime;

    if (
      bookingStartTime &&
      bookingEndTime &&
      isStartBeforeEnd &&
      !this.props.fetchLineItemsInProgress
    ) {
      const orderData = {
        bookingStart: startDate,
        bookingEnd: endDate,
        seats: parseInt(seats, 10),
        voucherFee,
        lineItems,
        fee,
      };
      this.props.onFetchTransactionLineItems({
        orderData,
        listingId,
        isOwnListing,
      });
    }
  }

  render() {
    const {
      rootClassName,
      className,
      price: unitPrice,
      dayCountAvailableForBooking,
      marketplaceName,
      author,
      currentUser,
      publicData,
      ...rest
    } = this.props;
    const classes = classNames(rootClassName || css.root, className);

    const emailVerified =
      currentUser && currentUser.attributes && currentUser.attributes.emailVerified;

    const processName = this.props.publicData?.listingType ?? 'default-booking';
    return (
      <FinalForm
        {...rest}
        unitPrice={unitPrice}
        mutators={{ ...arrayMutators }}
        onSubmit={this.handleFormSubmit}
        render={(fieldRenderProps) => {
          const {
            endDatePlaceholder,
            startDatePlaceholder,
            form,
            pristine,
            handleSubmit,
            intl,
            formId,
            isOwnListing,
            listingId,
            values,
            monthlyTimeSlots,
            onFetchTimeSlots,
            timeZone,
            lineItems,
            fetchLineItemsInProgress,
            fetchLineItemsError,
            payoutDetailsWarning,
            voucherFee,
            mediumFee,
          } = fieldRenderProps;

          const startTime = values && values.bookingStartTime ? values.bookingStartTime : null;
          const endTime = values && values.bookingEndTime ? values.bookingEndTime : null;
          const startDate = startTime ? timestampToDate(startTime) : null;
          const endDate = endTime ? timestampToDate(endTime) : null;

          // This is the place to collect breakdown estimation data. See the
          // EstimatedCustomerBreakdownMaybe component to change the calculations
          // for customized payment processes.
          const breakdownData =
            startDate && endDate
              ? {
                  startDate,
                  endDate,
                }
              : null;

          const showEstimatedBreakdown =
            breakdownData && lineItems && !fetchLineItemsInProgress && !fetchLineItemsError;

          return (
            <Form onSubmit={handleSubmit} className={classes} enforcePagePreloadFor="CheckoutPage">
              <FormSpy
                subscription={{ values: true }}
                onChange={(values) => {
                  this.handleOnChange(values);
                }}
              />
              {monthlyTimeSlots && timeZone ? (
                <FieldDateAndTimeInput
                  startDateInputProps={{
                    label: intl.formatMessage({ id: 'BookingTimeForm.bookingStartTitle' }),
                    placeholderText: startDatePlaceholder,
                  }}
                  endDateInputProps={{
                    label: intl.formatMessage({ id: 'BookingTimeForm.bookingEndTitle' }),
                    placeholderText: endDatePlaceholder,
                  }}
                  className={css.bookingDates}
                  listingId={listingId}
                  onFetchTimeSlots={onFetchTimeSlots}
                  monthlyTimeSlots={monthlyTimeSlots}
                  values={values}
                  intl={intl}
                  form={form}
                  formId={formId}
                  mediumFee={mediumFee}
                  pristine={pristine}
                  timeZone={timeZone}
                  dayCountAvailableForBooking={dayCountAvailableForBooking}
                  onSeatsInputValidChange={this.handleSeatsInputValidChange}
                  publicData={publicData}
                />
              ) : null}

              {showEstimatedBreakdown ? (
                <div className={css.priceBreakdownContainer}>
                  {processName === 'default-booking' && (
                    <H6 as="h3" className={css.bookingBreakdownTitle}>
                      <FormattedMessage id="BookingTimeForm.priceBreakdownTitle" />
                    </H6>
                  )}
                  <hr className={css.totalDivider} />
                  <EstimatedCustomerBreakdownMaybe
                    breakdownData={breakdownData}
                    lineItems={lineItems}
                    timeZone={timeZone}
                    currency={unitPrice.currency}
                    marketplaceName={marketplaceName}
                    processName={processName}
                  />
                </div>
              ) : null}

              {fetchLineItemsError ? (
                <span className={css.sideBarError}>
                  <FormattedMessage id="BookingTimeForm.fetchLineItemsError" />
                </span>
              ) : null}

              {showEstimatedBreakdown ? (
                <div className={css.priceBreakdownContainer}>
                  {processName !== 'free-booking' && (
                    <VoucherForm
                      className={css.bookingDates}
                      listingId={listingId}
                      onFetchTimeSlots={onFetchTimeSlots}
                      monthlyTimeSlots={monthlyTimeSlots}
                      values={values}
                      intl={intl}
                      form={form}
                      pristine={pristine}
                      timeZone={timeZone}
                      voucherFee={voucherFee}
                      publicData={publicData}
                      lineItems={lineItems}
                    />
                  )}
                </div>
              ) : null}

              <FormSpy
                subscription={{ values: true }}
                onChange={(formState) => {
                  const { guestNames, fee, seats } = formState.values;
                  const listingId = this.props.listingId.uuid;
                  // EXCEPTION FOR PRIVATE EVENTS
                  // Ensure seats is a number
                  const numberOfSeats = parseInt(seats, 10);

                  // Adjust guestNames validation: check if all names are valid non-empty strings
                  // const isGuestNamesValid = guestNames && guestNames.length === numberOfSeats && guestNames.every(name => typeof name === 'string' && name.trim().length > 0);

                  // Validate fees only for the specific listing ID
                  const isFeeValid =
                    listingId === '66dac9f8-e2e3-4611-a30c-64df1ef9ff68'
                      ? fee &&
                        fee.length === numberOfSeats &&
                        fee.every((f) => typeof f === 'string' && f.trim().length > 0)
                      : true;

                  // Disable the button if any of the following conditions are met:
                  // 1. If guest names are not filled out properly.
                  // 2. If the fee array has an empty value or doesn't match the number of guests (only for the specific listing).
                  const shouldDisableSubmit = !isFeeValid;

                  // Update the state to reflect the disable status
                  this.setState({ disableSubmit: shouldDisableSubmit });
                }}
              />

              {/* PrimaryButton for submission */}
              <div className={css.submitButton}>
                <PrimaryButton
                  type="submit"
                  inProgress={fetchLineItemsInProgress}
                  disabled={this.state.disableSubmit}
                >
                  <FormattedMessage id="BookingTimeForm.requestToBook" />
                </PrimaryButton>
              </div>

              <p className={css.finePrint}>
                {payoutDetailsWarning || (
                  <FormattedMessage
                    id={
                      isOwnListing
                        ? 'BookingTimeForm.ownListing'
                        : 'BookingTimeForm.youWontBeChargedInfo'
                    }
                  />
                )}
              </p>
            </Form>
          );
        }}
      />
    );
  }
}

BookingTimeFormComponent.defaultProps = {
  rootClassName: null,
  className: null,
  price: null,
  isOwnListing: false,
  listingId: null,
  startDatePlaceholder: null,
  endDatePlaceholder: null,
  monthlyTimeSlots: null,
  lineItems: null,
  fetchLineItemsError: null,
};

BookingTimeFormComponent.propTypes = {
  rootClassName: string,
  className: string,

  marketplaceName: string.isRequired,
  price: propTypes.money,
  isOwnListing: bool,
  listingId: propTypes.uuid,
  monthlyTimeSlots: object,
  onFetchTimeSlots: func.isRequired,
  timeZone: string.isRequired,

  onFetchTransactionLineItems: func.isRequired,
  lineItems: array,
  fetchLineItemsInProgress: bool.isRequired,
  fetchLineItemsError: propTypes.error,

  // from injectIntl
  intl: intlShape.isRequired,

  // for tests
  startDatePlaceholder: string,
  endDatePlaceholder: string,

  dayCountAvailableForBooking: number.isRequired,
};

const BookingTimeForm = compose(injectIntl)(BookingTimeFormComponent);
BookingTimeForm.displayName = 'BookingTimeForm';

export default BookingTimeForm;
