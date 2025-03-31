import React from 'react';
import { useIntl } from 'react-intl';
import classNames from 'classnames';
import { Check, XIcon } from 'lucide-react';

import {
  PROGRESS_STEP_CANCELED,
  PROGRESS_STEP_IN_PROGRESS,
  PROGRESS_STEP_COMPLETED,
  PROGRESS_STEP_PENDING,
} from '../../common/constants';

import css from './ProgressStep.module.css';

const getIconContent = state => {
  switch (state) {
    case PROGRESS_STEP_COMPLETED:
      return <Check />;
    case PROGRESS_STEP_CANCELED:
      return <XIcon />;
    case PROGRESS_STEP_IN_PROGRESS:
      return <div className={css.innerCircleInProgress} />;
    default:
      return <div className={css.innerCirclePending} />;
  }
};

function ProgressStep({
  step,
  stepCount,
  processName,
  isFinal,
  state: stepState,
  rootClassName,
  className,
  categoryLevel1,
}) {
  const intl = useIntl();

  const isCompleted = stepState === PROGRESS_STEP_COMPLETED;
  const isInProgress = stepState === PROGRESS_STEP_IN_PROGRESS;
  const isCanceled = stepState === PROGRESS_STEP_CANCELED;
  const isPending = stepState === PROGRESS_STEP_PENDING;

  const containerClasses = classNames(css.root || rootClassName, css.container, className);
  const iconContainerClasses = classNames(css.iconContainer, {
    [css.iconContainerDone]: isCompleted,
    [css.iconContainerInProgress]: isInProgress,
    [css.iconContainerCanceled]: isCanceled,
    [css.iconContainerPending]: isPending,
  });

  return (
    <div className={containerClasses}>
      <div className={css.iconLineContainer}>
        <div className={iconContainerClasses}>{getIconContent(stepState)}</div>
        <div
          className={classNames(css.progressLineContainer, {
            [css.hideProgressLine]: isFinal || isCanceled,
          })}
        >
          <div
            className={classNames({
              [css.progressLineInProgress]: isInProgress,
              [css.progressLineDone]: isCompleted,
            })}
          />
        </div>
      </div>
      <span className={css.stepCount}>
        {intl.formatMessage({ id: `ProgressStep.stepCount` }, { stepCount })}
      </span>
      <span className={css.stepTitle}>
        {intl.formatMessage(
          { id: `ProgressStep.stepTitle.${processName}.${step}` },
          { categoryLevel1: categoryLevel1?.replaceAll('-', '_') || 'empty' }
        )}
      </span>
      <span
        className={classNames({
          [css.stepStateDone]: isCompleted,
          [css.stepStateInProgress]: isInProgress,
          [css.stepStateCanceled]: isCanceled,
          [css.stepStatePending]: isPending,
        })}
      >
        {intl.formatMessage({ id: `ProgressStep.stepState.${stepState}` })}
      </span>
    </div>
  );
}

export default ProgressStep;
