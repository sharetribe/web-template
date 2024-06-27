import React from 'react';
import { compose } from 'redux';

import { injectIntl } from '../../../util/reactIntl';

const LoginFormComponent = () => (
  <div>
    LOG IN
  </div>
);

const LoginForm = compose(injectIntl)(LoginFormComponent);
LoginForm.displayName = 'LoginForm';

export default LoginForm;
