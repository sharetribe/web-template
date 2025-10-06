import React from 'react';

// Import contexts and util modules
import { FormattedMessage } from '../../../util/reactIntl.js';
import { isTransactionInitiateListingNotFoundError } from '../../../util/errors.js';

import css from './ErrorMessage.module.css';

/**
 * ErrorMessage component
 *
 * @param {Object} props - The component props
 * @param {Object} props.error - The error object
 * @returns {React.ReactElement} The ErrorMessage component
 */
const ErrorMessage = props => {
  const { error } = props;

  // There might be a deleted or closed listing
  const listingNotFound = isTransactionInitiateListingNotFoundError(error);

  // No transaction process attached to listing
  const noTransactionProcessAlias = error?.message === 'No transaction process attached to listing';

  return error ? (
    <p className={css.error}>
      {listingNotFound ? (
        <FormattedMessage id="InitiateNegotiationPage.listingNotFoundError" />
      ) : noTransactionProcessAlias ? (
        <FormattedMessage id="InitiateNegotiationPage.initiateNegotiationErrorNoProcess" />
      ) : (
        <FormattedMessage id="InitiateNegotiationPage.initiateNegotiationError" />
      )}
    </p>
  ) : null;
};

export default ErrorMessage;
