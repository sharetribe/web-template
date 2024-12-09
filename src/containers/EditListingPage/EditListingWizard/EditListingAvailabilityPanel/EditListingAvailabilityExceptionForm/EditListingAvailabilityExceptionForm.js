import React from 'react';
import { Form as FinalForm } from 'react-final-form';
import classNames from 'classnames';

import { FormattedMessage, useIntl } from '../../../../../util/reactIntl';
import { AVAILABILITY_MULTIPLE_SEATS } from '../../../../../util/types';
import { DAY } from '../../../../../transactions/transaction';

import { Form, H3, PrimaryButton } from '../../../../../components';

import FieldSeatsInput from '../FieldSeatsInput/FieldSeatsInput';
import AvailabilitySingleSeatSelector from './AvailabilitySingleSeatSelector';
import ExceptionDateTimeRange from './ExceptionDateTimeRange';
import ExceptionDateRange from './ExceptionDateRange';

import css from './EditListingAvailabilityExceptionForm.module.css';

//////////////////////////////////////////
// EditListingAvailabilityExceptionForm //
//////////////////////////////////////////

/**
 * @typedef {Object} AvailabilityException
 * @property {string} id
 * @property {'availabilityException'} type 'availabilityException'
 * @property {Object} attributes            API entity's attributes
 * @property {Date} attributes.start        The start of availability exception (inclusive)
 * @property {Date} attributes.end          The end of availability exception (exclusive)
 * @property {Number} attributes.seats      The number of seats available (0 means 'unavailable')
 */
/**
 * @typedef {Object} MonthlyExceptionQueryInfo
 * @property {Object?} fetchExceptionsError
 * @property {boolean} fetchExceptionsInProgress
 */

/**
 * A Form that allows the creation of AvailabilityExceptions.
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className
 * @param {string?} props.rootClassName
 * @param {string?} props.formId
 * @param {Object.<string, MonthlyExceptionQueryInfo>?} props.monthlyExceptionQueries E.g. '2022-12': { fetchExceptionsError, fetchExceptionsInProgress }
 * @param {Array<AvailabilityException>} props.allExceptions
 * @param {Function} props.onSubmit
 * @param {Object} props.listingTypeConfig
 * @param {'oneSeat'|'multipleSeats'} props.listingTypeConfig.availabilityType
 * @param {'hour'|'day'|'night'} props.unitType
 * @param {boolean} props.useFullDays derivative info based on unitType
 * @param {string} props.timeZone IANA time zone key
 * @param {boolean} props.updateInProgress
 * @param {Object} props.fetchErrors
 * @param {Object|null} props.fetchErrors.updateListingError
 * @param {Function} props.onFetchExceptions Redux Thunk function to fetch AvailabilityExceptions
 * @returns {JSX.Element} containing form that allows adding availability exceptions
 */
const EditListingAvailabilityExceptionForm = props => {
  const intl = useIntl();
  return (
    <FinalForm
      {...props}
      render={formRenderProps => {
        const {
          className,
          rootClassName,
          form: formApi,
          formId,
          listingId,
          disabled,
          handleSubmit,
          invalid,
          onMonthChanged,
          pristine,
          monthlyExceptionQueries,
          allExceptions = [],
          onFetchExceptions,
          useFullDays,
          listingTypeConfig,
          unitType,
          timeZone,
          updateInProgress,
          fetchErrors,
          values,
        } = formRenderProps;

        const idPrefix = `${formId}` || 'EditListingAvailabilityExceptionForm';
        const isDaily = unitType === DAY;

        const {
          availability,
          exceptionStartDate,
          exceptionStartTime = null,
          exceptionEndDate,
          exceptionEndTime,
          exceptionRange,
          seats,
        } = values;
        const hasMultipleSeatsInUSe =
          listingTypeConfig?.availabilityType === AVAILABILITY_MULTIPLE_SEATS;
        const hasSeats = hasMultipleSeatsInUSe ? seats != null : availability;

        const { updateListingError } = fetchErrors || {};

        const submitInProgress = updateInProgress;
        const hasData =
          hasSeats &&
          (exceptionRange ||
            (exceptionStartDate && exceptionStartTime && exceptionEndDate && exceptionEndTime));
        const submitDisabled = !hasData || invalid || disabled || submitInProgress;

        const classes = classNames(rootClassName || css.root, className);

        return (
          <Form
            className={classes}
            onSubmit={e => {
              handleSubmit(e).then(() => {
                formApi.initialize({
                  exceptionStartDate: null,
                  exceptionStartTime: null,
                  exceptionEndDate: null,
                  exceptionEndTime: null,
                });
              });
            }}
          >
            <H3 as="h2" className={css.heading}>
              <FormattedMessage id="EditListingAvailabilityExceptionForm.title" />
            </H3>

            {!hasMultipleSeatsInUSe ? (
              <AvailabilitySingleSeatSelector
                idPrefix={idPrefix}
                rootClassName={css.radioButtons}
                pristine={pristine}
                intl={intl}
              />
            ) : null}

            <div className={css.section}>
              {useFullDays ? (
                <ExceptionDateRange
                  formId={formId}
                  listingId={listingId}
                  intl={intl}
                  allExceptions={allExceptions}
                  monthlyExceptionQueries={monthlyExceptionQueries}
                  onFetchExceptions={onFetchExceptions}
                  onMonthChanged={onMonthChanged}
                  timeZone={timeZone}
                  isDaily={isDaily}
                  values={values}
                />
              ) : (
                <ExceptionDateTimeRange
                  formId={formId}
                  listingId={listingId}
                  intl={intl}
                  formApi={formApi}
                  allExceptions={allExceptions}
                  monthlyExceptionQueries={monthlyExceptionQueries}
                  onFetchExceptions={onFetchExceptions}
                  onMonthChanged={onMonthChanged}
                  timeZone={timeZone}
                  values={values}
                />
              )}
            </div>

            {hasMultipleSeatsInUSe ? (
              <FieldSeatsInput
                id={`${idPrefix}.seats`}
                name="seats"
                rootClassName={css.seatsInput}
                pristine={pristine}
                unitType={unitType}
                intl={intl}
              />
            ) : null}

            <div className={css.submitButton}>
              {updateListingError ? (
                <p className={css.error}>
                  <FormattedMessage id="EditListingAvailabilityExceptionForm.updateFailed" />
                </p>
              ) : null}
              <PrimaryButton type="submit" inProgress={submitInProgress} disabled={submitDisabled}>
                <FormattedMessage id="EditListingAvailabilityExceptionForm.addException" />
              </PrimaryButton>
            </div>
          </Form>
        );
      }}
    />
  );
};

export default EditListingAvailabilityExceptionForm;
