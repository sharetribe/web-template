import React from 'react';
import { H4 } from '../../../components';

import css from './TransactionPanel.module.css';
import { formatMoney } from '../../../util/currency';

// Functional component as a helper to build detail card headings
const DetailCardHeadingsMaybe = props => {
  const { showDetailCardHeadings, listingTitle, subTitle, showPrice, price, intl } = props;

  return showDetailCardHeadings ? (
    <div className={css.detailCardHeadings}>
      <H4 as="h2" className={css.detailCardTitle}>
        {listingTitle}

        {showPrice && price ? (
          <>
            <br />
            <span className={css.inquiryPrice}>{formatMoney(intl, price)}</span>
          </>
        ) : null}
      </H4>
      {subTitle ? <p className={css.detailCardSubtitle}>{subTitle}</p> : null}
    </div>
  ) : null;
};

export default DetailCardHeadingsMaybe;
