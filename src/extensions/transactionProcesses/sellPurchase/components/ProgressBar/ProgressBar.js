import React from 'react';
import ProgressBarComponent from '../../../components/ProgressBar/ProgressBar';
import { SELL_PURCHASE_PROGRESS_BAR_STEPS_CUSTOMER } from '../../../common/constants';

function ProgressBar({ stateData }) {
  const { processName, progressStep, isFinal } = stateData;
  return <ProgressBarComponent steps={SELL_PURCHASE_PROGRESS_BAR_STEPS_CUSTOMER} {...stateData} />;
}

export default ProgressBar;
