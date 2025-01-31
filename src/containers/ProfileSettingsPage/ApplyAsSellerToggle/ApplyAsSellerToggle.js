import React from 'react';
import classNames from 'classnames';

import { FormattedMessage } from '../../../util/reactIntl';
import { SELLER_STATUS } from '../../../util/types';
import { isBuyer, isCreativeSeller } from '../../../util/userHelpers';

import { FieldSwitch, H4 } from '../../../components';

import css from './ApplyAsSellerToggle.module.css';

function getApplyAsSellerFieldConfig(userType, sellerStatus) {
  if (isCreativeSeller(userType)) {
    const showPendingLabel = !sellerStatus || sellerStatus === SELLER_STATUS.APPLIED;
    const showWaitlistedLabel = sellerStatus === SELLER_STATUS.WAITLISTED;
    const showToggle = false;
    if (showPendingLabel) {
      const showField = true;
      return [
        showField,
        showToggle,
        'ProfileSettingsForm.applyAsSellerPendingInfo',
        'APPLICATION RECEIVED',
      ];
    }
    if (showWaitlistedLabel) {
      const showField = true;
      return [
        showField,
        showToggle,
        'ProfileSettingsForm.applyAsSellerWaitlistedInfo',
        'YOU’RE ON THE WAITLIST',
      ];
    }
    const showField = false;
    return [showField, showToggle, 'ProfileSettingsForm.applyAsSellerWaitlistedInfo', false];
  }
  const showField = isBuyer(userType);
  const showToggle = isBuyer(userType);
  return [showField, showToggle, 'ProfileSettingsForm.applyAsSellerInfo', false];
}

function ApplyAsSellerToggle({ userType, sellerStatus }) {
  const [
    showApplyAsSellerField,
    showApplyAsSellerToggle,
    applyAsSellerInfoId,
    applicationStatus,
  ] = getApplyAsSellerFieldConfig(userType, sellerStatus);
  return showApplyAsSellerField ? (
    <div className={classNames(css.sectionContainer, css.root)}>
      <div
        className={classNames(css.infoSection, {
          [css.withToggle]: showApplyAsSellerToggle,
        })}
      >
        <H4
          as="h2"
          className={classNames(css.sectionTitle, {
            [css.withToggle]: showApplyAsSellerToggle,
          })}
        >
          <FormattedMessage id="ProfileSettingsForm.applyAsSellerHeading" />
          {applicationStatus && (
            <span className={css.statusLabel}>STATUS: {applicationStatus}</span>
          )}
        </H4>
        <p className={css.extraInfo}>
          <FormattedMessage id={applyAsSellerInfoId} />
        </p>
      </div>
      {showApplyAsSellerToggle && <FieldSwitch id="applyAsSeller" name="applyAsSeller" />}
    </div>
  ) : null;
}

export default ApplyAsSellerToggle;
