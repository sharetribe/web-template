import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from '../../util/reactIntl';
import { formatMoney } from '../../util/currency';
import { formatDateIntoPartials } from '../../util/dates';
import { createSlug } from '../../util/urlHelpers';
import { NamedLink } from '../../components';
import { getStatusFromLastTransition } from '../../transactions/transactionHelpers';

import css from './PayoutItem.module.css';

const StatusBadge = ({ status, intl }) => {
  const statusClasses = {
    completed: css.badgeCompleted,
    pending: css.badgePending,
    cancelled: css.badgeCancelled,
  };

  const statusKeys = {
    completed: 'PayoutItem.statusCompleted',
    pending: 'PayoutItem.statusPending',
    cancelled: 'PayoutItem.statusCancelled',
  };

  return (
    <span className={statusClasses[status] || css.badgePending}>
      {intl.formatMessage({ id: statusKeys[status] || statusKeys.pending })}
    </span>
  );
};

const PayoutItem = props => {
  const { tx } = props;
  const intl = useIntl();

  const {
    lastTransition,
    lastTransitionedAt,
    payinTotal,
    payoutTotal,
    processName,
  } = tx.attributes;

  const listing = tx.listing;
  const customer = tx.customer;
  const listingTitle = listing?.attributes?.title || '';
  const buyerName = customer?.attributes?.profile?.displayName || '';
  const txId = tx.id.uuid;

  const status = getStatusFromLastTransition(processName, lastTransition);

  const dateInfo = formatDateIntoPartials(lastTransitionedAt, intl);
  const dateStr = `${dateInfo.date} ${dateInfo.time}`;

  const formattedPayin = payinTotal ? formatMoney(intl, payinTotal) : '—';
  const formattedPayout = payoutTotal ? formatMoney(intl, payoutTotal) : '—';

  const listingSlug = createSlug(listingTitle);

  return (
    <div className={css.root}>
      <div className={css.infoSection}>
        <div className={css.titleRow}>
          <NamedLink className={css.listingLink} name="SaleDetailsPage" params={{ id: txId }}>
            {listingTitle}
          </NamedLink>
          <StatusBadge status={status} intl={intl} />
        </div>
        <div className={css.details}>
          <span className={css.buyer}>{buyerName}</span>
          <span className={css.date}>{dateStr}</span>
        </div>
      </div>
      <div className={css.amountSection}>
        <div className={css.amountRow}>
          <span className={css.amountLabel}>{intl.formatMessage({ id: 'PayoutItem.gross' })}</span>
          <span className={css.amountGross}>{formattedPayin}</span>
        </div>
        <div className={css.amountRow}>
          <span className={css.amountLabel}>{intl.formatMessage({ id: 'PayoutItem.net' })}</span>
          <span className={css.amountNet}>{formattedPayout}</span>
        </div>
      </div>
    </div>
  );
};

StatusBadge.propTypes = {
  status: PropTypes.string,
  intl: PropTypes.object.isRequired,
};

PayoutItem.propTypes = {
  tx: PropTypes.object.isRequired,
};

export default React.memo(PayoutItem);
