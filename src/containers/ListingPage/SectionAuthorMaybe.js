import React from 'react';
import { FormattedMessage } from '../../util/reactIntl';
import { INQUIRY_PROCESS_NAME, resolveLatestProcessName } from '../../transactions/transaction';

import { Heading } from '../../components';
import UserCard from './UserCard/UserCard';

import css from './ListingPage.module.css';

const SectionAuthorMaybe = props => {
  const { listing, onContactUser, currentUser } = props;

  if (!listing.author) {
    return null;
  }

  const transactionProcessAlias = listing?.attributes?.publicData?.transactionProcessAlias || '';
  const processName = resolveLatestProcessName(transactionProcessAlias.split('/')[0]);
  const isInquiryProcess = processName === INQUIRY_PROCESS_NAME;

  return (
    <section id="author" className={css.sectionAuthor}>
      <Heading as="h2" rootClassName={css.sectionHeadingWithExtraMargin}>
        <FormattedMessage id="ListingPage.aboutProviderTitle" />
      </Heading>
      <UserCard
        user={listing.author}
        currentUser={currentUser}
        onContactUser={onContactUser}
        showContact={!isInquiryProcess}
      />
    </section>
  );
};

export default SectionAuthorMaybe;
