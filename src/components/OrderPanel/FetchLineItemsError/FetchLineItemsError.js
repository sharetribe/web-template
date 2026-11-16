import React, { useEffect } from 'react';

import { FormattedMessage } from '../../../util/reactIntl';
import { isProviderCommissionBiggerThanMinPrice } from '../../../util/errors';

import css from './FetchLineItemsError.module.css';

/**
 * An error text displayed when provider minimum commission value is higher than that of the listing's price
 *
 * @component
 * @param {Object} props
 * @param {Object} [props.error] - Ther error object
 * @returns {JSX.Element}
 */
const FetchLineItemsError = props => {
  const { error } = props;
  const hasError = !!error;
  const isCommissionTooBig = hasError && isProviderCommissionBiggerThanMinPrice(error);

  useEffect(() => {
    if (isCommissionTooBig) {
      // eslint-disable-next-line no-console
      console.error(error.statusText);
    }
  }, [error, isCommissionTooBig]);

  return isCommissionTooBig ? (
    <span className={css.error}>
      <FormattedMessage id="FetchLineItemsError.providerCommissionBiggerThanMinPrice" />
    </span>
  ) : hasError ? (
    <span className={css.error}>
      <FormattedMessage id="FetchLineItemsError.unknownError" />
    </span>
  ) : null;
};

export default FetchLineItemsError;
