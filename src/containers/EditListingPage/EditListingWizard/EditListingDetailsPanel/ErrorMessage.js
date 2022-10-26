import React from 'react';

import { FormattedMessage } from '../../../../util/reactIntl';

/**
 * Error messages (e.g. invalidExistingTransactionType and noTransactionTypeSet)
 * @param {object} props
 * @returns JSX element containing the error message
 */
const ErrorMessage = props => {
  const { invalidExistingTransactionType, noTransactionTypeSet, marketplaceName } = props;
  return invalidExistingTransactionType ? (
    <div>
      <h2>
        <FormattedMessage id="EditListingDetailsPanel.invalidTransactionTypeSetTitle" />
      </h2>
      <p>
        <FormattedMessage
          id="EditListingDetailsPanel.invalidTransactionTypeSetDescription"
          values={{ marketplaceName }}
        />
      </p>
    </div>
  ) : noTransactionTypeSet ? (
    <div>
      <h2>
        <FormattedMessage id="EditListingDetailsPanel.noTransactionTypeSetTitle" />
      </h2>
      <p>
        <FormattedMessage id="EditListingDetailsPanel.noTransactionTypeSetDescription" />
      </p>
    </div>
  ) : null;
};

export default ErrorMessage;
