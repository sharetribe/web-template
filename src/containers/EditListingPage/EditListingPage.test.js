import React from 'react';
import '@testing-library/jest-dom';
import 'react-dates/initialize';

import { types as sdkTypes } from '../../util/sdkLoader';
import { LISTING_PAGE_PARAM_TYPE_EDIT } from '../../util/urlHelpers';
import { createCurrentUser, createStock, createOwnListing, fakeIntl } from '../../util/testData';
import {
  renderWithProviders as render,
  testingLibrary,
  getRouteConfiguration,
  getHostedConfiguration,
} from '../../util/testHelpers';

import EditListingPage, { EditListingPageComponent } from './EditListingPage';
import {
  AVAILABILITY,
  DELIVERY,
  DETAILS,
  LOCATION,
  PHOTOS,
  PRICING,
  PRICING_AND_STOCK,
} from './EditListingWizard/EditListingWizardTab';

const { screen, userEvent, waitFor, within } = testingLibrary;

const { Money } = sdkTypes;
const noop = () => null;

const listingTypesBookingDay = [
  {
    id: 'rent-bicycles-daily',
    transactionProcess: {
      name: 'default-booking',
      alias: 'default-booking/release-1',
    },
    unitType: 'day',
  },
];
const listingTypesBookingNightly = [
  {
    id: 'rent-bicycles-nightly',
    transactionProcess: {
      name: 'default-booking',
      alias: 'default-booking/release-1',
    },
    unitType: 'night',
  },
];
const listingTypesBookingHourly = [
  {
    id: 'rent-bicycles-hourly',
    transactionProcess: {
      name: 'default-booking',
      alias: 'default-booking/release-1',
    },
    unitType: 'hour',
  },
];
const listingTypesPurchase = [
  {
    id: 'sell-bicycles',
    transactionProcess: {
      name: 'default-purchase',
      alias: 'default-purchase/release-1',
    },
    unitType: 'item',
  },
];

const listingTypesInquiry = [
  {
    id: 'inquiry',
    label: 'Inquiry',
    transactionProcess: {
      name: 'default-inquiry',
      alias: 'default-inquiry/release-1',
    },
    unitType: 'inquiry',
    defaultListingFields: {
      price: false,
    },
  },
];

const listingFieldsInquiry = [
  {
    key: 'category',
    scope: 'public',
    includeForListingTypes: ['inquiry'],
    schemaType: 'enum',
    enumOptions: [{ option: 'cat_1', label: 'Cat 1' }, { option: 'cat_2', label: 'Cat 2' }],
    filterConfig: {
      indexForSearch: true,
      label: 'Category',
      group: 'primary',
    },
    showConfig: {
      label: 'Category',
    },
    saveConfig: {
      label: 'Category',
    },
  },
];

const listingFieldsPurchase = [
  {
    key: 'category',
    scope: 'public',
    includeForListingTypes: ['sell-bicycles'],
    schemaType: 'enum',
    enumOptions: [{ option: 'cat_1', label: 'Cat 1' }, { option: 'cat_2', label: 'Cat 2' }],
    filterConfig: {
      indexForSearch: true,
      label: 'Category',
      group: 'primary',
    },
    showConfig: {
      label: 'Category',
    },
    saveConfig: {
      label: 'Category',
    },
  },
];

const listingFieldsBooking = [
  {
    key: 'amenities',
    scope: 'public',
    includeForListingTypes: [
      'rent-bicycles-daily',
      'rent-bicycles-nightly',
      'rent-bicycles-hourly',
    ],
    schemaType: 'multi-enum',
    enumOptions: [{ option: 'dog_1', label: 'Dog 1' }, { option: 'dog_2', label: 'Dog 2' }],
    filterConfig: {
      indexForSearch: true,
      label: 'Amenities',
      //searchMode: 'has_all',
      group: 'secondary',
    },
    showConfig: {
      label: 'Amenities',
    },
    saveConfig: {
      label: 'Amenities',
    },
  },
];

const getConfig = (listingTypes, listingFields) => {
  const hostedConfig = getHostedConfiguration();
  return {
    ...hostedConfig,
    listingFields: {
      listingFields,
    },
    listingTypes: {
      listingTypes,
    },
  };
};

describe('EditListingPage', () => {
  const originalWarn = console.warn.bind(console.warn);
  beforeEach(() => {
    // This is not defined by default on test env. Availability panel needs it.
    window.scrollTo = jest.fn();
    console.warn = msg =>
      !(
        msg.toString().includes('componentWillReceiveProps') ||
        msg.toString().includes('componentWillUpdate')
      ) && originalWarn(msg);
  });

  afterAll(() => {
    console.warn = originalWarn;
    // Remove window.scrollTo
    jest.clearAllMocks();
  });

  // We'll initialize the store with relevant listing data
  const today = new Date();
  const pad = num => {
    return num >= 0 && num < 10 ? `0${num}` : `${num}`;
  };

  const initialState = listing => ({
    EditListingPage: {
      createListingDraftError: null,
      listingId: listing.id,
      submittedListingId: null,
      redirectToListing: false,
      uploadedImages: {},
      uploadedImagesOrder: [],
      removedImageIds: [],
      weeklyExceptionQueries: {
        // '2022-12-12': { // Note: id/key is the start of the week in given time zone
        //   fetchExceptionsError: null,
        //   fetchExceptionsInProgress: null,
        // },
      },
      monthlyExceptionQueries: {
        [`${today.getUTCFullYear()}-${pad(today.getUTCMonth() + 1)}`]: {
          fetchExceptionsError: null,
          fetchExceptionsInProgress: null,
        },
        [`${today.getUTCFullYear()}-${pad(today.getUTCMonth() + 2)}`]: {
          fetchExceptionsError: null,
          fetchExceptionsInProgress: null,
        },
      },
      allExceptions: [],
      listingDraft: null,
      updatedTab: null,
      updateInProgress: false,
      payoutDetailsSaveInProgress: false,
      payoutDetailsSaved: false,
    },
    marketplaceData: {
      entities: {
        ownListing: {
          [listing.id.uuid]: listing,
        },
      },
    },
  });

  const commonProps = {
    // We add currentUser through props, because we don't want to test TopbarContainer here
    currentUser: createCurrentUser('id-of-me-myself'),
  };

  it('Purchase: edit flow on details tab', async () => {
    const config = getConfig(listingTypesPurchase, listingFieldsPurchase);
    const routeConfiguration = getRouteConfiguration(config.layout);
    const listing = createOwnListing('listing-item', {
      title: 'the listing',
      description: 'Lorem ipsum',
      publicData: {
        listingType: 'sell-bicycles',
        transactionProcessAlias: 'default-purchase/release-1',
        unitType: 'item',
      },
    });

    const props = {
      ...commonProps,
      params: {
        id: listing.id.uuid,
        slug: 'slug',
        type: LISTING_PAGE_PARAM_TYPE_EDIT,
        tab: DETAILS,
      },
    };

    const { getByText, getByRole, getByLabelText } = render(<EditListingPage {...props} />, {
      initialState: initialState(listing),
      config,
      routeConfiguration,
    });

    await waitFor(() => {
      // Navigation to tab
      const tabLabel = 'EditListingWizard.tabLabelDetails';
      expect(getByText(tabLabel)).toBeInTheDocument();

      // Tab: panel title
      expect(getByText('EditListingDetailsPanel.title')).toBeInTheDocument();

      // Tab/form: form title
      expect(getByRole('textbox', { name: 'EditListingDetailsForm.title' })).toHaveValue(
        'the listing'
      );

      // Tab/form: description
      expect(getByRole('textbox', { name: 'EditListingDetailsForm.description' })).toHaveValue(
        'Lorem ipsum'
      );

      // Tab/form: listing field
      expect(getByLabelText('Category')).toBeInTheDocument();
      expect(
        getByRole('option', { name: 'CustomExtendedDataField.placeholderSingleSelect' }).selected
      ).toBe(true);
      expect(getByRole('option', { name: 'Cat 1' }).selected).toBe(false);

      expect(
        getByRole('button', { name: 'EditListingWizard.edit.saveDetails' })
      ).toBeInTheDocument();
    });

    // Test intercation
    await waitFor(() => {
      userEvent.selectOptions(
        screen.getByRole('combobox'),
        screen.getByRole('option', { name: 'Cat 1' })
      );
    });
    expect(
      getByRole('option', { name: 'CustomExtendedDataField.placeholderSingleSelect' }).selected
    ).toBe(false);
    expect(getByRole('option', { name: 'Cat 1' }).selected).toBe(true);
  });

  it('Purchase: edit flow on pricing-and-stock tab', async () => {
    const config = getConfig(listingTypesPurchase, listingFieldsPurchase);
    const routeConfiguration = getRouteConfiguration(config.layout);
    const listing = createOwnListing(
      'listing-item',
      {
        title: 'the listing',
        description: 'Lorem ipsum',
        price: new Money(5500, 'USD'),
        publicData: {
          listingType: 'sell-bicycles',
          transactionProcessAlias: 'default-purchase/release-1',
          unitType: 'item',
          category: 'cat_1',
        },
      },
      {
        currentStock: createStock('stock-id', { quantity: 5 }),
      }
    );

    const props = {
      ...commonProps,
      params: {
        id: listing.id.uuid,
        slug: 'slug',
        type: LISTING_PAGE_PARAM_TYPE_EDIT,
        tab: PRICING_AND_STOCK,
      },
    };

    const { getByText, getByRole } = render(<EditListingPage {...props} />, {
      initialState: initialState(listing),
      config,
      routeConfiguration,
    });

    await waitFor(() => {
      // Navigation to tab
      const tabLabel = 'EditListingWizard.tabLabelPricingAndStock';
      expect(getByText(tabLabel)).toBeInTheDocument();

      // Tab: panel title
      expect(getByText('EditListingPricingAndStockPanel.title')).toBeInTheDocument();

      // Tab/form: price
      expect(
        getByRole('textbox', { name: 'EditListingPricingAndStockForm.pricePerProduct' })
      ).toHaveValue('$55.00');

      // Tab/form: stock
      expect(
        getByRole('spinbutton', { name: 'EditListingPricingAndStockForm.stockLabel' })
      ).toHaveValue(5);

      expect(
        getByRole('button', { name: 'EditListingWizard.edit.savePricingAndStock' })
      ).toBeInTheDocument();
    });

    // Test intercation
    await waitFor(() => {
      userEvent.clear(screen.getByRole('spinbutton'));
      userEvent.type(screen.getByRole('spinbutton'), '10');
    });
    expect(screen.getByRole('spinbutton')).toHaveValue(10);
  });

  it('Purchase: edit flow on delivery tab', async () => {
    const config = getConfig(listingTypesPurchase, listingFieldsPurchase);
    const routeConfiguration = getRouteConfiguration(config.layout);
    const listing = createOwnListing(
      'listing-item',
      {
        title: 'the listing',
        description: 'Lorem ipsum',
        price: new Money(5500, 'USD'),
        publicData: {
          listingType: 'sell-bicycles',
          transactionProcessAlias: 'default-purchase/release-1',
          unitType: 'item',
          category: 'cat_1',
        },
      },
      {
        currentStock: createStock('stock-id', { quantity: 5 }),
      }
    );

    const props = {
      ...commonProps,
      params: {
        id: listing.id.uuid,
        slug: 'slug',
        type: LISTING_PAGE_PARAM_TYPE_EDIT,
        tab: DELIVERY,
      },
    };

    const { getByText, getByRole, queryByPlaceholderText } = render(
      <EditListingPage {...props} />,
      {
        initialState: initialState(listing),
        config,
        routeConfiguration,
      }
    );

    await waitFor(() => {
      // Navigation to tab
      const tabLabel = 'EditListingWizard.tabLabelDelivery';
      expect(getByText(tabLabel)).toBeInTheDocument();

      // Tab: panel title
      expect(getByText('EditListingDeliveryPanel.title')).toBeInTheDocument();

      expect(getByText('EditListingDeliveryForm.shippingLabel')).toBeInTheDocument();

      // Tab/form: pickup
      expect(
        getByRole('checkbox', { name: /EditListingDeliveryForm.pickupLabel/i })
      ).not.toBeChecked();
      expect(queryByPlaceholderText('EditListingDeliveryForm.addressPlaceholder')).toBeDisabled();
      expect(getByRole('textbox', { name: 'EditListingDeliveryForm.building' })).toBeDisabled();

      // Tab/form: shipping
      expect(
        getByRole('checkbox', { name: /EditListingDeliveryForm.shippingLabel/i })
      ).not.toBeChecked();
      expect(
        getByRole('textbox', { name: 'EditListingDeliveryForm.shippingOneItemLabel' })
      ).toBeDisabled();
      expect(
        getByRole('textbox', { name: 'EditListingDeliveryForm.shippingAdditionalItemsLabel' })
      ).toBeDisabled();

      expect(
        getByRole('button', { name: 'EditListingWizard.edit.saveDelivery' })
      ).toBeInTheDocument();
    });

    // Test intercation
    await waitFor(() => {
      userEvent.click(getByRole('checkbox', { name: /EditListingDeliveryForm.shippingLabel/i }));
    });
    expect(getByRole('checkbox', { name: /EditListingDeliveryForm.shippingLabel/i })).toBeChecked();
    expect(
      getByRole('textbox', { name: 'EditListingDeliveryForm.shippingOneItemLabel' })
    ).toBeEnabled();
    expect(
      getByRole('textbox', { name: 'EditListingDeliveryForm.shippingAdditionalItemsLabel' })
    ).toBeEnabled();
  });

  it('Purchase: edit flow on photos tab', async () => {
    const config = getConfig(listingTypesPurchase, listingFieldsPurchase);
    const routeConfiguration = getRouteConfiguration(config.layout);
    const listing = createOwnListing(
      'listing-item',
      {
        title: 'the listing',
        description: 'Lorem ipsum',
        price: new Money(5500, 'USD'),
        publicData: {
          listingType: 'sell-bicycles',
          transactionProcessAlias: 'default-purchase/release-1',
          unitType: 'item',
          category: 'cat_1',
          shippingPriceInSubunitsOneItem: 1000,
          shippingPriceInSubunitsAdditionalItems: 500,
        },
      },
      {
        currentStock: createStock('stock-id', { quantity: 5 }),
      }
    );

    const props = {
      ...commonProps,
      params: {
        id: listing.id.uuid,
        slug: 'slug',
        type: LISTING_PAGE_PARAM_TYPE_EDIT,
        tab: PHOTOS,
      },
    };

    const { getByText } = render(<EditListingPage {...props} />, {
      initialState: initialState(listing),
      config,
      routeConfiguration,
    });

    await waitFor(() => {
      // Navigation to tab
      const tabLabel = 'EditListingWizard.tabLabelPhotos';
      expect(getByText(tabLabel)).toBeInTheDocument();

      // Tab: panel title
      expect(getByText('EditListingPhotosPanel.title')).toBeInTheDocument();

      expect(getByText('EditListingPhotosForm.chooseImage')).toBeInTheDocument();
      expect(getByText('EditListingPhotosForm.imageTypes')).toBeInTheDocument();
      expect(getByText('EditListingPhotosForm.addImagesTip')).toBeInTheDocument();
      expect(getByText('EditListingWizard.edit.savePhotos')).toBeInTheDocument();
    });
  });

  it('Booking (day): edit flow on details tab', async () => {
    const config = getConfig(listingTypesBookingDay, listingFieldsBooking);
    const routeConfiguration = getRouteConfiguration(config.layout);
    const listing = createOwnListing('listing-day', {
      title: 'the listing',
      description: 'Lorem ipsum',
      publicData: {
        listingType: 'rent-bicycles-daily',
        transactionProcessAlias: 'default-booking/release-1',
        unitType: 'day',
      },
    });

    const props = {
      ...commonProps,
      params: {
        id: listing.id.uuid,
        slug: 'slug',
        type: LISTING_PAGE_PARAM_TYPE_EDIT,
        tab: DETAILS,
      },
    };

    const { getByText, getByRole, getByLabelText } = render(<EditListingPage {...props} />, {
      initialState: initialState(listing),
      config,
      routeConfiguration,
    });

    await waitFor(() => {
      // Navigation to tab
      const tabLabel = 'EditListingWizard.tabLabelDetails';
      expect(getByText(tabLabel)).toBeInTheDocument();

      // Tab: panel title
      expect(getByText('EditListingDetailsPanel.title')).toBeInTheDocument();

      // Tab/form: form title
      expect(getByRole('textbox', { name: 'EditListingDetailsForm.title' })).toHaveValue(
        'the listing'
      );

      // Tab/form: description
      expect(getByRole('textbox', { name: 'EditListingDetailsForm.description' })).toHaveValue(
        'Lorem ipsum'
      );

      // Tab/form: listing field
      expect(getByText('Amenities')).toBeInTheDocument();
      expect(getByRole('checkbox', { name: /Dog 1/i })).not.toBeChecked();
      expect(getByRole('checkbox', { name: /Dog 2/i })).not.toBeChecked();

      expect(
        getByRole('button', { name: 'EditListingWizard.edit.saveDetails' })
      ).toBeInTheDocument();
    });

    // Test intercation
    await waitFor(() => {
      userEvent.click(getByRole('checkbox', { name: /Dog 1/i }));
    });
    expect(getByRole('checkbox', { name: /Dog 1/i })).toBeChecked();
    expect(getByRole('checkbox', { name: /Dog 2/i })).not.toBeChecked();
  });

  it('Booking (day): edit flow on location tab', async () => {
    const config = getConfig(listingTypesBookingDay, listingFieldsBooking);
    const routeConfiguration = getRouteConfiguration(config.layout);
    const listing = createOwnListing('listing-day', {
      title: 'the listing',
      description: 'Lorem ipsum',
      publicData: {
        listingType: 'rent-bicycles-daily',
        transactionProcessAlias: 'default-booking/release-1',
        unitType: 'day',
        amenities: ['dog_1'],
        location: {
          address: 'Main Street 123',
          building: 'A 1',
        },
      },
    });

    const props = {
      ...commonProps,
      params: {
        id: listing.id.uuid,
        slug: 'slug',
        type: LISTING_PAGE_PARAM_TYPE_EDIT,
        tab: LOCATION,
      },
    };

    const { getByText, getByRole, getByLabelText, getByPlaceholderText } = render(
      <EditListingPage {...props} />,
      {
        initialState: initialState(listing),
        config,
        routeConfiguration,
      }
    );

    await waitFor(() => {
      // Navigation to tab
      const tabLabel = 'EditListingWizard.tabLabelLocation';
      expect(getByText(tabLabel)).toBeInTheDocument();

      // Tab: panel title
      expect(getByText('EditListingLocationPanel.title')).toBeInTheDocument();

      // Tab/form: existing address
      expect(getByPlaceholderText('EditListingLocationForm.addressPlaceholder')).toHaveValue(
        'Main Street 123'
      );

      // Tab/form: existing building
      expect(getByLabelText('EditListingLocationForm.building')).toHaveValue('A 1');

      expect(
        getByRole('button', { name: 'EditListingWizard.edit.saveLocation' })
      ).toBeInTheDocument();
    });

    // Test intercation
    await waitFor(async () => {
      await userEvent.clear(getByLabelText('EditListingLocationForm.building'));
      userEvent.type(getByLabelText('EditListingLocationForm.building'), 'B 2');
    });

    // Tab/form: existing building
    expect(getByLabelText('EditListingLocationForm.building')).toHaveValue('B 2');
  });

  it('Booking (day): edit flow on pricing tab', async () => {
    const config = getConfig(listingTypesBookingDay, listingFieldsBooking);
    const routeConfiguration = getRouteConfiguration(config.layout);
    const listing = createOwnListing('listing-day', {
      title: 'the listing',
      description: 'Lorem ipsum',
      price: new Money(1000, 'USD'),
      publicData: {
        listingType: 'rent-bicycles-daily',
        transactionProcessAlias: 'default-booking/release-1',
        unitType: 'day',
        amenities: ['dog_1'],
        location: {
          address: 'Main Street 123',
          building: 'A 1',
        },
      },
    });

    const props = {
      ...commonProps,
      params: {
        id: listing.id.uuid,
        slug: 'slug',
        type: LISTING_PAGE_PARAM_TYPE_EDIT,
        tab: PRICING,
      },
    };

    const { getByText, getByRole, getByLabelText, queryAllByRole } = render(
      <EditListingPage {...props} />,
      {
        initialState: initialState(listing),
        config,
        routeConfiguration,
      }
    );

    await waitFor(() => {
      // Navigation to tab
      const tabLabel = 'EditListingWizard.tabLabelPricing';
      expect(getByText(tabLabel)).toBeInTheDocument();

      // Tab: panel title
      expect(getByText('EditListingPricingPanel.title')).toBeInTheDocument();

      // Tab/form: price
      expect(getByRole('textbox', { name: 'EditListingPricingForm.pricePerProduct' })).toHaveValue(
        '$10.00'
      );

      expect(
        getByRole('button', { name: 'EditListingWizard.edit.savePricing' })
      ).toBeInTheDocument();
    });

    // Test intercation
    await waitFor(async () => {
      await userEvent.clear(
        getByRole('textbox', { name: 'EditListingPricingForm.pricePerProduct' })
      );
      userEvent.type(
        getByRole('textbox', { name: 'EditListingPricingForm.pricePerProduct' }),
        '12'
      );
      userEvent.click(queryAllByRole('heading')[0]); // create blur event
    });

    // Tab/form: existing building
    expect(getByLabelText('EditListingPricingForm.pricePerProduct')).toHaveValue('$12.00');
  });

  it('Booking (day): edit flow on availability tab', async () => {
    const config = getConfig(listingTypesBookingDay, listingFieldsBooking);
    const routeConfiguration = getRouteConfiguration(config.layout);
    const listing = createOwnListing('listing-day', {
      title: 'the listing',
      description: 'Lorem ipsum',
      price: new Money(1000, 'USD'),
      availabilityPlan: {
        type: 'availability-plan/time',
        timezone: 'Etc/UTC',
        entries: [
          { dayOfWeek: 'mon', startTime: '00:00', endTime: '00:00', seats: 1 },
          { dayOfWeek: 'tue', startTime: '00:00', endTime: '00:00', seats: 1 },
          { dayOfWeek: 'wed', startTime: '00:00', endTime: '00:00', seats: 1 },
          { dayOfWeek: 'thu', startTime: '00:00', endTime: '00:00', seats: 1 },
          { dayOfWeek: 'fri', startTime: '00:00', endTime: '00:00', seats: 1 },
          { dayOfWeek: 'sat', startTime: '00:00', endTime: '00:00', seats: 1 },
          { dayOfWeek: 'sun', startTime: '00:00', endTime: '00:00', seats: 0 },
        ],
      },

      publicData: {
        listingType: 'rent-bicycles-daily',
        transactionProcessAlias: 'default-booking/release-1',
        unitType: 'day',
        amenities: ['dog_1'],
        location: {
          address: 'Main Street 123',
          building: 'A 1',
        },
      },
    });

    const props = {
      ...commonProps,
      params: {
        id: listing.id.uuid,
        slug: 'slug',
        type: LISTING_PAGE_PARAM_TYPE_EDIT,
        tab: AVAILABILITY,
      },
    };

    const { getByText, getByRole, queryAllByText } = render(<EditListingPage {...props} />, {
      initialState: initialState(listing),
      config,
      routeConfiguration,
      withPortals: false,
    });

    await waitFor(() => {
      // Navigation to tab
      const tabLabel = 'EditListingWizard.tabLabelAvailability';
      expect(getByText(tabLabel)).toBeInTheDocument();

      // Tab: panel title
      expect(getByText('EditListingAvailabilityPanel.title')).toBeInTheDocument();

      // Tab/form: edit availability
      expect(
        getByRole('button', { name: /EditListingAvailabilityPanel.editAvailabilityPlan/i })
      ).toBeInTheDocument();

      expect(
        getByRole('heading', { name: /EditListingAvailabilityPanel.WeeklyCalendar.scheduleTitle/i })
      ).toBeInTheDocument();

      // Expect mon - sat to be available (6 days) and sunday to be blocked.
      expect(queryAllByText('EditListingAvailabilityPanel.WeeklyCalendar.available')).toHaveLength(
        6
      );
      const sunday = getByText('Sunday');
      const cell = sunday.parentNode.parentNode;
      const siblingContent = within(cell.nextElementSibling); // next cell in the grid
      expect(
        siblingContent.queryAllByText('EditListingAvailabilityPanel.WeeklyCalendar.notAvailable')
      ).toHaveLength(1);

      // button to add an exception
      expect(
        getByRole('button', { name: 'EditListingAvailabilityPanel.addException' })
      ).toBeInTheDocument();
    });
  });

  it('Booking (day): edit flow on availability tab (plan modal)', async () => {
    const config = getConfig(listingTypesBookingDay, listingFieldsBooking);
    const routeConfiguration = getRouteConfiguration(config.layout);
    const listing = createOwnListing('listing-day', {
      title: 'the listing',
      description: 'Lorem ipsum',
      price: new Money(1000, 'USD'),
      availabilityPlan: {
        type: 'availability-plan/time',
        timezone: 'Etc/UTC',
        entries: [
          { dayOfWeek: 'mon', startTime: '00:00', endTime: '00:00', seats: 1 },
          { dayOfWeek: 'tue', startTime: '00:00', endTime: '00:00', seats: 1 },
          { dayOfWeek: 'wed', startTime: '00:00', endTime: '00:00', seats: 1 },
          { dayOfWeek: 'thu', startTime: '00:00', endTime: '00:00', seats: 1 },
          { dayOfWeek: 'fri', startTime: '00:00', endTime: '00:00', seats: 1 },
          { dayOfWeek: 'sat', startTime: '00:00', endTime: '00:00', seats: 1 },
          { dayOfWeek: 'sun', startTime: '00:00', endTime: '00:00', seats: 0 },
        ],
      },

      publicData: {
        listingType: 'rent-bicycles-daily',
        transactionProcessAlias: 'default-booking/release-1',
        unitType: 'day',
        amenities: ['dog_1'],
        location: {
          address: 'Main Street 123',
          building: 'A 1',
        },
      },
    });

    const props = {
      ...commonProps,
      params: {
        id: listing.id.uuid,
        slug: 'slug',
        type: LISTING_PAGE_PARAM_TYPE_EDIT,
        tab: AVAILABILITY,
      },
    };

    const { getByText, getByRole, queryAllByText } = render(<EditListingPage {...props} />, {
      initialState: initialState(listing),
      config,
      routeConfiguration,
      withPortals: true,
    });

    // Test intercation: open plan modal
    await waitFor(async () => {
      userEvent.click(
        getByRole('button', { name: /EditListingAvailabilityPanel.editAvailabilityPlan/i })
      );
    });

    expect(getByText('EditListingAvailabilityPlanForm.title')).toBeInTheDocument();
    // time zone picker
    expect(getByText('EditListingAvailabilityPlanForm.timezonePickerTitle')).toBeInTheDocument();
    expect(getByRole('option', { name: 'Europe/Helsinki' })).toBeInTheDocument();
    // plan scheduler
    expect(getByText('EditListingAvailabilityPlanForm.hoursOfOperationTitle')).toBeInTheDocument();
    const monday = getByRole('checkbox', {
      name: /EditListingAvailabilityPlanForm.dayOfWeek.mon/i,
    });
    expect(monday).toBeChecked();

    // save button for the plan
    expect(
      getByRole('button', { name: 'EditListingAvailabilityPlanForm.saveSchedule' })
    ).toBeInTheDocument();

    // Test intercation: plan modal form
    await waitFor(async () => {
      await userEvent.click(
        getByRole('checkbox', { name: /EditListingAvailabilityPlanForm.dayOfWeek.mon/i })
      );
    });
    expect(
      getByRole('checkbox', { name: /EditListingAvailabilityPlanForm.dayOfWeek.mon/i })
    ).not.toBeChecked();

    // Test intercation: close plan modal
    await waitFor(async () => {
      await userEvent.click(getByRole('button', { name: /Modal.close/i }));
    });

    expect(queryAllByText('EditListingAvailabilityPlanForm.title')).toHaveLength(0);
  }, 10000);

  it('Booking (day): edit flow on availability tab (exception modal)', async () => {
    const config = getConfig(listingTypesBookingDay, listingFieldsBooking);
    const routeConfiguration = getRouteConfiguration(config.layout);
    const listing = createOwnListing('listing-day', {
      title: 'the listing',
      description: 'Lorem ipsum',
      price: new Money(1000, 'USD'),
      availabilityPlan: {
        type: 'availability-plan/time',
        timezone: 'Etc/UTC',
        entries: [
          { dayOfWeek: 'mon', startTime: '00:00', endTime: '00:00', seats: 1 },
          { dayOfWeek: 'tue', startTime: '00:00', endTime: '00:00', seats: 1 },
          { dayOfWeek: 'wed', startTime: '00:00', endTime: '00:00', seats: 1 },
          { dayOfWeek: 'thu', startTime: '00:00', endTime: '00:00', seats: 1 },
          { dayOfWeek: 'fri', startTime: '00:00', endTime: '00:00', seats: 1 },
          { dayOfWeek: 'sat', startTime: '00:00', endTime: '00:00', seats: 1 },
          { dayOfWeek: 'sun', startTime: '00:00', endTime: '00:00', seats: 0 },
        ],
      },

      publicData: {
        listingType: 'rent-bicycles-daily',
        transactionProcessAlias: 'default-booking/release-1',
        unitType: 'day',
        amenities: ['dog_1'],
        location: {
          address: 'Main Street 123',
          building: 'A 1',
        },
      },
    });

    const props = {
      ...commonProps,
      params: {
        id: listing.id.uuid,
        slug: 'slug',
        type: LISTING_PAGE_PARAM_TYPE_EDIT,
        tab: AVAILABILITY,
      },
    };

    const { getByText, getByRole, queryAllByText } = render(<EditListingPage {...props} />, {
      initialState: initialState(listing),
      config,
      routeConfiguration,
      withPortals: true,
    });

    // Test intercation: open availability exception modal
    await waitFor(async () => {
      await userEvent.click(
        getByRole('button', { name: /EditListingAvailabilityPanel.addException/i })
      );
    });
    expect(getByText('EditListingAvailabilityExceptionForm.title')).toBeInTheDocument();
    // mode: available, not-available
    expect(getByText('EditListingAvailabilityExceptionForm.available')).toBeInTheDocument();
    expect(getByText('EditListingAvailabilityExceptionForm.notAvailable')).toBeInTheDocument();
    // date range picker
    expect(
      getByText('EditListingAvailabilityExceptionForm.exceptionStartDateLabel')
    ).toBeInTheDocument();
    expect(
      getByText('EditListingAvailabilityExceptionForm.exceptionEndDateLabel')
    ).toBeInTheDocument();
    // submit button
    expect(
      getByRole('button', { name: 'EditListingAvailabilityExceptionForm.addException' })
    ).toBeInTheDocument();
  }, 10000);

  it('Booking (night): edit flow on availability tab', async () => {
    const config = getConfig(listingTypesBookingNightly, listingFieldsBooking);
    const routeConfiguration = getRouteConfiguration(config.layout);
    const listing = createOwnListing('listing-night', {
      title: 'the listing',
      description: 'Lorem ipsum',
      price: new Money(1000, 'USD'),
      availabilityPlan: {
        type: 'availability-plan/time',
        timezone: 'Etc/UTC',
        entries: [
          { dayOfWeek: 'mon', startTime: '00:00', endTime: '00:00', seats: 1 },
          { dayOfWeek: 'tue', startTime: '00:00', endTime: '00:00', seats: 1 },
          { dayOfWeek: 'wed', startTime: '00:00', endTime: '00:00', seats: 1 },
          { dayOfWeek: 'thu', startTime: '00:00', endTime: '00:00', seats: 1 },
          { dayOfWeek: 'fri', startTime: '00:00', endTime: '00:00', seats: 1 },
          { dayOfWeek: 'sat', startTime: '00:00', endTime: '00:00', seats: 1 },
          { dayOfWeek: 'sun', startTime: '00:00', endTime: '00:00', seats: 0 },
        ],
      },

      publicData: {
        listingType: 'rent-bicycles-nightly',
        transactionProcessAlias: 'default-booking/release-1',
        unitType: 'night',
        amenities: ['dog_1'],
        location: {
          address: 'Main Street 123',
          building: 'A 1',
        },
      },
    });

    const props = {
      ...commonProps,
      params: {
        id: listing.id.uuid,
        slug: 'slug',
        type: LISTING_PAGE_PARAM_TYPE_EDIT,
        tab: AVAILABILITY,
      },
    };

    const { getByText, getByRole, queryAllByText } = render(<EditListingPage {...props} />, {
      initialState: initialState(listing),
      config,
      routeConfiguration,
      withPortals: true,
    });

    await waitFor(() => {
      // Navigation to tab
      const tabLabel = 'EditListingWizard.tabLabelAvailability';
      expect(getByText(tabLabel)).toBeInTheDocument();

      // Tab: panel title
      expect(getByText('EditListingAvailabilityPanel.title')).toBeInTheDocument();

      // Tab/form: edit availability
      expect(
        getByRole('button', { name: /EditListingAvailabilityPanel.editAvailabilityPlan/i })
      ).toBeInTheDocument();

      expect(
        getByRole('heading', { name: /EditListingAvailabilityPanel.WeeklyCalendar.scheduleTitle/i })
      ).toBeInTheDocument();

      // Expect mon - sat to be available (6 days) and sunday to be blocked.
      expect(queryAllByText('EditListingAvailabilityPanel.WeeklyCalendar.available')).toHaveLength(
        6
      );
      const sunday = getByText('Sunday');
      const cell = sunday.parentNode.parentNode;
      const siblingContent = within(cell.nextElementSibling); // next cell in the grid
      expect(
        siblingContent.queryAllByText('EditListingAvailabilityPanel.WeeklyCalendar.notAvailable')
      ).toHaveLength(1);

      // button to add an exception
      expect(
        getByRole('button', { name: 'EditListingAvailabilityPanel.addException' })
      ).toBeInTheDocument();
    });

    // Test intercation: open plan modal
    await waitFor(async () => {
      await userEvent.click(
        getByRole('button', { name: /EditListingAvailabilityPanel.editAvailabilityPlan/i })
      );
    });
    expect(getByText('EditListingAvailabilityPlanForm.title')).toBeInTheDocument();
    // time zone picker
    expect(getByText('EditListingAvailabilityPlanForm.timezonePickerTitle')).toBeInTheDocument();
    expect(getByRole('option', { name: 'Europe/Helsinki' })).toBeInTheDocument();
    // plan scheduler
    expect(getByText('EditListingAvailabilityPlanForm.hoursOfOperationTitle')).toBeInTheDocument();
    const monday = getByRole('checkbox', {
      name: /EditListingAvailabilityPlanForm.dayOfWeek.mon/i,
    });
    expect(monday).toBeChecked();

    // save button for the plan
    expect(
      getByRole('button', { name: 'EditListingAvailabilityPlanForm.saveSchedule' })
    ).toBeInTheDocument();

    // Test intercation: plan modal form
    await waitFor(async () => {
      await userEvent.click(
        getByRole('checkbox', { name: /EditListingAvailabilityPlanForm.dayOfWeek.mon/i })
      );
    });
    expect(
      getByRole('checkbox', { name: /EditListingAvailabilityPlanForm.dayOfWeek.mon/i })
    ).not.toBeChecked();

    // Test intercation: close plan modal
    await waitFor(async () => {
      await userEvent.click(getByRole('button', { name: /Modal.close/i }));
    });
    expect(queryAllByText('EditListingAvailabilityPlanForm.title')).toHaveLength(0);

    // Test intercation: open availability exception modal
    await waitFor(async () => {
      await userEvent.click(
        getByRole('button', { name: /EditListingAvailabilityPanel.addException/i })
      );
    });
    expect(getByText('EditListingAvailabilityExceptionForm.title')).toBeInTheDocument();
    // mode: available, not-available
    expect(getByText('EditListingAvailabilityExceptionForm.available')).toBeInTheDocument();
    expect(getByText('EditListingAvailabilityExceptionForm.notAvailable')).toBeInTheDocument();
    // date range picker
    expect(
      getByText('EditListingAvailabilityExceptionForm.exceptionStartDateLabel')
    ).toBeInTheDocument();
    expect(
      getByText('EditListingAvailabilityExceptionForm.exceptionEndDateLabel')
    ).toBeInTheDocument();
    // submit button
    expect(
      getByRole('button', { name: 'EditListingAvailabilityExceptionForm.addException' })
    ).toBeInTheDocument();
  }, 10000);

  it('Booking (hour): edit flow on availability tab', async () => {
    const config = getConfig(listingTypesBookingHourly, listingFieldsBooking);
    const routeConfiguration = getRouteConfiguration(config.layout);
    const listing = createOwnListing('listing-hour', {
      title: 'the listing',
      description: 'Lorem ipsum',
      price: new Money(1000, 'USD'),
      availabilityPlan: {
        type: 'availability-plan/time',
        timezone: 'Etc/UTC',
        entries: [
          { dayOfWeek: 'mon', startTime: '00:00', endTime: '00:00', seats: 1 },
          { dayOfWeek: 'tue', startTime: '00:00', endTime: '00:00', seats: 1 },
          { dayOfWeek: 'wed', startTime: '00:00', endTime: '00:00', seats: 1 },
          { dayOfWeek: 'thu', startTime: '00:00', endTime: '00:00', seats: 1 },
          { dayOfWeek: 'fri', startTime: '00:00', endTime: '00:00', seats: 1 },
          { dayOfWeek: 'sat', startTime: '00:00', endTime: '00:00', seats: 1 },
          //{ dayOfWeek: 'sun', startTime: '00:00', endTime: '00:00', seats: 1 },
        ],
      },

      publicData: {
        listingType: 'rent-bicycles-hourly',
        transactionProcessAlias: 'default-booking/release-1',
        unitType: 'hour',
        amenities: ['dog_1'],
        location: {
          address: 'Main Street 123',
          building: 'A 1',
        },
      },
    });

    const props = {
      ...commonProps,
      params: {
        id: listing.id.uuid,
        slug: 'slug',
        type: LISTING_PAGE_PARAM_TYPE_EDIT,
        tab: AVAILABILITY,
      },
    };

    const { getByText, getByRole, queryAllByText } = render(<EditListingPage {...props} />, {
      initialState: initialState(listing),
      config,
      routeConfiguration,
      withPortals: true,
    });

    await waitFor(() => {
      // Navigation to tab
      const tabLabel = 'EditListingWizard.tabLabelAvailability';
      expect(getByText(tabLabel)).toBeInTheDocument();

      // Tab: panel title
      expect(getByText('EditListingAvailabilityPanel.title')).toBeInTheDocument();

      // Tab/form: edit availability
      expect(
        getByRole('button', { name: /EditListingAvailabilityPanel.editAvailabilityPlan/i })
      ).toBeInTheDocument();

      expect(
        getByRole('heading', { name: /EditListingAvailabilityPanel.WeeklyCalendar.scheduleTitle/i })
      ).toBeInTheDocument();

      // Expect mon - sat to be available (6 days) and sunday to be blocked.
      const monday = getByText('Monday');
      const cellMon = monday.parentNode.parentNode;
      expect(cellMon.nextElementSibling.getElementsByClassName('availabilityDot')).toHaveLength(1);
      expect(cellMon.nextElementSibling.getElementsByClassName('availabilityDot')[0]).toHaveClass(
        'isAvailable'
      );
      const sunday = getByText('Sunday');
      const cellSun = sunday.parentNode.parentNode;
      expect(cellSun.nextElementSibling.getElementsByClassName('availabilityDot')).toHaveLength(0);

      // button to add an exception
      expect(
        getByRole('button', { name: 'EditListingAvailabilityPanel.addException' })
      ).toBeInTheDocument();
    });

    // Test intercation: open plan modal
    await waitFor(async () => {
      await userEvent.click(
        getByRole('button', { name: /EditListingAvailabilityPanel.editAvailabilityPlan/i })
      );
    });
    expect(getByText('EditListingAvailabilityPlanForm.title')).toBeInTheDocument();
    // time zone picker
    expect(getByText('EditListingAvailabilityPlanForm.timezonePickerTitle')).toBeInTheDocument();
    expect(getByRole('option', { name: 'Europe/Helsinki' })).toBeInTheDocument();
    // plan scheduler
    expect(getByText('EditListingAvailabilityPlanForm.hoursOfOperationTitle')).toBeInTheDocument();

    // Monday is checked and it has 00:00 - 00:00
    const monday = getByRole('checkbox', {
      name: /EditListingAvailabilityPlanForm.dayOfWeek.mon/i,
    });
    expect(monday).toBeChecked();
    const cellMon = monday.parentNode.parentNode;
    const monDataContainer = within(cellMon.nextElementSibling);
    const startTimePlaceholderMon = monDataContainer.getByRole('option', {
      name: 'EditListingAvailabilityPlanForm.startTimePlaceholder',
    });
    expect(startTimePlaceholderMon.selected).toBe(false);
    const midnight00 = startTimePlaceholderMon.nextElementSibling;
    expect(midnight00.selected).toBe(true);
    const endTimePlaceholder = monDataContainer.getByRole('option', {
      name: 'EditListingAvailabilityPlanForm.endTimePlaceholder',
    });
    expect(endTimePlaceholder.selected).toBe(false);
    const midnight24 = endTimePlaceholder.parentNode.lastChild;
    expect(midnight24.selected).toBe(true);

    // Sunday is checked and it does not have selectors for start and end
    const sunday = getByRole('checkbox', {
      name: /EditListingAvailabilityPlanForm.dayOfWeek.sun/i,
    });
    expect(sunday).not.toBeChecked();

    // save button for the plan
    expect(
      getByRole('button', { name: 'EditListingAvailabilityPlanForm.saveSchedule' })
    ).toBeInTheDocument();

    // Test intercation: plan modal form
    await waitFor(async () => {
      userEvent.click(
        getByRole('checkbox', { name: /EditListingAvailabilityPlanForm.dayOfWeek.mon/i })
      );
    });
    expect(monday).not.toBeChecked();
    const monDataContainerAfterUncheck = within(monday.parentNode.parentNode.nextElementSibling);
    expect(
      monDataContainerAfterUncheck.queryByRole('option', {
        name: 'EditListingAvailabilityPlanForm.startTimePlaceholder',
      })
    ).not.toBeInTheDocument();

    // Test intercation: close plan modal
    await waitFor(async () => {
      userEvent.click(getByRole('button', { name: /Modal.close/i }));
    });
    expect(queryAllByText('EditListingAvailabilityPlanForm.title')).toHaveLength(0);

    // Test intercation: open availability exception modal
    await waitFor(async () => {
      userEvent.click(getByRole('button', { name: /EditListingAvailabilityPanel.addException/i }));
    });
    expect(getByText('EditListingAvailabilityExceptionForm.title')).toBeInTheDocument();
    // mode: available, not-available
    expect(getByText('EditListingAvailabilityExceptionForm.available')).toBeInTheDocument();
    expect(getByText('EditListingAvailabilityExceptionForm.notAvailable')).toBeInTheDocument();
    // time range pickers
    expect(
      getByText('EditListingAvailabilityExceptionForm.exceptionStartDateLabel')
    ).toBeInTheDocument();
    expect(
      getByText('EditListingAvailabilityExceptionForm.exceptionEndDateLabel')
    ).toBeInTheDocument();

    // TODO Testing react-dates / date pickers needs more work

    // submit button
    expect(
      getByRole('button', { name: 'EditListingAvailabilityExceptionForm.addException' })
    ).toBeInTheDocument();
  }, 10000);

  it('Booking (day): edit flow on photos tab', async () => {
    const config = getConfig(listingTypesBookingDay, listingFieldsBooking);
    const routeConfiguration = getRouteConfiguration(config.layout);
    const listing = createOwnListing('listing-day', {
      title: 'the listing',
      description: 'Lorem ipsum',
      price: new Money(1000, 'USD'),
      availabilityPlan: {
        type: 'availability-plan/time',
        timezone: 'Etc/UTC',
        entries: [
          { dayOfWeek: 'mon', startTime: '00:00', endTime: '00:00', seats: 1 },
          { dayOfWeek: 'tue', startTime: '00:00', endTime: '00:00', seats: 1 },
          { dayOfWeek: 'wed', startTime: '00:00', endTime: '00:00', seats: 1 },
          { dayOfWeek: 'thu', startTime: '00:00', endTime: '00:00', seats: 1 },
          { dayOfWeek: 'fri', startTime: '00:00', endTime: '00:00', seats: 1 },
          { dayOfWeek: 'sat', startTime: '00:00', endTime: '00:00', seats: 1 },
          //{ dayOfWeek: 'sun', startTime: '00:00', endTime: '00:00', seats: 1 },
        ],
      },

      publicData: {
        listingType: 'rent-bicycles-daily',
        transactionProcessAlias: 'default-booking/release-1',
        unitType: 'hour',
        amenities: ['dog_1'],
        location: {
          address: 'Main Street 123',
          building: 'A 1',
        },
      },
    });

    const props = {
      ...commonProps,
      params: {
        id: listing.id.uuid,
        slug: 'slug',
        type: LISTING_PAGE_PARAM_TYPE_EDIT,
        tab: PHOTOS,
      },
    };

    const { getByText } = render(<EditListingPage {...props} />, {
      initialState: initialState(listing),
      config,
      routeConfiguration,
    });

    await waitFor(() => {
      // Navigation to tab
      const tabLabel = 'EditListingWizard.tabLabelPhotos';
      expect(getByText(tabLabel)).toBeInTheDocument();

      // Tab: panel title
      expect(getByText('EditListingPhotosPanel.title')).toBeInTheDocument();

      expect(getByText('EditListingPhotosForm.chooseImage')).toBeInTheDocument();
      expect(getByText('EditListingPhotosForm.imageTypes')).toBeInTheDocument();
      expect(getByText('EditListingPhotosForm.addImagesTip')).toBeInTheDocument();
      expect(getByText('EditListingWizard.edit.savePhotos')).toBeInTheDocument();
    });
  });

  it('Inquiry: edit flow on details tab', async () => {
    const config = getConfig(listingTypesInquiry, listingFieldsInquiry);
    const routeConfiguration = getRouteConfiguration(config.layout);
    const listing = createOwnListing('listing-inquiry', {
      title: 'the listing',
      description: 'Lorem ipsum',
      publicData: {
        listingType: 'inquiry',
        transactionProcessAlias: 'default-inquiry/release-1',
        unitType: 'inquiry',
      },
    });

    const props = {
      ...commonProps,
      params: {
        id: listing.id.uuid,
        slug: 'slug',
        type: LISTING_PAGE_PARAM_TYPE_EDIT,
        tab: DETAILS,
      },
    };

    const { getByText, getByRole, getByLabelText } = render(<EditListingPage {...props} />, {
      initialState: initialState(listing),
      config,
      routeConfiguration,
    });

    await waitFor(() => {
      // Navigation to tab
      const tabLabel = 'EditListingWizard.tabLabelDetails';
      expect(getByText(tabLabel)).toBeInTheDocument();

      // Tab: panel title
      expect(getByText('EditListingDetailsPanel.title')).toBeInTheDocument();

      // Tab/form: form title
      expect(getByRole('textbox', { name: 'EditListingDetailsForm.title' })).toHaveValue(
        'the listing'
      );

      // Tab/form: description
      expect(getByRole('textbox', { name: 'EditListingDetailsForm.description' })).toHaveValue(
        'Lorem ipsum'
      );

      // Tab/form: listing field
      expect(getByLabelText('Category')).toBeInTheDocument();
      expect(
        getByRole('option', { name: 'CustomExtendedDataField.placeholderSingleSelect' }).selected
      ).toBe(true);
      expect(getByRole('option', { name: 'Cat 1' }).selected).toBe(false);

      expect(
        getByRole('button', { name: 'EditListingWizard.edit.saveDetails' })
      ).toBeInTheDocument();
    });

    // Test intercation
    await waitFor(() => {
      userEvent.selectOptions(
        screen.getByRole('combobox'),
        screen.getByRole('option', { name: 'Cat 1' })
      );
    });
    expect(
      getByRole('option', { name: 'CustomExtendedDataField.placeholderSingleSelect' }).selected
    ).toBe(false);
    expect(getByRole('option', { name: 'Cat 1' }).selected).toBe(true);
  });

  it('Inquiry: edit flow on pricing tab (defaultListingFields?.price = false)', async () => {
    const config = getConfig(listingTypesInquiry, listingFieldsInquiry);
    const routeConfiguration = getRouteConfiguration(config.layout);
    const listing = createOwnListing('listing-item', {
      title: 'the listing',
      description: 'Lorem ipsum',
      price: new Money(5500, 'USD'),
      publicData: {
        listingType: 'inquiry',
        transactionProcessAlias: 'default-inquiry/release-1',
        unitType: 'inquiry',
        category: 'cat_1',
      },
    });

    const props = {
      ...commonProps,
      params: {
        id: listing.id.uuid,
        slug: 'slug',
        type: LISTING_PAGE_PARAM_TYPE_EDIT,
        tab: DETAILS,
      },
    };

    const { queryByText } = render(<EditListingPage {...props} />, {
      initialState: initialState(listing),
      config,
      routeConfiguration,
    });

    await waitFor(() => {
      // Navigation to tab
      const tabLabel1 = 'EditListingWizard.tabLabelPricingAndStock';
      expect(queryByText(tabLabel1)).not.toBeInTheDocument();
      const tabLabel2 = 'EditListingWizard.tabLabelPricing';
      expect(queryByText(tabLabel2)).not.toBeInTheDocument();
    });
  });

  it('Inquiry: edit flow on location tab', async () => {
    const config = getConfig(listingTypesInquiry, listingFieldsInquiry);
    const routeConfiguration = getRouteConfiguration(config.layout);
    const listing = createOwnListing('listing-item', {
      title: 'the listing',
      description: 'Lorem ipsum',
      price: new Money(5500, 'USD'),
      publicData: {
        listingType: 'inquiry',
        transactionProcessAlias: 'default-inquiry/release-1',
        unitType: 'inquiry',
        category: 'cat_1',
        location: {
          address: 'Main Street 123',
          building: 'A 1',
        },
      },
    });

    const props = {
      ...commonProps,
      params: {
        id: listing.id.uuid,
        slug: 'slug',
        type: LISTING_PAGE_PARAM_TYPE_EDIT,
        tab: LOCATION,
      },
    };

    const { getByText, getByRole, getByLabelText, getByPlaceholderText } = render(
      <EditListingPage {...props} />,
      {
        initialState: initialState(listing),
        config,
        routeConfiguration,
      }
    );

    await waitFor(() => {
      // Navigation to tab
      const tabLabel = 'EditListingWizard.tabLabelLocation';
      expect(getByText(tabLabel)).toBeInTheDocument();

      // Tab: panel title
      expect(getByText('EditListingLocationPanel.title')).toBeInTheDocument();

      // Tab/form: existing address
      expect(getByPlaceholderText('EditListingLocationForm.addressPlaceholder')).toHaveValue(
        'Main Street 123'
      );

      // Tab/form: existing building
      expect(getByLabelText('EditListingLocationForm.building')).toHaveValue('A 1');

      expect(
        getByRole('button', { name: 'EditListingWizard.edit.saveLocation' })
      ).toBeInTheDocument();
    });

    // Test intercation
    await waitFor(async () => {
      await userEvent.clear(getByLabelText('EditListingLocationForm.building'));
      userEvent.type(getByLabelText('EditListingLocationForm.building'), 'B 2');
    });

    // Tab/form: existing building
    expect(getByLabelText('EditListingLocationForm.building')).toHaveValue('B 2');
  });

  it('Inquiry: edit flow on photos tab', async () => {
    const config = getConfig(listingTypesInquiry, listingFieldsInquiry);
    const routeConfiguration = getRouteConfiguration(config.layout);
    const listing = createOwnListing('listing-item', {
      title: 'the listing',
      description: 'Lorem ipsum',
      price: new Money(5500, 'USD'),
      publicData: {
        listingType: 'inquiry',
        transactionProcessAlias: 'default-inquiry/release-1',
        unitType: 'inquiry',
        category: 'cat_1',
        location: {
          address: 'Main Street 123',
          building: 'A 1',
        },
      },
    });

    const props = {
      ...commonProps,
      params: {
        id: listing.id.uuid,
        slug: 'slug',
        type: LISTING_PAGE_PARAM_TYPE_EDIT,
        tab: PHOTOS,
      },
    };

    const { getByText } = render(<EditListingPage {...props} />, {
      initialState: initialState(listing),
      config,
      routeConfiguration,
    });

    await waitFor(() => {
      // Navigation to tab
      const tabLabel = 'EditListingWizard.tabLabelPhotos';
      expect(getByText(tabLabel)).toBeInTheDocument();

      // Tab: panel title
      expect(getByText('EditListingPhotosPanel.title')).toBeInTheDocument();

      expect(getByText('EditListingPhotosForm.chooseImage')).toBeInTheDocument();
      expect(getByText('EditListingPhotosForm.imageTypes')).toBeInTheDocument();
      expect(getByText('EditListingPhotosForm.addImagesTip')).toBeInTheDocument();
      expect(getByText('EditListingWizard.edit.savePhotos')).toBeInTheDocument();
    });
  });
});

describe('EditListingPageComponent', () => {
  it('Check that there is correct wizard tabs', () => {
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

    // Check that default photos panel is not shown initially (it's added after listing type is selected)
    const tabLabelPhotos = 'EditListingWizard.tabLabelPhotos';
    expect(screen.queryByText(tabLabelPhotos)).not.toBeInTheDocument();

    userEvent.selectOptions(
      screen.getByLabelText('EditListingDetailsForm.listingTypeLabel'),
      'product-selling'
    );

    // Tabs not in use
    const tabLabelLocation = 'EditListingWizard.tabLabelLocation';
    expect(screen.queryByText(tabLabelLocation)).not.toBeInTheDocument();
    const tabLabelPricing = 'EditListingWizard.tabLabelPricing';
    expect(screen.queryByText(tabLabelPricing)).not.toBeInTheDocument();
    const tabLabelAvailability = 'EditListingWizard.tabLabelAvailability';
    expect(screen.queryByText(tabLabelAvailability)).not.toBeInTheDocument();

    // Tabs added
    const tabLabelPricingAndStock = 'EditListingWizard.tabLabelPricingAndStock';
    expect(screen.getByText(tabLabelPricingAndStock)).toBeInTheDocument();
    const tabLabelDelivery = 'EditListingWizard.tabLabelDelivery';
    expect(screen.getByText(tabLabelDelivery)).toBeInTheDocument();
    expect(screen.getByText(tabLabelPhotos)).toBeInTheDocument();
  });
});
