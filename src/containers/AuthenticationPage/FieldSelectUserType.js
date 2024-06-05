import React from 'react';
import { bool, string } from 'prop-types';
import { Field } from 'react-final-form';
import classNames from 'classnames';

import { intlShape } from '../../util/reactIntl';
import { propTypes } from '../../util/types';
import * as validators from '../../util/validators';

import { FieldSelect } from '../../components';

import css from './AuthenticationPage.module.css';

// Hidden input field
const FieldHidden = props => {
  const { name } = props;
  return (
    <Field id={name} name={name} type="hidden" className={css.unitTypeHidden}>
      {fieldRenderProps => <input {...fieldRenderProps?.input} />}
    </Field>
  );
};

/**
 * Return React Final Form Field that allows selecting user type.
 *
 * @param {*} props containing name, userTypes, hasExistingUserType, intl
 * @returns React Final Form Field component to select user type
 */
const FieldSelectUserType = props => {
  const { rootClassName, className, name, userTypes, hasExistingUserType, intl } = props;
  const hasMultipleUserTypes = userTypes?.length > 1;
  const classes = classNames(rootClassName || css.userTypeSelect, className);

  return hasMultipleUserTypes && !hasExistingUserType ? (
    <>
      <FieldSelect
        id={name}
        name={name}
        className={classes}
        label={intl.formatMessage({ id: 'FieldSelectUserType.label' })}
        validate={validators.required(intl.formatMessage({ id: 'FieldSelectUserType.required' }))}
      >
        <option disabled value="">
          {intl.formatMessage({ id: 'FieldSelectUserType.placeholder' })}
        </option>
        {userTypes.map(config => {
          const type = config.userType;
          return (
            <option key={type} value={type}>
              {config.label}
            </option>
          );
        })}
      </FieldSelect>
    </>
  ) : (
    <>
      <FieldHidden name={name} />
    </>
  );
};

FieldSelectUserType.defaultProps = {
  rootClassName: null,
  className: null,
  hasExistingUserType: false,
};

FieldSelectUserType.propTypes = {
  rootClassName: string,
  className: string,
  name: string.isRequired,
  userTypes: propTypes.userTypes.isRequired,
  hasExistingUserType: bool,
  intl: intlShape.isRequired,
};

export default FieldSelectUserType;
