import React from 'react';
import { FormattedMessage } from '../../util/reactIntl';
import { INQUIRY_PROCESS_NAME, resolveLatestProcessName } from '../../transactions/transaction';
import { Heading, Modal } from '../../components';
import UserCard from './UserCard/UserCard';
import InquiryForm from './InquiryForm/InquiryForm';
import css from './ListingPage.module.css';

const CONTACT_USER_LINK = 'inquiryModalContactUserLink';

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

  // Récupérer les données publiques de l'auteur
  const author = listing.author;
  const { publicData } = author.attributes.profile || {};
  const phoneNumber = publicData?.publicPhone || null;
  const email = publicData?.publicEmail || null;

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
        contactLinkId={CONTACT_USER_LINK}
      />

      {/* Coordonnées de l'annonceur */}
      {(email || phoneNumber) && (
        <div className={css.authorContact}>
          {email && (
            <div className={css.contactItem}>
              <span className={css.contactLabel}>Email : </span>
              <a href={`mailto:${email}`} className={css.contactLink}>{email}</a>
            </div>
          )}
          {phoneNumber && (
            <div className={css.contactItem}>
              <span className={css.contactLabel}>Téléphone : </span>
              <a href={`tel:${phoneNumber}`} className={css.contactLink}>{phoneNumber}</a>
            </div>
          )}
        </div>
      )}

      <Modal
        id="ListingPage.inquiry"
        contentClassName={css.inquiryModalContent}
        isOpen={isInquiryModalOpen}
        onClose={onCloseInquiryModal}
        usePortal
        onManageDisableScrolling={onManageDisableScrolling}
        focusElementId={CONTACT_USER_LINK}
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
    </section>
  );
};

export default SectionAuthorMaybe;
