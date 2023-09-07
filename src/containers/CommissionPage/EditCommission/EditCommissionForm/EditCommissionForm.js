import React from 'react';
import { bool, func, object, string } from 'prop-types';
import { compose } from 'redux';
import { Form as FinalForm } from 'react-final-form';
import classNames from 'classnames';

import { FormattedMessage, injectIntl, intlShape } from '../../../../util/reactIntl';
import { Form, H3, PrimaryButton } from '../../../../components';
import FieldCommissionInput from './FieldCommissionInput';
// import AvailabilityPlanEntries from './AvailabilityPlanEntries';

import css from './EditListingAvailabilityPlanForm.module.css';

const EditListingAvailabilityPlanFormComponent = props => {
  const { onSubmit, ...restOfprops } = props;

  const handleSubmit = (e,values) => {
    e.preventDefault();
    return onSubmit(values);
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
          invalid,
          values,
          ready,
        } = fieldRenderProps;

        const classes = classNames(rootClassName || css.root, className);
        const submitInProgress = inProgress;
        const submitDisabled = invalid || submitInProgress;

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
            <div className={css.commission}>
              <FieldCommissionInput id="commission" name="commission" className={css.commissionInput} />
            </div>

            <div className={css.submitButton}>
              <PrimaryButton type="submit" inProgress={submitInProgress}
                  ready={ready}
                  disabled={submitDisabled} >
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
