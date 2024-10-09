import React from 'react';
import { FormattedMessage } from 'react-intl';
import { useSelector } from 'react-redux';

import { USD } from '../../../common/config/constants/currency.constants';

import css from './CurrencyNote.module.css';

const CurrencyNote = props => {
  const { componentId } = props;
  const { currentUserShowInProgress } = useSelector(state => state.user);
  const { uiCurrency } = useSelector(state => state.ui);
  if (currentUserShowInProgress || uiCurrency === USD) {
    return null;
  }

  return (
    <div className={css.note}>
      <FormattedMessage id={`${componentId}.exchangeRateNote`} />
    </div>
  );
};

export default CurrencyNote;
