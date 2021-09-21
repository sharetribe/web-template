import React from 'react';

import css from './TransactionPanel.module.css';

// Functional component as a helper to build detail card headings
const DetailCardHeadingsMaybe = props => {
  const { showDetailCardHeadings, listingTitle, subTitle } = props;

  return showDetailCardHeadings ? (
    <div className={css.detailCardHeadings}>
      <h2 className={css.detailCardTitle}>{listingTitle}</h2>
      <p className={css.detailCardSubtitle}>{subTitle}</p>
    </div>
  ) : null;
};

export default DetailCardHeadingsMaybe;
