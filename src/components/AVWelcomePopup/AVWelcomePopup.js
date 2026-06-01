import React from 'react';
import { bool, func, string } from 'prop-types';

import { useIntl } from '../../util/reactIntl';
import { Modal } from '../../components';

import css from './AVWelcomePopup.module.css';

// Returns null when the translation key is missing or has an empty value.
// Checks intl.messages first to avoid triggering MISSING_TRANSLATION console errors
// for intentionally empty keys (react-intl treats "" as missing when !message is true).
const t = (intl, id) => {
  const val = intl.messages?.[id];
  if (!val) return null;
  return intl.formatMessage({ id }) || null;
};

const AVWelcomePopup = ({ userType = null, isOpen, onClose, onManageDisableScrolling }) => {
  const intl = useIntl();
  if (!userType) return null;
  const ns = `AVWelcomePopup.${userType}`;

  const imageUrl = t(intl, `${ns}.imageUrl`);
  const title = t(intl, `${ns}.title`);
  const text = t(intl, `${ns}.text`);
  const primaryLabel = t(intl, `${ns}.primaryButtonLabel`);
  const primaryUrl = t(intl, `${ns}.primaryButtonUrl`);
  const secondaryLabel = t(intl, `${ns}.secondaryButtonLabel`);
  const secondaryUrl = t(intl, `${ns}.secondaryButtonUrl`);

  return (
    <Modal
      id={`AVWelcomePopup-${userType}`}
      isOpen={isOpen}
      onClose={onClose}
      onManageDisableScrolling={onManageDisableScrolling}
      usePortal
      lightCloseButton
    >
      <div className={css.root}>
        {imageUrl && (
          <div className={css.imageWrapper}>
            <img src={imageUrl} alt="" className={css.image} />
          </div>
        )}
        <div className={css.body}>
          {title && <h2 className={css.title}>{title}</h2>}
          {text && <p className={css.text}>{text}</p>}
          {(primaryLabel || secondaryLabel) && (
            <div className={css.buttons}>
              {primaryLabel && primaryUrl && (
                <a href={primaryUrl} className={css.primaryButton}>
                  {primaryLabel}
                </a>
              )}
              {secondaryLabel && secondaryUrl && (
                <a href={secondaryUrl} className={css.secondaryButton}>
                  {secondaryLabel}
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

AVWelcomePopup.propTypes = {
  userType: string,
  isOpen: bool.isRequired,
  onClose: func.isRequired,
  onManageDisableScrolling: func.isRequired,
};

export default AVWelcomePopup;
