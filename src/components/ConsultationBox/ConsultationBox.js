import { FormattedMessage } from '../../util/reactIntl';
import { InlineTextButton } from '../Button/Button';
import React from 'react';

import css from './ConsultationBox.module.css';

const ConsultationBox = props => {
  const {
    onContactUser,
    authorDisplayName,
  } = props;

  return <div className={css.wrapper}>
    <div className={css.consultationBox}>

      <p><span className={css.prompt}>Questions?</span> Reach out to this instructor before you get
        started.</p>
      <
        InlineTextButton onClick={e => {
        e.preventDefault();
        onContactUser();
      }
      }>
        <FormattedMessage id='BookingTimeForm.requestFreeConsultation'
                          values={{ authorDisplayName }} />
      </InlineTextButton>
    </div>
  </div>;
};

export default ConsultationBox;
