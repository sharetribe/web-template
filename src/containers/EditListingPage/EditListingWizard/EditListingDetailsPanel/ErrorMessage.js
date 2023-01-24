import React from 'react';

import { FormattedMessage } from '../../../../util/reactIntl';

/**
 * Error messages (e.g. invalidExistingListingType and noListingTypesSet)
 * @param {object} props
 * @returns JSX element containing the error message
 */
const ErrorMessage = props => {
  const { invalidExistingListingType, noListingTypesSet, marketplaceName } = props;
  return invalidExistingListingType ? (
    <div>
      <h2>
        <FormattedMessage id="EditListingDetailsPanel.invalidListingTypeSetTitle" />
      </h2>
      <p>
        <FormattedMessage
          id="EditListingDetailsPanel.invalidListingTypeSetDescription"
          values={{ marketplaceName }}
        />
      </p>
    </div>
  ) : noListingTypesSet ? (
    <div>
      <h2>
        <FormattedMessage id="EditListingDetailsPanel.noListingTypeSetTitle" />
      </h2>
      <p>
        <FormattedMessage id="EditListingDetailsPanel.noListingTypeSetDescription" />
      </p>
    </div>
  ) : null;
};

export default ErrorMessage;
