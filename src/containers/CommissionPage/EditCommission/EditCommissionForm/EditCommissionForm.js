import React from 'react';
import { bool, object, string } from 'prop-types';
import { compose } from 'redux';
import { Form as FinalForm } from 'react-final-form';
import arrayMutators from 'final-form-arrays';
import classNames from 'classnames';

import { FormattedMessage, injectIntl, intlShape } from '../../../../util/reactIntl';
import { Form, H3, PrimaryButton } from '../../../../components';
import FieldComissionInput from './FieldComissionInput';
// import AvailabilityPlanEntries from './AvailabilityPlanEntries';

import css from './EditListingAvailabilityPlanForm.module.css';

/**
 * User might create entries inside the day of week in what ever order.
 * We sort them before submitting to Marketplace API
 */
const sortEntries = () => (a, b) => {
  if (a.startTime && b.startTime) {
    const aStart = Number.parseInt(a.startTime.split(':')[0]);
    const bStart = Number.parseInt(b.startTime.split(':')[0]);
    return aStart - bStart;
  }
  return 0;
};

/**
 * Handle submitted values: sort entries within the day of week
 * @param {Redux Thunk} onSubmit promise fn.
 * @param {Array<string>} weekdays ['mon', 'tue', etc.]
 */
const submit = (onSubmit, weekdays) => values => {
  const sortedValues = weekdays.reduce(
    (submitValues, day) => {
      return submitValues[day]
        ? {
            ...submitValues,
            [day]: submitValues[day].sort(sortEntries()),
          }
        : submitValues;
    },
    { ...values }
  );

  onSubmit(sortedValues);
};

/**
 * Create and edit availability plan of the listing.
 * This is essentially the weekly schedule.
 */
const EditListingAvailabilityPlanFormComponent = props => {
  const { onSubmit, commission, ...restOfprops } = props;

  console.log('EditListingAvailabilityPlanFormComponent');
  console.log(props);

  return (
    <FinalForm
      {...restOfprops}
      onSubmit={submit(onSubmit, props.weekdays)}
      mutators={{
        ...arrayMutators,
      }}
      render={fieldRenderProps => {
        const {
          userName,
          rootClassName,
          className,
          formId,
          inProgress,
        } = fieldRenderProps;

        const handleSubmit = values => {
          // setValuesFromLastSubmit(values);
      
          // Final Form can wait for Promises to return.
          return onSubmit(e => {
            e.preventDefault();
            handleSubmit(e);
          })
            .then(() => {
              setIsEditPlanModalOpen(false);
            })
            .catch(e => {
              // Don't close modal if there was an error
            });
        };

        const classes = classNames(rootClassName || css.root, className);
        const submitInProgress = inProgress;

        return (
          <Form id={formId} className={classes} onSubmit={handleSubmit} >
            <H3 as="h2" className={css.heading}>
              <FormattedMessage
                id="EditCommissionForm.title"
                values={{ userName }}
              />
            </H3>
            <div className={css.comission}>
              <FieldComissionInput id="comission" value={commission} name="comission" className={css.commissionInput} />
            </div>

            <div className={css.submitButton}>
              <PrimaryButton type="submit" inProgress={submitInProgress} >
                <FormattedMessage id="EditCommissionForm.saveCommission" />
              </PrimaryButton>
            </div>
          </Form>
        );
      }}
    />
  );
};

EditListingAvailabilityPlanFormComponent.defaultProps = {
  rootClassName: null,
  className: null,
  submitButtonWrapperClassName: null,
  inProgress: false,
  commission:0,
};

EditListingAvailabilityPlanFormComponent.propTypes = {
  inProgress: bool,
};

const EditListingAvailabilityPlanForm = compose(injectIntl)(
  EditListingAvailabilityPlanFormComponent
);

EditListingAvailabilityPlanForm.displayName = 'EditListingAvailabilityPlanForm';

export default EditListingAvailabilityPlanForm;
