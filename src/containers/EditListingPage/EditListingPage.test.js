import React from 'react';
import '@testing-library/jest-dom';

import { fakeIntl } from '../../util/testData';
import { renderWithProviders as render, testingLibrary } from '../../util/testHelpers';

import { EditListingPageComponent } from './EditListingPage';

const { screen, userEvent } = testingLibrary;

const noop = () => null;

describe('EditListingPageComponent', () => {
  test('Check that there is correct wizard tabs', () => {
    render(
      <EditListingPageComponent
        params={{ id: 'id', slug: 'slug', type: 'new', tab: 'details' }}
        currentUserHasListings={false}
        isAuthenticated={false}
        authInProgress={false}
        fetchInProgress={false}
        location={{ search: '' }}
        history={{ push: noop, replace: noop }}
        getAccountLinkInProgress={false}
        getOwnListing={noop}
        images={[]}
        intl={fakeIntl}
        onGetStripeConnectAccountLink={noop}
        onLogout={noop}
        onManageDisableScrolling={noop}
        onFetchExceptions={noop}
        onAddAvailabilityException={noop}
        onDeleteAvailabilityException={noop}
        onCreateListing={noop}
        onCreateListingDraft={noop}
        onPublishListingDraft={noop}
        onUpdateListing={noop}
        onImageUpload={noop}
        onRemoveListingImage={noop}
        onPayoutDetailsChange={noop}
        onPayoutDetailsSubmit={noop}
        page={{
          uploadedImagesOrder: [],
          images: {},
          monthlyExceptionQueries: {},
          allExceptions: [],
          payoutDetailsSaved: false,
          payoutDetailsSaveInProgress: false,
        }}
        scrollingDisabled={false}
        sendVerificationEmailInProgress={false}
        onResendVerificationEmail={noop}
      />
    );

    const tabLabelDetails = 'EditListingWizard.tabLabelDetails';
    expect(screen.getByText(tabLabelDetails)).toBeInTheDocument();

    const tabLabelLocation = 'EditListingWizard.tabLabelLocation';
    expect(screen.getByText(tabLabelLocation)).toBeInTheDocument();

    const tabLabelPricing = 'EditListingWizard.tabLabelPricing';
    expect(screen.getByText(tabLabelPricing)).toBeInTheDocument();

    const tabLabelAvailability = 'EditListingWizard.tabLabelAvailability';
    expect(screen.getByText(tabLabelAvailability)).toBeInTheDocument();

    const tabLabelPhotos = 'EditListingWizard.tabLabelPhotos';
    expect(screen.getByText(tabLabelPhotos)).toBeInTheDocument();

    userEvent.selectOptions(
      screen.getByLabelText('EditListingDetailsForm.listingTypeLabel'),
      'product-selling'
    );

    // Tabs removed
    expect(screen.queryByText(tabLabelLocation)).not.toBeInTheDocument();
    expect(screen.queryByText(tabLabelPricing)).not.toBeInTheDocument();
    expect(screen.queryByText(tabLabelAvailability)).not.toBeInTheDocument();

    // Tabs added
    const tabLabelPricingAndStock = 'EditListingWizard.tabLabelPricingAndStock';
    expect(screen.getByText(tabLabelPricingAndStock)).toBeInTheDocument();
    const tabLabelDelivery = 'EditListingWizard.tabLabelDelivery';
    expect(screen.getByText(tabLabelDelivery)).toBeInTheDocument();
    expect(screen.getByText(tabLabelPhotos)).toBeInTheDocument();
  });
});
