import React, { useState } from 'react';
import { useIntl } from 'react-intl';
import css from './PopUpMessage.module.css';
import { PrimaryButton, SecondaryButton } from '../Button/Button';

function PopUp({ message, onCancel }) {
  const intl = useIntl();

  return (
    <div className={css.popUpOverlay}>
      <div className={css.popUpContent}>
        {message}
        <div className={css.popUpActions}>
          <PrimaryButton type="submit" onClick={onCancel}>
            {intl.formatMessage({ id: 'PopMessage.base' })}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}

export default PopUp;
