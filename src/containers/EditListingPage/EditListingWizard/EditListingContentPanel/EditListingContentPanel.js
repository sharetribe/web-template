import React from 'react';
import classNames from 'classnames';

// Import configs and util modules
import { FormattedMessage } from '../../../../util/reactIntl';
import { LISTING_STATE_DRAFT } from '../../../../util/types';

// Import shared components
import { H3, ListingLink } from '../../../../components';

// Import modules from this directory
import EditListingContentForm from './EditListingContentForm';
import css from './EditListingContentPanel.module.css';

const getInitialValues = params => {
  const { description = '' } = params.listing.attributes.publicData || {};
  return { description };
};

/**
 * The EditListingContentPanel component.
 *
 * @component
 * @param {Object} props
 * @returns {JSX.Element}
 */
const EditListingContentPanel = props => {
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
  const { listingType } = listing?.attributes?.publicData || {};
  const isVideoCourse = listingType === 'video-course';

  const panelHeadingProps = isPublished
    ? {
        id: isVideoCourse
          ? 'EditListingContentPanel.videoClassTitle'
          : 'EditListingContentPanel.title',
        values: { listingTitle: <ListingLink listing={listing} />, lineBreak: <br /> },
        messageProps: { listingTitle: listing.attributes.title },
      }
    : {
        id: isVideoCourse
          ? 'EditListingContentPanel.classStructureTitle'
          : 'EditListingContentPanel.createListingTitle',
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
      <p className={css.description}>
        <FormattedMessage
          id={
            isVideoCourse
              ? 'EditListingContentPanel.classStructureDescription'
              : 'EditListingContentPanel.description'
          }
        />
      </p>
      <EditListingContentForm
        className={css.form}
        disabled={disabled}
        ready={ready}
        fetchErrors={errors}
        initialValues={getInitialValues(props)}
        onSubmit={values => {
          const { description } = values;
          const updateValues = {
            publicData: { description },
          };
          onSubmit(updateValues);
        }}
        saveActionMsg={submitButtonText}
        updated={panelUpdated}
        updateInProgress={updateInProgress}
      />
    </main>
  );
};

export default EditListingContentPanel;
