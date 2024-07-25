import React from 'react';

import { InlineTextButton } from '../..';

import css from './DatePicker.module.css';
import { FormattedMessage } from 'react-intl';

const DatePickerFooter = props => {
  const { showFooter, showTodayButton, showClearButton, disabled, onShowToday, onClear } = props;
  return showFooter ? (
    <div className={css.footer}>
      {showTodayButton && (
        <InlineTextButton
          className={css.todayButton}
          disabled={disabled}
          onClick={onShowToday}
          type="button"
        >
          <FormattedMessage id="DatePicker.todayButton" />
        </InlineTextButton>
      )}
      {showClearButton && (
        <InlineTextButton
          className={css.clearButton}
          disabled={disabled}
          onClick={onClear}
          type="button"
        >
          <FormattedMessage id="DatePicker.clearButton" />
        </InlineTextButton>
      )}
    </div>
  ) : null;
};

export default DatePickerFooter;
