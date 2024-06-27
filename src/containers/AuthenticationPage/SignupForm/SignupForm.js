import React from 'react';
import { compose } from 'redux';

import { injectIntl } from '../../../util/reactIntl';

const SignupFormComponent = () => (
  <div>
    SIGN UP
  </div>
);

const SignupForm = compose(injectIntl)(SignupFormComponent);
SignupForm.displayName = 'SignupForm';

export default SignupForm;
