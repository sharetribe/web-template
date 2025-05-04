import React, { useState } from 'react';
import { Form as FinalForm } from 'react-final-form';
import classNames from 'classnames';

import { FormattedMessage, useIntl } from '../../../util/reactIntl';
import { timestampToDate } from '../../../util/dates';
import { propTypes } from '../../../util/types';
import { BOOKING_PROCESS_NAME } from '../../../transactions/transaction';
import { useConfiguration } from '../../../context/configurationContext';
import { getDefaultTimeZoneOnBrowser, getTimeZoneBadgeContent } from '../../../util/dates';

import { Form, H6, PrimaryButton, FieldSelect } from '../../../components';

// [SKYFARER]
// TODO: When voucherify merges PR #275, we can switch to the original package
// Don't forget to change the dynamic CSS import ~ line 195
// import { VoucherifyValidate } from '@voucherify/react-widget';
import { VoucherifyValidate } from '@mathiscode/voucherify-react-widget/dist/voucherifywidget.umd.development.js';

import Logo from '../../../assets/logo-icon.png';

import EstimatedCustomerBreakdownMaybe from '../EstimatedCustomerBreakdownMaybe';
import FieldDateAndTimeInput from './FieldDateAndTimeInput';

import css from './BookingTimeForm.module.css';
import ConsultationBox from '../../ConsultationBox/ConsultationBox'; // [SKYFARER]

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

  if (bookingStartTime && bookingEndTime && isStartBeforeEnd && !fetchLineItemsInProgress) {
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
 * @param {Object} props.monthlyTimeSlots - The monthly time slots
 * @param {Function} props.onFetchTimeSlots - The function to fetch the time slots
 * @param {string} props.timeZone - The time zone of the listing (e.g. "America/New_York")
 * @param {Function} props.onFetchTransactionLineItems - The function to fetch the transaction line items
 * @param {Object} props.lineItems - The line items
 * @param {boolean} props.fetchLineItemsInProgress - Whether line items are being fetched
 * @param {propTypes.error} props.fetchLineItemsError - The error for fetching line items
 * @param {string} [props.startDatePlaceholder] - The placeholder text for the start date
 * @param {string} [props.endDatePlaceholder] - The placeholder text for the end date
 * @param {number} props.dayCountAvailableForBooking - Number of days available for booking
 * @param {string} props.marketplaceName - Name of the marketplace
 * @param {Array<Object>} [props.priceVariants] - The price variants
 * @param {ReactNode} [props.priceVariantFieldComponent] - The component to use for the price variant field
 * @param {boolean} props.isPublishedListing - Whether the listing is published
 * @returns {JSX.Element}
 */
export const BookingTimeForm = props => {
  const intl = useIntl();
  const {
    rootClassName,
    className,
    price: unitPrice,
    dayCountAvailableForBooking,
    marketplaceName,
    reschedule, // [SKYFARER]
    seatsEnabled,
    isPriceVariationsInUse,
    priceVariants = [],
    priceVariantFieldComponent: PriceVariantFieldComponent,
    preselectedPriceVariant,
    isPublishedListing,
    ...rest
  } = props;

  const config = useConfiguration();
  const [voucherInfo, setVoucherInfo] = useState('');
  const [voucher, setVoucher] = useState(null);
  if (typeof window !== 'undefined') import('@mathiscode/voucherify-react-widget/dist/voucherify.css');

  const [seatsOptions, setSeatsOptions] = useState([1]);
  const initialValuesMaybe =
    priceVariants.length > 1 && preselectedPriceVariant
      ? { initialValues: { priceVariantName: preselectedPriceVariant?.name } }
      : priceVariants.length === 1
      ? { initialValues: { priceVariantName: priceVariants?.[0]?.name } }
      : {};

  const classes = classNames(rootClassName || css.root, className);

  return (
    <FinalForm
      {...initialValuesMaybe}
      {...rest}
      unitPrice={unitPrice}
      render={formRenderProps => {
        const {
          endDatePlaceholder,
          startDatePlaceholder,
          form,
          pristine,
          handleSubmit,
          isOwnListing,
          listingId,
          values,
          monthlyTimeSlots,
          timeSlotsForDate,
          onFetchTimeSlots,
          timeZone,
          lineItems,
          fetchLineItemsInProgress,
          fetchLineItemsError,
          payoutDetailsWarning,
          onContactUser, // [SKYFARER]
          authorDisplayName, // [SKYFARER]
          voucher, // [SKYFARER]
        } = formRenderProps;

        const startTime = values?.bookingStartTime ? values.bookingStartTime : null;
        const endTime = values?.bookingEndTime ? values.bookingEndTime : null;
        const startDate = startTime ? timestampToDate(startTime) : null;
        const endDate = endTime ? timestampToDate(endTime) : null;
        const voucherCode = values?.voucherCode; // [SKYFARER]
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

        const codeValidated = (data) => {
          // TODO: i18n this in Sharetribe
          // TODO: hookify this and DRY between ProductOrderForm and BookingTimeForm
          try {
            if (!data || !data.valid) {
              if (data?.error?.code === 404) {
                setVoucherInfo("This code doesn't look right. Check your code and try again.")
                return
              }
              setVoucherInfo(data?.error?.message || data?.reason || 'Invalid voucher code')
              return
            }

            const startDate = timestampToDate(values.bookingStartTime);
            const endDate = timestampToDate(values.bookingEndTime);

            let output = `${data.code} has been applied!`;
            if (data.discount.type === 'PERCENT') output += ` You're saving ${data.discount.percent_off}%!`;
            else output += ` You're saving ${formatMoney(intl, new Money(data.discount.amount_off, unitPrice.currency))}!`;

            if (data?.valid) {
              values.voucherCode = data.code
              document.querySelector('button.voucherifyValidate')?.remove()
              handleOnChange({ values })
            }
          } catch (e) {
            console.error(e)
            setVoucherInfo('An error occurred while applying the voucher code. Please try again or contact support.')
          }
        }

        const onHandleFetchLineItems = handleFetchLineItems(props);
        const submitDisabled = isPriceVariationsInUse && !isPublishedListing;

        // [SKYFARER]
        const voucherifyItems = !config.vouchers.ENABLED ? null : lineItems?.map(item => {
          return {
            source_id: item.code,
            related_object: 'sku',
            price: item.unitPrice.amount,
            quantity: item.quantity?.toNumber() || 1,
            amount: item.unitPrice.amount * (item.quantity?.toNumber() || 1),
            metadata: {
              includeFor: item.includeFor,
              lineTotal: item.lineTotal.amount,
              reversal: item.reversal || false,
            }
          }
        });

        let currentUserTimezoneName = '';
        if (typeof window !== 'undefined') {
          const userPublicTimezone = props.currentUser?.attributes?.profile?.publicData?.timeZone;
          const userTimeZone = userPublicTimezone ? userPublicTimezone.replace(/-/g, '/') : getDefaultTimeZoneOnBrowser();
          currentUserTimezoneName = getTimeZoneBadgeContent(userTimeZone);
        }

        const rescheduleDifference = reschedule &&
          (values.bookingEndTime - values.bookingStartTime) / 1000 / 60 / 60
          !== reschedule?.attributes?.lineItems.reduce((acc, item) => acc + parseInt(item.quantity || 0), 0);
        // [/SKYFARER]

        return (
          <Form onSubmit={handleSubmit} className={classes} enforcePagePreloadFor="CheckoutPage">
            {PriceVariantFieldComponent ? (
              <PriceVariantFieldComponent
                priceVariants={priceVariants}
                priceVariantName={priceVariantName}
                onPriceVariantChange={onPriceVariantChange(formRenderProps)}
                disabled={!isPublishedListing}
              />
            ) : null}

            {monthlyTimeSlots && timeZone ? (
              <FieldDateAndTimeInput
                seatsEnabled={seatsEnabled}
                setSeatsOptions={setSeatsOptions}
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
                timeSlotsForDate={timeSlotsForDate}
                values={values}
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
                label={intl.formatMessage({ id: 'BookingTimeForm.seatsTitle' })}
                className={css.fieldSeats}
                onChange={values => {
                  onHandleFetchLineItems({
                    values: {
                      priceVariantName,
                      bookingStartDate: startDate,
                      bookingStartTime: startTime,
                      bookingEndDate: endDate,
                      bookingEndTime: endTime,
                      seats: values,
                    },
                  });
                }}
              >
                <option disabled value="">
                  {intl.formatMessage({ id: 'BookingTimeForm.seatsPlaceholder' })}
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
                  <FormattedMessage id="BookingTimeForm.priceBreakdownTitle" />
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
                <FormattedMessage id="BookingTimeForm.fetchLineItemsError" />
              </span>
            ) : null}

            <div className={css.submitButton}>
              <PrimaryButton
                type="submit"
                inProgress={fetchLineItemsInProgress}
                disabled={submitDisabled}
              >
                <FormattedMessage id="BookingTimeForm.requestToBook" />
              </PrimaryButton>
            </div>

            <p className={css.finePrint}>
              {payoutDetailsWarning ? (
                payoutDetailsWarning
              ) : (
                <FormattedMessage
                  id={
                    isOwnListing
                      ? 'BookingTimeForm.ownListing'
                      : 'BookingTimeForm.youWontBeChargedInfo'
                  }
                />
              )}
            </p>
            { // [SKYFARER]
              !isOwnListing && onContactUser ? (<div className={css.submitButton}>
                <ConsultationBox onContactUser={onContactUser} authorDisplayName={authorDisplayName} />
              </div>) : null
            }
          </Form>
        );
      }}
    />
  );
};

export default BookingTimeForm;
