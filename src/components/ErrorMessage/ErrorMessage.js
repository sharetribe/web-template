import React from 'react';
import classNames from 'classnames';

// Import contexts and util modules
import { FormattedMessage } from '../../util/reactIntl.js';
import {
  isErrorNoPermissionForInitiateTransactions,
  isErrorNoPermissionForUserPendingApproval,
  isTooManyRequestsError,
  isTransactionInitiateListingNotFoundError,
} from '../../util/errors.js';
import { NO_ACCESS_PAGE_INITIATE_TRANSACTIONS } from '../../util/urlHelpers.js';

import { NamedLink } from '../../components';

import css from './ErrorMessage.module.css';

/**
 * ErrorMessage component that handles some common errors.
 * NOTE: this does not handle all the errors and some components have their own custom ErrorMessage component.
 *
 * @param {Object} props - The component props
 * @param {Object} props.error - The error object
 * @returns {React.ReactElement} The ErrorMessage component
 */
const ErrorMessage = props => {
  const { className, rootClassName, error } = props;

  // There might be a deleted or closed listing
  const listingNotFound = isTransactionInitiateListingNotFoundError(error);
  const userPendingApproval = isErrorNoPermissionForUserPendingApproval(error);
  const userHasNoTransactionRights = isErrorNoPermissionForInitiateTransactions(error);
  const tooManyRequests = isTooManyRequestsError(error);

  // No transaction process attached to listing
  const noTransactionProcessAlias = error?.message === 'No transaction process attached to listing';

  return error ? (
    <p className={classNames(rootClassName || css.error, className)}>
      {listingNotFound ? (
        <FormattedMessage id="ErrorMessage.listingNotFoundError" />
      ) : noTransactionProcessAlias ? (
        <FormattedMessage id="ErrorMessage.noProcessAttachedToListing" />
      ) : tooManyRequests ? (
        <FormattedMessage id="ErrorMessage.tooManyRequestsError" />
      ) : userPendingApproval ? (
        <FormattedMessage id="ErrorMessage.userPendingApprovalError" />
      ) : userHasNoTransactionRights ? (
        <FormattedMessage
          id="ErrorMessage.noTransactionRightsError"
          values={{
            NoAccessLink: msg => (
              <NamedLink
                name="NoAccessPage"
                params={{ missingAccessRight: NO_ACCESS_PAGE_INITIATE_TRANSACTIONS }}
              >
                {msg}
              </NamedLink>
            ),
          }}
        />
      ) : (
        <FormattedMessage id="ErrorMessage.unknownError" />
      )}
    </p>
  ) : null;
};

export default ErrorMessage;
