import React from 'react';
import { FormattedMessage } from '../../../util/reactIntl';

import css from './SubmitFinePrint.module.css';

/**
 * A component that displays the fine print for the submit button.
 * Note: this is not in use for ProductOrderForm.
 *
 * @component
 * @param {Object} props
 * @param {string} [props.payoutDetailsWarning] - The payout details warning
 * @param {boolean} [props.isOwnListing] - Whether the listing is owned by the current user
 */
const SubmitFinePrint = ({
  payoutDetailsWarning,
  isOwnListing,
  omitYouWontBeChargedMessage = false,
}) => {
  return (
    <p className={css.finePrint}>
      {payoutDetailsWarning ? (
        payoutDetailsWarning
      ) : isOwnListing ? (
        <FormattedMessage id="OrderPanel.ownListing" />
      ) : !omitYouWontBeChargedMessage ? (
        <FormattedMessage id="OrderPanel.youWontBeChargedInfo" />
      ) : null}
    </p>
  );
};

export default SubmitFinePrint;
