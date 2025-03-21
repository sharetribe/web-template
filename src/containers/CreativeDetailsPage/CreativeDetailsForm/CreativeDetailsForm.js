import React, { useState } from 'react';
import { bool, func, object, shape, string } from 'prop-types';
import { Form as FinalForm } from 'react-final-form';
import arrayMutators from 'final-form-arrays';

// Import configs and util modules
import { useConfiguration } from '../../../context/configurationContext';
import { FormattedMessage, useIntl } from '../../../util/reactIntl';
import { LISTING_TYPES, propTypes } from '../../../util/types';
import { pickCategoryFields } from '../../../util/fieldHelpers';

// Import shared components
import { Form, Button } from '../../../components';

import EditDetailsForm from './EditDetailsForm/EditDetailsForm';
import {
  pickListingFieldsData,
  getInitialValues as getInitialDetailsValues,
} from './EditDetailsForm/helper';
import EditLocationForm from './EditLocationForm/EditLocationForm';
import { getInitialValues as getInitialLocationValues } from './EditLocationForm/helper';

import css from './CreativeDetailsForm.module.css';

// Show various error messages
const ErrorMessage = props => {
  const { fetchErrors } = props;
  const { updateListingError, showListingsError } = fetchErrors || {};
  const errorMessage = updateListingError ? (
    <FormattedMessage id="CreativeDetailsPage.updateFailed" />
  ) : showListingsError ? (
    <FormattedMessage id="CreativeDetailsPage.showListingFailed" />
  ) : null;
  if (errorMessage) {
    return <p className={css.error}>{errorMessage}</p>;
  }
  return null;
};

export const CreativeDetailsForm = ({
  listingId,
  listing,
  errors,
  updateInProgress = false,
  onUpdateListing,
}) => {
  const [updated, setUpdated] = useState(false);
  const config = useConfiguration();
  const intl = useIntl();
  const listingType = LISTING_TYPES.PROFILE;
  const listingFields = config.listing.listingFields;
  const listingCategories = config.categoryConfiguration.categories;
  const categoryKey = config.categoryConfiguration.key;
  const initialDetailsValues = getInitialDetailsValues(
    listing,
    listingFields,
    listingCategories,
    categoryKey
  );
  const initialLocationValues = getInitialLocationValues(listing);
  const initialValues = {
    ...initialDetailsValues,
    ...initialLocationValues,
  };

  const getDetailsValues = values => {
    const nestedCategories = pickCategoryFields(values, categoryKey, 1, listingCategories);
    const publicListingFields = pickListingFieldsData(
      values,
      'public',
      listingType,
      nestedCategories,
      listingFields
    );
    const privateListingFields = pickListingFieldsData(
      values,
      'private',
      listingType,
      nestedCategories,
      listingFields
    );
    return {
      publicData: publicListingFields,
      privateData: privateListingFields,
    };
  };
  const getLocationValues = values => {
    const { location } = values;
    const {
      selectedPlace: { address, origin },
    } = location;
    return {
      geolocation: origin,
      publicData: {
        location: { address, building: '' },
      },
    };
  };
  const onSubmit = async values => {
    try {
      const { publicData: detailsPublicData, ...listingDetails } = getDetailsValues(values);
      const { publicData: locationPublicData, ...listingLocation } = getLocationValues(values);
      const publicData = {
        ...detailsPublicData,
        ...locationPublicData,
      };
      const parsedValues = {
        ...listingDetails,
        ...listingLocation,
        publicData,
        id: listingId?.uuid,
      };
      await onUpdateListing(parsedValues, config);
      setUpdated(true);
    } catch (e) {
      // No need for extra actions
    }
  };

  const submitButtonText = intl.formatMessage({ id: 'StripePayoutPage.submitButtonText' });

  return (
    <FinalForm
      initialValues={initialValues}
      onSubmit={onSubmit}
      pickSelectedCategories={values =>
        pickCategoryFields(values, categoryKey, 1, listingCategories)
      }
      updateInProgress={updateInProgress}
      fetchErrors={errors}
      listingFieldsConfig={listingFields}
      mutators={{ ...arrayMutators }}
      render={formRenderProps => {
        const {
          handleSubmit,
          invalid,
          pristine,
          pickSelectedCategories,
          updateInProgress,
          fetchErrors,
          listingFieldsConfig,
          values,
        } = formRenderProps;
        const formId = 'CreativeDetailsForm';
        const submitReady = updated && pristine;
        const submitDisabled = invalid || updateInProgress;
        return (
          <div className={css.root}>
            <Form onSubmit={handleSubmit}>
              <ErrorMessage fetchErrors={fetchErrors} />
              <EditDetailsForm
                formId={formId}
                pickSelectedCategories={pickSelectedCategories}
                listingFieldsConfig={listingFieldsConfig}
                values={values}
              />
              <EditLocationForm values={values} />
              <Button
                className={css.submitButton}
                type="submit"
                inProgress={updateInProgress}
                disabled={submitDisabled}
                ready={submitReady}
              >
                {submitButtonText}
              </Button>
            </Form>
          </div>
        );
      }}
    />
  );
};

CreativeDetailsForm.propTypes = {
  listingId: propTypes.uuid,
  // We cannot use propTypes.listing since the listing might be a draft.
  listing: shape({
    attributes: shape({
      publicData: object,
      description: string,
      geolocation: object,
      price: object,
      title: string,
    }),
  }),
  errors: shape({
    updateListingError: object,
    publishListingError: object,
    showListingsError: object,
    uploadImageError: object,
  }).isRequired,

  updateInProgress: bool,
  onUpdateListing: func,
};

export default CreativeDetailsForm;
