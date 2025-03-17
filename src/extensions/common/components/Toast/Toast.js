import React from 'react';
import { useIntl } from 'react-intl';
import { toast } from 'react-toastify';

import css from './Toast.module.css';

const Toast = ({ titleId, contentId, intl, translationValues = {} }) => {
  return (
    <>
      {titleId && (
        <h4 className={css.toastTitle}>{intl.formatMessage({ id: titleId }, translationValues)}</h4>
      )}
      {contentId && (
        <p className={css.toastText}>{intl.formatMessage({ id: contentId }, translationValues)}</p>
      )}
    </>
  );
};

export const toastSuccess = ({ toastOptions, ...rest }) => {
  const { titleId, contentId, intl } = rest;

  if (titleId && intl.messages[titleId] && contentId && intl.messages[contentId]) {
    return toast.success(<Toast {...rest} />, {
      progressClassName: css.progressBar,
      className: css.successToast,
      ...toastOptions,
    });
  }
};

export default Toast;
