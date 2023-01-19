import React from 'react';
import { FormattedMessage } from '../../util/reactIntl';
import { UserCard, Modal } from '../../components';
import InquiryForm from './InquiryForm/InquiryForm';

import css from './ListingPage.module.css';

const SectionAuthorMaybe = props => {
  const {
    title,
    listing,
    authorDisplayName,
    onContactUser,
    isInquiryModalOpen,
    onCloseInquiryModal,
    sendInquiryError,
    sendInquiryInProgress,
    onSubmitInquiry,
    currentUser,
    onManageDisableScrolling,
  } = props;

  if (!listing.author) {
    return null;
  }

  return (
    <div id="author" className={css.sectionAuthor}>
      <h2 className={css.aboutProviderTitle}>
        <FormattedMessage id="ListingPage.aboutProviderTitle" />
      </h2>
      <UserCard user={listing.author} currentUser={currentUser} onContactUser={onContactUser} />
      <Modal
        id="ListingPage.inquiry"
        contentClassName={css.inquiryModalContent}
        isOpen={isInquiryModalOpen}
        onClose={onCloseInquiryModal}
        usePortal
        onManageDisableScrolling={onManageDisableScrolling}
      >
        <InquiryForm
          className={css.inquiryForm}
          submitButtonWrapperClassName={css.inquirySubmitButtonWrapper}
          listingTitle={title}
          authorDisplayName={authorDisplayName}
          sendInquiryError={sendInquiryError}
          onSubmit={onSubmitInquiry}
          inProgress={sendInquiryInProgress}
        />
      </Modal>
    </div>
  );
};

export default SectionAuthorMaybe;
