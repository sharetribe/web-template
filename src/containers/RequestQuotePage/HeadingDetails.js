import React from 'react';

// Import contexts and util modules
import { FormattedMessage } from '../../util/reactIntl';
import { displayPrice } from '../../util/configHelpers';
import { formatMoney } from '../../util/currency';
import { createSlug } from '../../util/urlHelpers';

// Import shared components
import { H4, NamedLink } from '../../components';

import css from './RequestQuotePage.module.css';

export const HeadingDetails = props => {
  const { intl, listing, listingTitle, listingTypeConfig, price } = props;

  const listingTitleLink = (
    <NamedLink
      name="ListingPage"
      params={{ id: listing?.id?.uuid, slug: createSlug(listingTitle) }}
    >
      {listingTitle}
    </NamedLink>
  );

  const showPrice = displayPrice(listingTypeConfig);

  return (
    <H4 as="h2" className={css.detailsHeadingMobile}>
      <FormattedMessage
        id="RequestQuotePage.listingTitle"
        values={{ listingTitle: listingTitleLink }}
      />

      {showPrice && price ? (
        <>
          <br />
          <span className={css.headingPrice}>{formatMoney(intl, price)}</span>
        </>
      ) : null}
    </H4>
  );
};

export default HeadingDetails;
