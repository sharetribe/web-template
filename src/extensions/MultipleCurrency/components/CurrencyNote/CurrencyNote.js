import React from 'react';
import { FormattedMessage } from 'react-intl';

import css from './CurrencyNote.module.css';

const CurrencyNote = props => {
  const { componentId } = props;
  return (
    <div className={css.note}>
      <FormattedMessage id={`${componentId}.exchangeRateNote`} />
    </div>
  );
};

export default CurrencyNote;
