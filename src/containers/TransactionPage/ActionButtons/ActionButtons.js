import React from 'react';
import classNames from 'classnames';

import { useIntl } from '../../../util/reactIntl';
import { getStartOf } from '../../../util/dates';

import { PrimaryButton, SecondaryButton, Button } from '../../../components';

import css from './ActionButtons.module.css';

export const ACTION_BUTTON_1_ID = 'actionButton1';
export const ACTION_BUTTON_2_ID = 'actionButton2';
export const ACTION_BUTTON_3_ID = 'actionButton3';

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
const checkCondition = (condition, transitions, timeZone) => {
  if (condition.type === 'durationSinceTransition') {
    return hasReachedMaxDurationSinceTransition(condition, transitions, timeZone);
  }
  if (condition.type === 'maxTransitions') {
    return hasReachedMaxTransitions(condition, transitions);
  }
  return false;
};

const getDisabledState = (buttonProps, transitions, timeZone, intl) => {
  if (!buttonProps?.conditions) {
    return { disabled: false, reason: '' };
  }

  return buttonProps.conditions.reduce(
    (acc, c) => {
      if (!acc.disabled && c.action === 'disable' && checkCondition(c, transitions, timeZone)) {
        // Use disabledReason.translationKey if present
        const translationKey = c.disabledReason?.translationKey;
        const fallbackReason = 'You cannot perform this action right now.'; // This should not be shown ever.

        if (!translationKey) {
          console.warn(`Translation key not found for condition: ${c.type}`);
        }

        return {
          disabled: true,
          reason: translationKey ? intl.formatMessage({ id: translationKey }) : fallbackReason,
        };
      }
      return acc;
    },
    { disabled: false, reason: '' }
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
 * @param {string} [props.containerId] - The id of the container that the buttons are in
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
    containerId = '',
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

  // Check disabling logic for each button
  const { disabled: primaryDisabled, reason: primaryReason } = getDisabledState(
    primaryButtonProps,
    transitions,
    timeZone,
    intl
  );
  const { disabled: secondaryDisabled, reason: secondaryReason } = getDisabledState(
    secondaryButtonProps,
    transitions,
    timeZone,
    intl
  );
  const { disabled: tertiaryDisabled, reason: tertiaryReason } = getDisabledState(
    tertiaryButtonProps,
    transitions,
    timeZone,
    intl
  );

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

  const actionButton1 =
    primaryButtonProps && hasValidData
      ? [
          <div className={css.actionButtonWrapper} key={ACTION_BUTTON_1_ID}>
            <PrimaryButton
              id={`${containerId}_${ACTION_BUTTON_1_ID}`}
              inProgress={primaryButtonProps.inProgress}
              disabled={buttonsDisabled || primaryDisabled}
              onClick={primaryButtonProps.onAction}
            >
              {primaryButtonProps.buttonText}
            </PrimaryButton>
            {primaryDisabled && <div className={css.finePrint}>{primaryReason}</div>}
          </div>,
        ]
      : [];
  const actionButton2 =
    secondaryButtonProps && hasValidData
      ? [
          <div className={css.actionButtonWrapper} key={ACTION_BUTTON_2_ID}>
            <SecondaryButton
              id={`${containerId}_${ACTION_BUTTON_2_ID}`}
              inProgress={secondaryButtonProps?.inProgress}
              disabled={buttonsDisabled || secondaryDisabled}
              onClick={secondaryButtonProps.onAction}
            >
              {secondaryButtonProps.buttonText}
            </SecondaryButton>
            {secondaryDisabled && <div className={css.finePrint}>{secondaryReason}</div>}
          </div>,
        ]
      : [];
  const actionButton3 =
    tertiaryButtonProps && hasValidData
      ? [
          <div className={css.actionButtonWrapper} key={ACTION_BUTTON_3_ID}>
            <Button
              id={`${containerId}_${ACTION_BUTTON_3_ID}`}
              inProgress={tertiaryButtonProps.inProgress}
              disabled={buttonsDisabled || tertiaryDisabled}
              onClick={tertiaryButtonProps.onAction}
            >
              {tertiaryButtonProps.buttonText}
            </Button>
            {tertiaryDisabled && <div className={css.finePrint}>{tertiaryReason}</div>}
          </div>,
        ]
      : [];

  const hasMultipleButtons = primaryButtonProps && secondaryButtonProps && tertiaryButtonProps;
  const actionButtons =
    hasMultipleButtons || containerId === 'desktop'
      ? [...actionButton1, ...actionButton2, ...actionButton3]
      : [...actionButton3, ...actionButton2, ...actionButton1];

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
        {actionButtons}

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
