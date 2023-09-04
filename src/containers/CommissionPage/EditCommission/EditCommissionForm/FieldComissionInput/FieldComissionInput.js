import React from 'react';
import { string } from 'prop-types';
import { compose } from 'redux';
import { FieldTextInput } from '../../../../../components';
import { injectIntl, intlShape } from '../../../../../util/reactIntl';
import * as validators from '../../../../../util/validators';


const FieldComissionInputComponent = props => {

  const {
    className,
    intl,
  } = props;

  const minValue = 0;
  const maxValue = 100;

  const minValueMessage = intl.formatMessage({
    id: 'FieldComissionInput.CommisionMinValue',
  },
  {
    minValue: minValue,
  }
  );
  const maxValueMessage = intl.formatMessage({
    id: 'FieldComissionInput.CommisionMaxValue',
  },
  {
    maxValue: maxValue,
  }
  );

  const commissionRequiredMessage = intl.formatMessage({
    id: 'FieldComissionInput.CommisionRequired',
  });
  const minValueValidate = validators.minValue(minValue,minValueMessage);
  const maxValueValidate = validators.maxValue(maxValue,maxValueMessage);
  const comissionValueRequired = validators.required(commissionRequiredMessage);
  
  const commissionValidators = validators.composeValidators(
    comissionValueRequired,
    minValueValidate,
    maxValueValidate
  );

  return (
    <div>
      <FieldTextInput
        type="number"
        id={`commission`}
        name="commission"
        className={className}
        label="Set new commission variable:"
        validate={commissionValidators}
      />
    </div>
  );
};

FieldComissionInputComponent.defaultProps = {
  rootClassName: null,
  className: null,
  id: null,
  label: null,
};

FieldComissionInputComponent.propTypes = {
  rootClassName: string,
  className: string,

  // Label is optional, but if it is given, an id is also required so
  // the label can reference the input in the `for` attribute
  id: string,
  label: string,
  name: string.isRequired,

  // from injectIntl
  intl: intlShape.isRequired,
};

const FieldComissionInput = compose(injectIntl)(FieldComissionInputComponent)

export default FieldComissionInput;
