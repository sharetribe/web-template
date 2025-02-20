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

function ProgressBar({ steps, stateData }) {
  const {
    isCanceled: isCanceledProcess,
    isCompleted: isCompletedProcess,
    processName,
    processState,
    progressStep,
  } = stateData || {};
  const currentStepIndex = steps.findIndex(step => step === progressStep);

  if (!Array.isArray(steps) || steps.length === 0 || !stateData || currentStepIndex === -1) {
    return null;
  }

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

  return (
    <div className={css.container}>
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
  );
}

export default ProgressBar;
