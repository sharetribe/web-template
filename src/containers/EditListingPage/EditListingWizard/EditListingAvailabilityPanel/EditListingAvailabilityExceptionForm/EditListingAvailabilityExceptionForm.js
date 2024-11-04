import React from 'react';
import { array, arrayOf, bool, func, object, oneOf, shape, string } from 'prop-types';
import { compose } from 'redux';
import { Form as FinalForm } from 'react-final-form';
import classNames from 'classnames';

import { intlShape, injectIntl, FormattedMessage } from '../../../../../util/reactIntl';
import { AVAILABILITY_MULTIPLE_SEATS, propTypes } from '../../../../../util/types';
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
const EditListingAvailabilityExceptionForm = props => {
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
          intl,
          invalid,
          onMonthChanged,
          pristine,
          monthlyExceptionQueries,
          allExceptions,
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
          listingTypeConfig.availabilityType === AVAILABILITY_MULTIPLE_SEATS;
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
                  formApi={formApi}
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

EditListingAvailabilityExceptionForm.defaultProps = {
  className: null,
  rootClassName: null,
  fetchErrors: null,
  formId: null,
  monthlyExceptionQueries: null,
  allExceptions: [],
};

EditListingAvailabilityExceptionForm.propTypes = {
  className: string,
  rootClassName: string,
  formId: string,
  monthlyExceptionQueries: object,
  allExceptions: arrayOf(propTypes.availabilityException),
  intl: intlShape.isRequired,
  onSubmit: func.isRequired,
  listingTypeConfig: shape({
    availabilityType: oneOf(['oneSeat', 'multipleSeats']).isRequired,
  }).isRequired,
  unitType: string.isRequired,
  useFullDays: bool.isRequired,
  timeZone: string.isRequired,
  updateInProgress: bool.isRequired,
  fetchErrors: shape({
    updateListingError: propTypes.error,
  }),
  onFetchExceptions: func.isRequired,
};

export default compose(injectIntl)(EditListingAvailabilityExceptionForm);
