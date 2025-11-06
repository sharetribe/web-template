import React from 'react';
import classNames from 'classnames';

import { useIntl } from '../../../util/reactIntl';
import { getStartOf } from '../../../util/dates';
import { allowCustomerCounterOffer, allowProviderUpdateOffer } from '../../../util/configHelpers';

import { PrimaryButton, SecondaryButton, Button } from '../../../components';

import css from './ActionButtons.module.css';

const hasReachedMaxDurationSinceTransition = (condition, transitions, timeZone) => {
  const sinceTransition = transitions.find(t => t.transition === condition.sinceTransition);
  if (sinceTransition) {
    const enteredAt = getStartOf(sinceTransition.createdAt, 'day', timeZone);
    const expiresAt = getStartOf(enteredAt, 'day', timeZone, condition.days, 'days');
    const today = getStartOf(new Date(), 'day', timeZone);
    return today > expiresAt;
  }
  return false;
};
const hasReachedMaxTransitions = (condition, transitions) => {
  return transitions.length >= condition.max;
};
const checkCondition = (condition, additionalInfo) => {
  const { transitions, timeZone, listingTypeConfig } = additionalInfo;

  if (condition.type === 'durationSinceTransition') {
    return hasReachedMaxDurationSinceTransition(condition, transitions, timeZone);
  }
  if (condition.type === 'maxTransitions') {
    return hasReachedMaxTransitions(condition, transitions);
  }
  if (condition.type === 'providerUpdateOfferHidden') {
    // hide the button if the provider update offer is not allowed
    return condition.action === 'hide' && !allowProviderUpdateOffer(listingTypeConfig);
  }
  if (condition.type === 'customerCounterOfferHidden') {
    // hide the button if the customer counter offer is not allowed
    return condition.action === 'hide' && !allowCustomerCounterOffer(listingTypeConfig);
  }
  return false;
};

const getButtonStatus = (buttonProps, additionalInfo) => {
  const { transitions, timeZone, intl, listingTypeConfig } = additionalInfo;

  if (!buttonProps?.conditions) {
    return { disabled: false, reason: '', hidden: false };
  }

  return buttonProps.conditions.reduce(
    (acc, c) => {
      const extra = { transitions, timeZone, listingTypeConfig };
      if (!acc.disabled && c.action === 'disable' && checkCondition(c, extra)) {
        // Use disabledReason.translationKey if present
        const translationKey = c.disabledReason?.translationKey;
        const fallbackReason = 'You cannot perform this action right now.'; // This should not be shown ever.

        if (!translationKey) {
          console.warn(`Translation key not found for condition: ${c.type}`);
        }

        return {
          disabled: true,
          hidden: false,
          reason: translationKey ? intl.formatMessage({ id: translationKey }) : fallbackReason,
        };
      } else if (!acc.disabled && c.action === 'hide' && checkCondition(c, extra)) {
        return { disabled: false, hidden: true, reason: '' };
      }
      return acc;
    },
    { disabled: false, reason: '', hidden: false }
  );
};

/**
 * @typedef {Object} DisabledReason
 * @property {string} translationKey - Translation key for the disabled reason message
 */

/**
 * @typedef {Object} DurationSinceTransitionCondition
 * @property {'durationSinceTransition'} type - Type of condition
 * @property {'disable'} action - Action to take when condition is met
 * @property {string} sinceTransition - The transition name to check duration since
 * @property {number} days - Number of days after which the condition applies
 * @property {DisabledReason} disabledReason - Reason for disabling the button
 */

/**
 * @typedef {Object} MaxTransitionsCondition
 * @property {'maxTransitions'} type - Type of condition
 * @property {'disable'} action - Action to take when condition is met
 * @property {number} max - Maximum number of transitions allowed
 * @property {DisabledReason} disabledReason - Reason for disabling the button
 */

/**
 * @typedef {DurationSinceTransitionCondition|MaxTransitionsCondition} ButtonCondition
 */

/**
 * @typedef {Object} ButtonProps
 * @property {boolean} [inProgress] - Whether the button action is currently in progress
 * @property {Object} [error] - Error object if the button action failed
 * @property {string} [error.type] - Error type (should be 'error')
 * @property {string} [error.name] - Error name
 * @property {string} [error.message] - Error message
 * @property {Function} onAction - Function to call when the button is clicked
 * @property {string} [buttonText] - Text to display on the button
 * @property {string} [errorText] - Text to display when there's an error
 * @property {Array<ButtonCondition>} [conditions] - Array of conditions that can disable the button
 */

/**
 * ActionButtons component is used to show the action buttons for the transaction panel.
 * It checks if the buttons should be disabled based on the conditions and transitions.
 * It also shows the error message if the button is disabled.
 *
 * @param {Object} props
 * @param {string} [props.className]
 * @param {string} [props.rootClassName]
 * @param {boolean} props.showButtons
 * @param {ButtonProps} [props.primaryButtonProps]
 * @param {ButtonProps} [props.secondaryButtonProps]
 * @param {ButtonProps} [props.tertiaryButtonProps]
 * @param {boolean} props.isListingDeleted
 * @param {boolean} props.isProvider
 * @param {Array} props.transitions
 */
const ActionButtons = props => {
  const {
    className,
    rootClassName,
    listingTypeConfig,
    showButtons,
    primaryButtonProps,
    secondaryButtonProps,
    tertiaryButtonProps,
    isListingDeleted,
    isProvider,
    transitions = [],
    hasValidData = true,
    errorMessageId,
    timeZone = 'Etc/UTC',
  } = props;

  const intl = useIntl();

  if (isListingDeleted && isProvider) {
    return null;
  }

  // Additional data passed for the button status calculation
  const extraData = { transitions, timeZone, intl, listingTypeConfig };

  const buttonsDisabled = primaryButtonProps?.inProgress || secondaryButtonProps?.inProgress;

  const primaryErrorMessage = primaryButtonProps?.error ? (
    <p className={css.actionError}>{primaryButtonProps?.errorText}</p>
  ) : null;

  const secondaryErrorMessage = secondaryButtonProps?.error ? (
    <p className={css.actionError}>{secondaryButtonProps?.errorText}</p>
  ) : null;

  const tertiaryErrorMessage = tertiaryButtonProps?.error ? (
    <p className={css.actionError}>{tertiaryButtonProps?.errorText}</p>
  ) : null;

  const hasMultipleButtons = primaryButtonProps && secondaryButtonProps && tertiaryButtonProps;
  const actionButtonOrder = props.actionButtonOrder || ['primary', 'secondary', 'tertiary'];
  const renderingOrder = [...actionButtonOrder].reverse();

  const classes = classNames(rootClassName || css.root, className);

  return showButtons ? (
    <div className={classes}>
      <div className={css.actionErrors}>
        {primaryErrorMessage || secondaryErrorMessage || tertiaryErrorMessage}
      </div>
      <div
        className={classNames(css.actionButtonsWrapper, {
          [css.multipleButtons]: !!hasMultipleButtons,
        })}
      >
        {renderingOrder.map(buttonType => {
          if (buttonType === 'primary') {
            const { disabled, reason, hidden } = getButtonStatus(primaryButtonProps, extraData);
            return primaryButtonProps && hasValidData && !hidden ? (
              <div className={css.actionButtonWrapper} key={buttonType}>
                <PrimaryButton
                  inProgress={primaryButtonProps.inProgress}
                  disabled={buttonsDisabled || disabled}
                  onClick={primaryButtonProps.onAction}
                >
                  {primaryButtonProps.buttonText}
                </PrimaryButton>
                {disabled && <div className={css.finePrint}>{reason}</div>}
              </div>
            ) : null;
          }
          if (buttonType === 'secondary') {
            const { disabled, reason, hidden } = getButtonStatus(secondaryButtonProps, extraData);
            return secondaryButtonProps && hasValidData && !hidden ? (
              <div className={css.actionButtonWrapper} key={buttonType}>
                <SecondaryButton
                  inProgress={secondaryButtonProps?.inProgress}
                  disabled={buttonsDisabled || disabled}
                  onClick={secondaryButtonProps.onAction}
                >
                  {secondaryButtonProps.buttonText}
                </SecondaryButton>
                {disabled && <div className={css.finePrint}>{reason}</div>}
              </div>
            ) : null;
          }
          if (buttonType === 'tertiary') {
            const { disabled, reason, hidden } = getButtonStatus(tertiaryButtonProps, extraData);
            return tertiaryButtonProps && hasValidData && !hidden ? (
              <div className={css.actionButtonWrapper} key={buttonType}>
                <Button
                  inProgress={tertiaryButtonProps?.inProgress}
                  disabled={buttonsDisabled || disabled}
                  onClick={tertiaryButtonProps.onAction}
                >
                  {tertiaryButtonProps.buttonText}
                </Button>
                {disabled && <div className={css.finePrint}>{reason}</div>}
              </div>
            ) : null;
          }
          return null;
        })}
        {!hasValidData ? (
          <div className={css.actionButtonWrapper}>
            <p className={css.error}>{intl.formatMessage({ id: errorMessageId })}</p>
          </div>
        ) : null}
      </div>
    </div>
  ) : null;
};

export default ActionButtons;
