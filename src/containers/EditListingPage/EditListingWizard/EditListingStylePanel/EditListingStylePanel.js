import React from 'react';
import classNames from 'classnames';

// Import configs and util modules
import { FormattedMessage } from '../../../../util/reactIntl';
import { LISTING_STATE_DRAFT } from '../../../../util/types';

// Import shared components
import { H3, H5, ListingLink } from '../../../../components';

// Import modules from this directory
import EditListingStyleForm from './EditListingStyleForm';
import css from './EditListingStylePanel.module.css';

import { colorSchemes } from '../../../../util/types';

const getInitialValues = params => {
  // If no initial value is set, assign the first option as the default value
  const { cardStyle = colorSchemes[0] } = params.listing.attributes.publicData;
  return { cardStyle };
};

const EditListingStylePanel = props => {
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

  const panelHeadingProps = isPublished
    ? {
        id: 'EditListingStylePanel.title',
        values: { listingTitle: <ListingLink listing={listing} />, lineBreak: <br /> },
        messageProps: { listingTitle: listing.attributes.title },
      }
    : {
        id: 'EditListingStylePanel.createListingTitle',
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
      <span className={css.helpText}>
        <FormattedMessage id="EditListingStyleForm.helpText" />
      </span>
      <H5 as="h2" className={css.chooseStyleHeading}>
        <FormattedMessage id="EditListingStyleForm.title" />
      </H5>
      <EditListingStyleForm
        className={css.form}
        disabled={disabled}
        ready={ready}
        fetchErrors={errors}
        initialValues={getInitialValues(props)}
        onSubmit={values => {
          const { cardStyle } = values;
          const updateValues = {
            publicData: {
              cardStyle: cardStyle,
            },
          };
          onSubmit(updateValues);
        }}
        saveActionMsg={submitButtonText}
        updated={panelUpdated}
        updateInProgress={updateInProgress}
        listingTitle={listing.attributes.title}
      />
    </main>
  );
};

export default EditListingStylePanel;
