import React, { useState } from 'react';
import css from './PopUpMessage.module.css';
import { useIntl } from 'react-intl';
import { PrimaryButton, SecondaryButton } from '../Button/Button';

const PopUp = ({ message, onCancel }) => {
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
};

export default PopUp;
