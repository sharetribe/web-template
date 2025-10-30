import React, { useState } from 'react';
import { Form as FinalForm } from 'react-final-form';
import classNames from 'classnames';

import { FormattedMessage, useIntl } from '../../../util/reactIntl';
import { timestampToDate } from '../../../util/dates';
import { propTypes } from '../../../util/types';
import { BOOKING_PROCESS_NAME } from '../../../transactions/transaction';

import { Form, H6, PrimaryButton, FieldSelect } from '../../../components';

import EstimatedCustomerBreakdownMaybe from '../EstimatedCustomerBreakdownMaybe';
import FieldDateAndTimeInput from './FieldDateAndTimeInput';

import FetchLineItemsError from '../FetchLineItemsError/FetchLineItemsError.js';

import css from './BookingFixedDurationForm.module.css';

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
  const { bookingStartTime, bookingEndTime, seats, priceVariantName } = formValues.values;
  const startDate = bookingStartTime ? timestampToDate(bookingStartTime) : null;
  const endDate = bookingEndTime ? timestampToDate(bookingEndTime) : null;

  // Note: we expect values bookingStartTime and bookingEndTime to be strings
  // which is the default case when the value has been selected through the form
  const isStartBeforeEnd = bookingStartTime < bookingEndTime;
  const seatsMaybe = seatsEnabled && seats > 0 ? { seats: parseInt(seats, 10) } : {};

  const priceVariantMaybe = priceVariantName ? { priceVariantName } : {};

  if (startDate && endDate && isStartBeforeEnd && !fetchLineItemsInProgress) {
    const orderData = {
      bookingStart: startDate,
      bookingEnd: endDate,
      ...seatsMaybe,
      ...priceVariantMaybe,
    };
    onFetchTransactionLineItems({
      orderData,
      listingId,
      isOwnListing,
    });
  }
};

const onPriceVariantChange = props => value => {
  const { form: formApi, seatsEnabled } = props;

  formApi.batch(() => {
    formApi.change('bookingStartDate', null);
    formApi.change('bookingStartTime', null);
    formApi.change('bookingEndTime', null);
    if (seatsEnabled) {
      formApi.change('seats', 1);
    }
  });
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
 * @param {Array<Object>} [props.priceVariants] - The price variants
 * @param {ReactNode} [props.priceVariantFieldComponent] - The component to use for the price variant field
 * @param {boolean} props.isPublishedListing - Whether the listing is published
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
    isPriceVariationsInUse,
    priceVariants = [],
    priceVariantFieldComponent: PriceVariantFieldComponent,
    preselectedPriceVariant,
    isPublishedListing,
    ...rest
  } = props;

  const [seatsOptions, setSeatsOptions] = useState([1]);
  const initialValuesMaybe =
    priceVariants.length > 1 && preselectedPriceVariant
      ? { initialValues: { priceVariantName: preselectedPriceVariant?.name } }
      : priceVariants.length === 1
      ? { initialValues: { priceVariantName: priceVariants?.[0]?.name || null } }
      : {};

  const minDurationStartingInInterval = priceVariants.reduce((min, priceVariant) => {
    return Math.min(min, priceVariant.bookingLengthInMinutes);
  }, Number.MAX_SAFE_INTEGER);
  const classes = classNames(rootClassName || css.root, className);

  return (
    <FinalForm
      {...initialValuesMaybe}
      {...rest}
      unitPrice={unitPrice}
      render={formRenderProps => {
        const {
          startDatePlaceholder,
          form,
          pristine,
          handleSubmit,
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
          isOwnListing,
          finePrintComponent: FinePrint,
        } = formRenderProps;

        const startTime = values?.bookingStartTime ? values.bookingStartTime : null;
        const endTime = values?.bookingEndTime ? values.bookingEndTime : null;
        const startDate = startTime ? timestampToDate(startTime) : null;
        const endDate = endTime ? timestampToDate(endTime) : null;
        const priceVariantName = values?.priceVariantName || null;

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
        const submitDisabled = isPriceVariationsInUse && !isPublishedListing;

        return (
          <Form onSubmit={handleSubmit} className={classes} enforcePagePreloadFor="CheckoutPage">
            <PriceVariantFieldComponent
              priceVariants={priceVariants}
              priceVariantName={priceVariantName}
              onPriceVariantChange={onPriceVariantChange(formRenderProps)}
              disabled={!isPublishedListing}
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
                priceVariants={priceVariants}
                intl={intl}
                form={form}
                pristine={pristine}
                disabled={isPriceVariationsInUse && !priceVariantName}
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
                showLabelAsDisabled={!startTime}
                label={intl.formatMessage({ id: 'BookingFixedDurationForm.seatsTitle' })}
                className={css.fieldSeats}
                onChange={values => {
                  onHandleFetchLineItems({
                    values: {
                      priceVariantName,
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

            <FetchLineItemsError error={fetchLineItemsError} />

            <div className={css.submitButton}>
              <PrimaryButton
                type="submit"
                inProgress={fetchLineItemsInProgress}
                disabled={submitDisabled}
              >
                <FormattedMessage id="BookingFixedDurationForm.requestToBook" />
              </PrimaryButton>
            </div>

            <FinePrint payoutDetailsWarning={payoutDetailsWarning} isOwnListing={isOwnListing} />
          </Form>
        );
      }}
    />
  );
};

export default BookingFixedDurationForm;
