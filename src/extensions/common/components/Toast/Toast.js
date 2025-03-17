import React from 'react';
import { useIntl } from 'react-intl';
import { toast } from 'react-toastify';

import css from './Toast.module.css';

const Toast = ({ titleId, contentId }) => {
  const intl = useIntl();

  return (
    <>
      {titleId && <h4 className={css.toastTitle}>{intl.formatMessage({ id: titleId })}</h4>}
      {contentId && <p className={css.toastText}>{intl.formatMessage({ id: contentId })}</p>}
    </>
  );
};

export const toastSuccess = (toastProps, options) => {
  return toast.success(<Toast {...toastProps} />, {
    progressClassName: css.progressBar,
    className: css.successToast,
    ...options,
  });
};

export default Toast;
