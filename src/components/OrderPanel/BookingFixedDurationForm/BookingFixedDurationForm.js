import React, { useState } from 'react';
import { Field, Form as FinalForm } from 'react-final-form';
import classNames from 'classnames';

import { FormattedMessage, useIntl } from '../../../util/reactIntl';
import { timestampToDate } from '../../../util/dates';
import { propTypes } from '../../../util/types';
import { BOOKING_PROCESS_NAME } from '../../../transactions/transaction';

import { Form, H6, PrimaryButton, FieldSelect } from '../../../components';

import EstimatedCustomerBreakdownMaybe from '../EstimatedCustomerBreakdownMaybe';
import FieldDateAndTimeInput from './FieldDateAndTimeInput';

import css from './BookingFixedDurationForm.module.css';

const FieldHidden = props => {
  const { name, ...rest } = props;
  return (
    <Field id={name} name={name} type="hidden" className={css.unitTypeHidden} {...rest}>
      {fieldRenderProps => <input {...fieldRenderProps?.input} />}
    </Field>
  );
};

// When the values of the form are updated we need to fetch
// lineItems from this template's backend for the EstimatedTransactionMaybe
// In case you add more fields to the form, make sure you add
// the values here to the orderData object.
const handleFetchLineItems = props => formValues => {
  const {
    listingId,
    isOwnListing,
    fetchLineItemsInProgress,
    onFetchTransactionLineItems,
    seatsEnabled,
  } = props;
  const { bookingStartTime, bookingEndTime, seats } = formValues.values;
  const startDate = bookingStartTime ? timestampToDate(bookingStartTime) : null;
  const endDate = bookingEndTime ? timestampToDate(bookingEndTime) : null;

  // Note: we expect values bookingStartTime and bookingEndTime to be strings
  // which is the default case when the value has been selected through the form
  const isStartBeforeEnd = bookingStartTime < bookingEndTime;
  const seatsMaybe = seatsEnabled && seats > 0 ? { seats: parseInt(seats, 10) } : {};

  if (startDate && endDate && isStartBeforeEnd && !fetchLineItemsInProgress) {
    const orderData = {
      bookingStart: startDate,
      bookingEnd: endDate,
      ...seatsMaybe,
    };
    onFetchTransactionLineItems({
      orderData,
      listingId,
      isOwnListing,
    });
  }
};

/**
 * A form for selecting booking time.
 *
 * @component
 * @param {Object} props
 * @param {string} [props.rootClassName] - Custom class that overrides the default class for the root element
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {propTypes.money} props.price - The unit price of the listing
 * @param {boolean} props.isOwnListing - Whether the listing is owned by the current user
 * @param {propTypes.uuid} props.listingId - The ID of the listing
 * @param {Array<Object>} [props.priceVariants] - The price variants for the fixed bookings
 * @param {Object} props.monthlyTimeSlots - The monthly time slots
 * @param {Function} props.onFetchTimeSlots - The function to fetch the time slots
 * @param {string} props.timeZone - The time zone of the listing (e.g. "America/New_York")
 * @param {Function} props.onFetchTransactionLineItems - The function to fetch the transaction line items
 * @param {Object} props.lineItems - The line items
 * @param {boolean} props.fetchLineItemsInProgress - Whether line items are being fetched
 * @param {propTypes.error} props.fetchLineItemsError - The error for fetching line items
 * @param {string} [props.startDatePlaceholder] - The placeholder text for the start date
 * @param {number} props.dayCountAvailableForBooking - Number of days available for booking
 * @param {string} props.marketplaceName - Name of the marketplace
 * @returns {JSX.Element}
 */
export const BookingFixedDurationForm = props => {
  const intl = useIntl();
  const {
    rootClassName,
    className,
    price: unitPrice,
    dayCountAvailableForBooking,
    marketplaceName,
    seatsEnabled,
    priceVariants,
    ...rest
  } = props;

  const [seatsOptions, setSeatsOptions] = useState([1]);
  const priceVariant = priceVariants?.[0];
  const minDurationStartingInInterval = priceVariants.reduce((min, priceVariant) => {
    return Math.min(min, priceVariant.bookingLengthInMinutes);
  }, Number.MAX_SAFE_INTEGER);
  const classes = classNames(rootClassName || css.root, className);

  return (
    <FinalForm
      initialValues={{ priceVariant }}
      {...rest}
      unitPrice={unitPrice}
      render={formRenderProps => {
        const {
          startDatePlaceholder,
          form,
          pristine,
          handleSubmit,
          isOwnListing,
          listingId,
          startTimeInterval,
          values,
          monthlyTimeSlots,
          timeSlotsForDate,
          onFetchTimeSlots,
          timeZone,
          lineItems,
          fetchLineItemsInProgress,
          fetchLineItemsError,
          payoutDetailsWarning,
        } = formRenderProps;

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

        const onHandleFetchLineItems = handleFetchLineItems(props);

        return (
          <Form onSubmit={handleSubmit} className={classes} enforcePagePreloadFor="CheckoutPage">
            <FieldHidden
              name="priceVariant"
              format={value => {
                return value?.name == null ? 'default' : value.name;
              }}
              parse={value => {
                const response =
                  value === 'default'
                    ? priceVariants?.[0]
                    : priceVariants.find(pv => pv.name === value);
                return response;
              }}
            />

            {monthlyTimeSlots && timeZone ? (
              <FieldDateAndTimeInput
                seatsEnabled={seatsEnabled}
                setSeatsOptions={setSeatsOptions}
                startDateInputProps={{
                  label: intl.formatMessage({ id: 'BookingFixedDurationForm.bookingStartTitle' }),
                  placeholderText: startDatePlaceholder,
                }}
                className={css.bookingDates}
                listingId={listingId}
                startTimeInterval={startTimeInterval}
                onFetchTimeSlots={onFetchTimeSlots}
                monthlyTimeSlots={monthlyTimeSlots}
                timeSlotsForDate={timeSlotsForDate}
                minDurationStartingInInterval={minDurationStartingInInterval}
                values={values}
                intl={intl}
                form={form}
                pristine={pristine}
                timeZone={timeZone}
                dayCountAvailableForBooking={dayCountAvailableForBooking}
                handleFetchLineItems={onHandleFetchLineItems}
              />
            ) : null}
            {seatsEnabled ? (
              <FieldSelect
                name="seats"
                id="seats"
                disabled={!startTime}
                label={intl.formatMessage({ id: 'BookingFixedDurationForm.seatsTitle' })}
                className={css.fieldSeats}
                onChange={values => {
                  onHandleFetchLineItems({
                    values: {
                      bookingStartTime: startTime,
                      bookingEndTime: endTime,
                      seats: values,
                    },
                  });
                }}
              >
                <option disabled value="">
                  {intl.formatMessage({ id: 'BookingFixedDurationForm.seatsPlaceholder' })}
                </option>
                {seatsOptions.map(s => (
                  <option value={s} key={s}>
                    {s}
                  </option>
                ))}
              </FieldSelect>
            ) : null}

            {showEstimatedBreakdown ? (
              <div className={css.priceBreakdownContainer}>
                <H6 as="h3" className={css.bookingBreakdownTitle}>
                  <FormattedMessage id="BookingFixedDurationForm.priceBreakdownTitle" />
                </H6>
                <hr className={css.totalDivider} />
                <EstimatedCustomerBreakdownMaybe
                  breakdownData={breakdownData}
                  lineItems={lineItems}
                  timeZone={timeZone}
                  currency={unitPrice.currency}
                  marketplaceName={marketplaceName}
                  processName={BOOKING_PROCESS_NAME}
                />
              </div>
            ) : null}

            {fetchLineItemsError ? (
              <span className={css.sideBarError}>
                <FormattedMessage id="BookingFixedDurationForm.fetchLineItemsError" />
              </span>
            ) : null}

            <div className={css.submitButton}>
              <PrimaryButton type="submit" inProgress={fetchLineItemsInProgress}>
                <FormattedMessage id="BookingFixedDurationForm.requestToBook" />
              </PrimaryButton>
            </div>

            <p className={css.finePrint}>
              {payoutDetailsWarning ? (
                payoutDetailsWarning
              ) : (
                <FormattedMessage
                  id={
                    isOwnListing
                      ? 'BookingFixedDurationForm.ownListing'
                      : 'BookingFixedDurationForm.youWontBeChargedInfo'
                  }
                />
              )}
            </p>
          </Form>
        );
      }}
    />
  );
};

export default BookingFixedDurationForm;
