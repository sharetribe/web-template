import React from 'react';
import { string } from 'prop-types';
import classNames from 'classnames';
import { FormattedMessage } from '../../util/reactIntl';

import css from './ReminderBox.module.css';

const ReminderBox = props => {
  const { className, messageId } = props;
  const classes = classNames(css.root, className);

  return (
    <div className={classes}>
      <i class="fa-solid fa-triangle-exclamation"></i> <b>Do not share personal contact details.</b> 
      To comply with our <a href="/terms-of-service\">Terms of Service</a> all communication and transactions must be completed on the site.
    </div>
  );
};

ReminderBox.propTypes = {
  className: string,
  messageId: string,
};

export default ReminderBox;