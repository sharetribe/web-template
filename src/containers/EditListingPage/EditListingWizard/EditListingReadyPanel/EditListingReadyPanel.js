import React from 'react';
import classNames from 'classnames';

// Import configs and util modules
import { FormattedMessage } from '../../../../util/reactIntl';
import { LISTING_STATE_DRAFT, LISTING_STATE_PENDING_APPROVAL } from '../../../../util/types';
import { createSlug } from '../../../../util/urlHelpers';

// Import shared components
import { H3, ListingLink } from '../../../../components';

// Import modules from this directory
import EditListingReadyForm from './EditListingReadyForm.js';
import css from './EditListingReadyPanel.module.css';

/**
 * The EditListingReadyPanel component.
 * This is the final step in the listing wizard — it publishes the listing.
 *
 * @component
 * @param {Object} props
 * @returns {JSX.Element}
 */
const EditListingReadyPanel = props => {
  const {
    className,
    rootClassName,
    errors,
    disabled,
    ready,
    listing,
    submitButtonText,
    panelUpdated,
    updateInProgress,
    onSubmit,
    updatePageTitle: UpdatePageTitle,
    intl,
  } = props;

  const rootClass = rootClassName || css.root;
  const classes = classNames(rootClass, className);
  const isPublished = listing?.id && listing?.attributes?.state !== LISTING_STATE_DRAFT;
  const listingState = listing?.attributes?.state;
  const isDraft = listingState === LISTING_STATE_DRAFT;
  const isPendingApproval = listingState === LISTING_STATE_PENDING_APPROVAL;
  const previewVariant = isDraft ? 'draft' : isPendingApproval ? 'pending-approval' : null;
  const listingId = listing?.id?.uuid;
  const listingTitle = listing?.attributes?.title || '';
  const listingSlug = createSlug(listingTitle);
  const { privateData } = listing?.attributes || {};
  const { agreedToTerms, confirmedOriginalContent, confirmedNoAi } = privateData || {};

  const panelHeadingProps = isPublished
    ? {
        id: 'EditListingReadyPanel.title',
        values: { listingTitle: <ListingLink listing={listing} />, lineBreak: <br /> },
        messageProps: { listingTitle: listing.attributes.title },
      }
    : {
        id: 'EditListingReadyPanel.createListingTitle',
        values: { lineBreak: <br /> },
        messageProps: {},
      };

  return (
    <main className={classes}>
      <UpdatePageTitle
        panelHeading={intl.formatMessage(
          { id: panelHeadingProps.id },
          { ...panelHeadingProps.messageProps }
        )}
      />
      <H3 as="h1">
        <FormattedMessage id={panelHeadingProps.id} values={{ ...panelHeadingProps.values }} />
      </H3>

      <EditListingReadyForm
        className={css.form}
        disabled={disabled}
        ready={ready}
        fetchErrors={errors}
        initialValues={{
          agreedToTerms: agreedToTerms ?? [],
          confirmedOriginalContent: confirmedOriginalContent ?? [],
          confirmedNoAi: confirmedNoAi ?? [],
        }}
        onSubmit={values => {
          const { agreedToTerms, confirmedOriginalContent, confirmedNoAi } = values;

          onSubmit({
            privateData: {
              agreedToTerms,
              confirmedOriginalContent,
              confirmedNoAi,
            },
          });
        }}
        saveActionMsg={submitButtonText}
        updated={panelUpdated}
        updateInProgress={updateInProgress}
        listingId={listingId}
        listingSlug={listingSlug}
        previewVariant={previewVariant}
      />
    </main>
  );
};

export default EditListingReadyPanel;
