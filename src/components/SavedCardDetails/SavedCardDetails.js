import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
import { useIntl } from '../../util/reactIntl';
import {
  IconClose,
  IconCheckmark,
  Button,
  InlineTextButton,
  Menu,
  MenuLabel,
  MenuItem,
  MenuContent,
  Modal,
} from '../../components';

import IconCard from './IconCard/IconCard';
import css from './SavedCardDetails.module.css';

const DEFAULT_CARD = 'defaultCard';
const REPLACE_CARD = 'replaceCard';
const ONETIME_CARD_PAYMENT = 'onetimeCardPayment';
const DELETE_CARD_BUTTON_ID = 'deleteCardButton';

/**
 * A component that renders a saved card details.
 *
 * @component
 * @param {Object} props
 * @param {string} [props.rootClassName] - Custom class that overrides the default class for the root element
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {Object} [props.card] - The card to render (omit for options-only mode)
 * @param {string} props.card.brand - The brand of the card
 * @param {number} props.card.expirationMonth - The expiration month of the card
 * @param {number} props.card.expirationYear - The expiration year of the card
 * @param {string} props.card.last4Digits - The last 4 digits of the card
 * @param {function} [props.onChange] - The function to call when the card is changed
 * @param {function} [props.onDeleteCard] - The function to call when the card is deleted
 * @param {function} [props.onManageDisableScrolling] - The function to call when the modal is opened
 * @param {boolean} [props.deletePaymentMethodInProgress] - Whether the delete payment method is in progress
 * @param {Array<{ value: string, label: string }>} [props.additionalPaymentOptions] - Extra menu options
 * @param {string} [props.selectedValue] - Controlled selected menu value
 * @returns {JSX.Element}
 */
const SavedCardDetails = props => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hasBeenOpened, setHasBeenOpened] = useState(false);
  const intl = useIntl();

  const {
    rootClassName,
    className,
    card,
    onChange,
    onDeleteCard,
    onManageDisableScrolling,
    deletePaymentMethodInProgress,
    additionalPaymentOptions = [],
    selectedValue,
  } = props;

  const { last4Digits, expirationMonth, expirationYear, brand } = card || {};
  const hasSavedCard = !!(card && last4Digits);
  const newCardValue = hasSavedCard ? REPLACE_CARD : ONETIME_CARD_PAYMENT;
  const classes = classNames(rootClassName || css.root, className);

  const [active, setActive] = useState(
    selectedValue || (hasSavedCard ? DEFAULT_CARD : newCardValue)
  );

  useEffect(() => {
    if (selectedValue != null) {
      setActive(selectedValue);
    }
  }, [selectedValue]);

  const paymentMethodPlaceholderDesktop = intl.formatMessage(
    { id: 'SavedCardDetails.savedPaymentMethodPlaceholderDesktop' },
    { last4Digits }
  );

  const paymentMethodPlaceholderMobile = intl.formatMessage(
    { id: 'SavedCardDetails.savedPaymentMethodPlaceholderMobile' },
    { last4Digits }
  );

  const paymentMethodPlaceholder = (
    <>
      <span className={css.paymentMethodPlaceholderDesktop}>{paymentMethodPlaceholderDesktop}</span>
      <span className={css.paymentMethodPlaceholderMobile}>{paymentMethodPlaceholderMobile}</span>
    </>
  );

  const replaceCardText = intl.formatMessage({
    id: 'SavedCardDetails.replaceCardText',
  });
  const replaceCard = (
    <span>
      <IconCard brand="none" className={css.cardIcon} /> {replaceCardText}
    </span>
  );

  const expiredCardText = intl.formatMessage(
    { id: 'SavedCardDetails.expiredCardText' },
    { last4Digits }
  );
  const expiredText = <div className={css.cardExpiredText}>{expiredCardText}</div>;

  const isExpired = (expirationMonth, expirationYear) => {
    const currentTime = new Date();
    const currentYear = currentTime.getFullYear();
    const currentMonth = currentTime.getMonth() + 1; //getMonth() method returns the month (from 0 to 11)

    if (expirationYear < currentYear) {
      return true;
    } else if (expirationYear === currentYear && expirationMonth < currentMonth) {
      return true;
    }

    return false;
  };

  const isCardExpired =
    expirationMonth && expirationYear && isExpired(expirationMonth, expirationYear);

  const defaultCard = hasSavedCard ? (
    <div className={css.savedPaymentMethod}>
      <IconCard brand={brand} className={css.cardIcon} />
      {paymentMethodPlaceholder}
      <span className={isCardExpired ? css.expirationDateExpired : css.expirationDate}>
        {expirationMonth}/{expirationYear.toString().substring(2)}
      </span>
    </div>
  ) : null;

  const handleClick = item => e => {
    // Clicking buttons inside a form will call submit
    e.preventDefault();
    e.stopPropagation();

    setActive(item);
    setMenuOpen(false);
    if (onChange) {
      onChange(item);
    }
  };

  const onToggleActive = isOpen => {
    setMenuOpen(isOpen);
    if (!hasBeenOpened && !isOpen) {
      setHasBeenOpened(true);
    }
  };

  const handleDeleteCard = () => {
    setIsModalOpen(true);
  };

  const replaceCardTitle = intl.formatMessage({
    id: 'SavedCardDetails.replaceCardTitle',
  });
  const removeCardModalTitle = intl.formatMessage({ id: 'SavedCardDetails.removeCardModalTitle' });
  const removeCardModalContent = intl.formatMessage(
    { id: 'SavedCardDetails.removeCardModalContent' },
    { last4Digits }
  );
  const cancel = intl.formatMessage({ id: 'SavedCardDetails.cancel' });
  const removeCard = intl.formatMessage({ id: 'SavedCardDetails.removeCard' });
  const deletePaymentMethod = intl.formatMessage({ id: 'SavedCardDetails.deletePaymentMethod' });

  const selectedAdditionalOption = additionalPaymentOptions.find(option => option.value === active);
  const isNewCardSelected = active === REPLACE_CARD || active === ONETIME_CARD_PAYMENT;
  const menuLabelContent =
    active === DEFAULT_CARD && defaultCard ? (
      defaultCard
    ) : isNewCardSelected ? (
      replaceCard
    ) : selectedAdditionalOption ? (
      <span className={css.additionalPaymentOptionLabel}>{selectedAdditionalOption.label}</span>
    ) : (
      replaceCard
    );

  const showExpired = isCardExpired && active === DEFAULT_CARD && hasSavedCard;

  return (
    <div className={classes}>
      <Menu className={css.menu} isOpen={menuOpen} onToggleActive={onToggleActive} useArrow={false}>
        <MenuLabel className={css.menuLabel}>
          <div className={showExpired ? css.menuLabelWrapperExpired : css.menuLabelWrapper}>
            {menuLabelContent}
          </div>
        </MenuLabel>

        <MenuContent
          rootClassName={classNames(css.menuContent, {
            [css.menuContentTransition]: hasBeenOpened,
          })}
        >
          {hasSavedCard ? (
            <MenuItem key="default-card" className={css.menuItem}>
              <IconCheckmark
                className={active === DEFAULT_CARD ? css.iconCheckmark : css.iconCheckmarkHidden}
                size="small"
              />
              <InlineTextButton className={css.menuText} onClick={handleClick(DEFAULT_CARD)}>
                {defaultCard}
              </InlineTextButton>
            </MenuItem>
          ) : null}
          {hasSavedCard ? (
            <MenuItem key="divider" className={css.menuDivider}>
              {replaceCardTitle}
            </MenuItem>
          ) : null}
          <MenuItem key="new-card" className={css.menuItem}>
            <IconCheckmark
              className={isNewCardSelected ? css.iconCheckmark : css.iconCheckmarkHidden}
              size="small"
            />
            <InlineTextButton
              className={css.menuTextReplaceCard}
              onClick={handleClick(newCardValue)}
            >
              {replaceCard}
            </InlineTextButton>
          </MenuItem>
          {additionalPaymentOptions.map(option => {
            const isSelected = active === option.value;
            return (
              <MenuItem key={option.value} className={css.menuItem}>
                <IconCheckmark
                  className={isSelected ? css.iconCheckmark : css.iconCheckmarkHidden}
                  size="small"
                />
                <InlineTextButton
                  className={css.menuTextReplaceCard}
                  onClick={handleClick(option.value)}
                >
                  <span className={css.additionalPaymentOptionLabel}>{option.label}</span>
                </InlineTextButton>
              </MenuItem>
            );
          })}
        </MenuContent>
      </Menu>
      {showExpired && !menuOpen ? expiredText : null}

      {onDeleteCard && active === DEFAULT_CARD ? (
        <InlineTextButton
          id={DELETE_CARD_BUTTON_ID}
          onClick={handleDeleteCard}
          className={css.savedPaymentMethodDelete}
        >
          <IconClose rootClassName={css.closeIcon} size="small" ariaLabel={deletePaymentMethod} />
          {deletePaymentMethod}
        </InlineTextButton>
      ) : null}

      {onManageDisableScrolling ? (
        <Modal
          id="VerifyDeletingPaymentMethod"
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
          }}
          usePortal
          contentClassName={css.modalContent}
          onManageDisableScrolling={onManageDisableScrolling}
          focusElementId={DELETE_CARD_BUTTON_ID}
        >
          <div>
            <div className={css.modalTitle}>{removeCardModalTitle}</div>
            <p className={css.modalMessage}>{removeCardModalContent}</p>
            <div className={css.modalButtonsWrapper}>
              <button
                onClick={() => setIsModalOpen(false)}
                className={css.cancelCardDelete}
                tabIndex="0"
              >
                {cancel}
              </button>
              <Button onClick={onDeleteCard} inProgress={deletePaymentMethodInProgress}>
                {removeCard}
              </Button>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
};

export default SavedCardDetails;
