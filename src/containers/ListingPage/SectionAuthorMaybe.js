import React from "react";

import { Heading, Modal } from "../../components";
import { INQUIRY_PROCESS_NAME, resolveLatestProcessName } from "../../transactions/transaction";
import { FormattedMessage } from "../../util/reactIntl";
import InquiryForm from "./InquiryForm/InquiryForm";
import css from "./ListingPage.module.css";
import UserCard from "./UserCard/UserCard";

const SectionAuthorMaybe = (props) => {
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

	const transactionProcessAlias = listing?.attributes?.publicData?.transactionProcessAlias || "";
	const processName = resolveLatestProcessName(transactionProcessAlias.split("/")[0]);
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
		</section>
	);
};

export default SectionAuthorMaybe;
