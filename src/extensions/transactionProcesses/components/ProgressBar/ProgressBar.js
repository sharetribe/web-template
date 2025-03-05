import React from 'react';
import classNames from 'classnames';

import ProgressStep from '../ProgressStep/ProgressStep';
import {
  PROGRESS_STEP_CANCELED,
  PROGRESS_STEP_IN_PROGRESS,
  PROGRESS_STEP_COMPLETED,
  PROGRESS_STEP_PENDING,
} from '../../common/constants';

import css from './ProgressBar.module.css';

function ProgressBar({ steps, stateData, rootClassName, className }) {
  if (!Array.isArray(steps) || steps.length === 0 || !stateData) {
    return null;
  }

  const {
    isCanceled: isCanceledProcess,
    isCompleted: isCompletedProcess,
    processName,
    progressStep,
  } = stateData || {};

  const currentStepIndex = steps.findIndex(step => step === progressStep);

  const getStepState = stepIndex => {
    if (stepIndex < currentStepIndex || isCompletedProcess) {
      return PROGRESS_STEP_COMPLETED;
    }

    const isInProgress = stepIndex === currentStepIndex;
    if (isInProgress && isCanceledProcess) {
      return PROGRESS_STEP_CANCELED;
    }
    if (isInProgress) {
      return PROGRESS_STEP_IN_PROGRESS;
    }

    return PROGRESS_STEP_PENDING;
  };

  const rootClasses = classNames(rootClassName || css.root);
  const containerClasses = classNames(css.container, className);

  if (currentStepIndex === -1) {
    // For Checkout Page & Listing Page
    // we render every step as in progress step
    return (
      <div className={rootClasses}>
        <div className={containerClasses}>
          {steps.map((step, stepIndex) => {
            const isFinal = stepIndex === steps.length - 1;
            return (
              <ProgressStep
                key={stepIndex}
                step={step}
                stepCount={stepIndex + 1}
                processName={processName}
                isFinal={isFinal}
                state={PROGRESS_STEP_PENDING}
              />
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={rootClasses}>
      <div className={containerClasses}>
        {steps.map((step, stepIndex) => {
          const isFinal = stepIndex === steps.length - 1;
          const isHidden = isCanceledProcess && stepIndex > currentStepIndex;

          return (
            <ProgressStep
              key={stepIndex}
              step={step}
              stepCount={stepIndex + 1}
              processName={processName}
              isFinal={isFinal}
              state={getStepState(stepIndex)}
              className={classNames({ [css.hiddenStep]: isHidden })}
            />
          );
        })}
      </div>
    </div>
  );
}

export default ProgressBar;
