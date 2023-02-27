import React from 'react';
import { H4 } from '../../../components';

import css from './TransactionPanel.module.css';

// Functional component as a helper to build detail card headings
const DetailCardHeadingsMaybe = props => {
  const { showDetailCardHeadings, listingTitle, subTitle } = props;

  return showDetailCardHeadings ? (
    <div className={css.detailCardHeadings}>
      <H4 as="h2" className={css.detailCardTitle}>
        {listingTitle}
      </H4>
      {subTitle ? <p className={css.detailCardSubtitle}>{subTitle}</p> : null}
    </div>
  ) : null;
};

export default DetailCardHeadingsMaybe;
