import React from 'react';
import { bool, func, object, string } from 'prop-types';
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

const EditListingAvailabilityPlanFormComponent = props => {
  const { onSubmit, ...restOfprops } = props;

  console.log('EditListingAvailabilityPlanFormComponent');
  console.log(props);

  const handleSubmit = (values,fasfa) => {
    values.preventDefault();
    // setValuesFromLastSubmit(values);
    // onSubmit(values);
    // Final Form can wait for Promises to return.
    console.log(values);
    console.log(fasfa);
    // console.log(onSubmit);
    onSubmit('asfas');
  };

  return (
    <FinalForm
      onSubmit={onSubmit}
      {...restOfprops}
      render={fieldRenderProps => {
        const {
          userName,
          rootClassName,
          className,
          formId,
          inProgress,
          values,
        } = fieldRenderProps;

        console.log('fieldRenderProps');
        console.log(fieldRenderProps);

        const classes = classNames(rootClassName || css.root, className);
        const submitInProgress = inProgress;

        return (
          <Form id={formId} className={classes} onSubmit={e => {
            handleSubmit(e,values);
          }} >
            <H3 as="h2" className={css.heading}>
              <FormattedMessage
                id="EditCommissionForm.title"
                values={{ userName }}
              />
            </H3>
            <div className={css.comission}>
              <FieldComissionInput id="comission" name="comission" className={css.commissionInput} />
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
  onSubmit: func.isRequired
};

EditListingAvailabilityPlanFormComponent.propTypes = {
  inProgress: bool,
  onSubmit: func,
};

const EditListingAvailabilityPlanForm = compose(injectIntl)(
  EditListingAvailabilityPlanFormComponent
);

EditListingAvailabilityPlanForm.displayName = 'EditListingAvailabilityPlanForm';

export default EditListingAvailabilityPlanForm;
