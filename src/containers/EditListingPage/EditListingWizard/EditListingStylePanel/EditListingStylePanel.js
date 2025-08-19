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
  } = props;

  const rootClass = rootClassName || css.root;
  const classes = classNames(rootClass, className);
  const isPublished = listing?.id && listing?.attributes?.state !== LISTING_STATE_DRAFT;

  return (
    <main className={classes}>
      <H3 as="h1">
        {isPublished ? (
          <FormattedMessage
            id="EditListingStylePanel.title"
            values={{ listingTitle: <ListingLink listing={listing} />, lineBreak: <br /> }}
          />
        ) : (
          <FormattedMessage
            id="EditListingStylePanel.createListingTitle"
            values={{ lineBreak: <br /> }}
          />
        )}
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
