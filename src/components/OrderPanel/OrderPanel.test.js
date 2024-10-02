import React from 'react';
import '@testing-library/jest-dom';

import { types as sdkTypes } from '../../util/sdkLoader';
import { createListing, createStock, createUser, fakeIntl } from '../../util/testData';
import {
  renderWithProviders as render,
  testingLibrary,
  getRouteConfiguration,
  getHostedConfiguration,
} from '../../util/testHelpers';
import { TIME_SLOT_TIME } from '../../util/types';

import OrderPanel from './OrderPanel';

const { screen, waitFor } = testingLibrary;

const { Money, UUID } = sdkTypes;
const noop = () => null;

const today = new Date();
const currentYear = today.getUTCFullYear();
const m = today.getUTCMonth() + 1;
const currentMonth = m < 10 ? `0${m}` : m;

const listingTypes = [
  {
    id: 'rent-bicycles-daily',
    transactionProcess: {
      name: 'default-booking',
      alias: 'default-booking/release-1',
    },
    unitType: 'day',
  },
  {
    id: 'rent-bicycles-nightly',
    transactionProcess: {
      name: 'default-booking',
      alias: 'default-booking/release-1',
    },
    unitType: 'night',
  },
  {
    id: 'rent-bicycles-hourly',
    transactionProcess: {
      name: 'default-booking',
      alias: 'default-booking/release-1',
    },
    unitType: 'hour',
  },
  {
    id: 'sell-bicycles',
    transactionProcess: {
      name: 'default-purchase',
      alias: 'default-purchase/release-1',
    },
    unitType: 'item',
    stockType: 'multipleItems',
  },
];

const listingFields = [
  {
    key: 'cat',
    scope: 'public',
    listingTypeConfig: {
      limitToListingTypeIds: true,
      listingTypeIds: ['sell-bicycles'],
    },
    schemaType: 'enum',
    enumOptions: [{ option: 'cat_1', label: 'Cat 1' }, { option: 'cat_2', label: 'Cat 2' }],
    filterConfig: {
      indexForSearch: true,
      label: 'Cat',
      group: 'primary',
    },
    showConfig: {
      label: 'Cat',
    },
    saveConfig: {
      label: 'Cat',
    },
  },
  {
    key: 'amenities',
    scope: 'public',
    listingTypeConfig: {
      limitToListingTypeIds: true,
      listingTypeIds: ['rent-bicycles-daily', 'rent-bicycles-nightly', 'rent-bicycles-hourly'],
    },
    schemaType: 'multi-enum',
    enumOptions: [{ option: 'dog_1', label: 'Dog 1' }, { option: 'dog_2', label: 'Dog 2' }],
    filterConfig: {
      indexForSearch: true,
      label: 'Amenities',
      //searchMode: 'has_all',
      group: 'secondary',
    },
    showConfig: {
      label: 'Category',
    },
    saveConfig: {
      label: 'Category',
    },
  },
];

const timeSlots = [
  {
    id: new UUID(1),
    type: 'timeSlot',
    attributes: {
      start: new Date(`${currentYear}-${currentMonth}-14T09:00:00Z`),
      end: new Date(`${currentYear}-${currentMonth}-14T10:00:00Z`),
      type: TIME_SLOT_TIME,
    },
  },
  {
    id: new UUID(2),
    type: 'timeSlot',
    attributes: {
      start: new Date(`${currentYear}-${currentMonth}-14T16:00:00Z`),
      end: new Date(`${currentYear}-${currentMonth}-14T20:00:00Z`),
      type: TIME_SLOT_TIME,
    },
  },
  {
    id: new UUID(3),
    type: 'timeSlot',
    attributes: {
      start: new Date(`${currentYear}-${currentMonth}-20T09:00:00Z`),
      end: new Date(`${currentYear}-${currentMonth}-22T18:00:00Z`),
      type: TIME_SLOT_TIME,
    },
  },
  {
    id: new UUID(4),
    type: 'timeSlot',
    attributes: {
      start: new Date(`${currentYear}-${currentMonth}-17T09:00:00Z`),
      end: new Date(`${currentYear}-${currentMonth}-17T18:00:00Z`),
      type: TIME_SLOT_TIME,
    },
  },
  {
    id: new UUID(5),
    type: 'timeSlot',
    attributes: {
      start: new Date(`${currentYear}-${currentMonth}-28T09:00:00Z`),
      end: new Date(`${currentYear}-${currentMonth + 1}-03T18:00:00Z`),
      type: TIME_SLOT_TIME,
    },
  },
];

const getConfig = () => {
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

const monthlyId = `${currentYear}-${currentMonth}`;
const monthlyTimeSlots = {
  [monthlyId]: {
    timeSlots,
    fetchTimeSlotsError: null,
    fetchTimeSlotsInProgress: null,
  },
};

const commonProps = {
  author: createUser('john-author'),
  authorLink: null,
  onSubmit: noop,
  title: 'title!',
  titleDesktop: null,
  subTitle: 'subtitle!',
  onManageDisableScrolling: noop,

  onFetchTimeSlots: noop,
  monthlyTimeSlots,
  onFetchTransactionLineItems: noop,
  onContactUser: noop,
  lineItems: [],
  fetchLineItemsInProgress: false,
  fetchLineItemsError: null,
  marketplaceCurrency: 'USD',
  dayCountAvailableForBooking: 90,
  marketplaceName: 'Test marketplace',

  history: {
    push: noop,
  },
  location: {
    search: '',
  },
  intl: fakeIntl,
};

describe('OrderPanel', () => {
  const config = getConfig();
  const routeConfiguration = getRouteConfiguration(config.layout);
  const stockTypeMaybe = stockType => (stockType ? { stockType } : {});
  const validListingTypes = config.listingTypes.listingTypes.map(({ id, ...rest }) => ({
    listingType: id,
    transactionType: {
      process: rest?.transactionProcess?.name,
      alias: rest?.transactionProcess?.alias,
      unitType: rest.unitType,
    },
    ...stockTypeMaybe(rest?.stockType),
  }));

  it('Booking: daily', async () => {
    const listing = createListing('listing-day', {
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

    const props = { ...commonProps, listing, isOwnListing: false, validListingTypes };
    const { getByText, queryAllByText } = render(<OrderPanel {...props} />, {
      config,
      routeConfiguration,
    });
    await waitFor(() => {
      expect(queryAllByText('title!')).toHaveLength(2);
      expect(queryAllByText('$10.00')).toHaveLength(2);
      expect(queryAllByText('OrderPanel.perUnit')).toHaveLength(2);
      expect(queryAllByText('OrderPanel.author')).toHaveLength(2);
      expect(getByText('BookingDatesForm.bookingStartTitle')).toBeInTheDocument();
      expect(getByText('BookingDatesForm.bookingEndTitle')).toBeInTheDocument();
      expect(getByText('BookingDatesForm.requestToBook')).toBeInTheDocument();
      expect(getByText('BookingDatesForm.youWontBeChargedInfo')).toBeInTheDocument();
      expect(getByText('OrderPanel.ctaButtonMessageBooking')).toBeInTheDocument();
    });
  });

  it('Booking: nightly', async () => {
    const listing = createListing('listing-night', {
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
        listingType: 'rent-bicycles-nighlty',
        transactionProcessAlias: 'default-booking/release-1',
        unitType: 'night',
        amenities: ['dog_1'],
        location: {
          address: 'Main Street 123',
          building: 'A 1',
        },
      },
    });

    const props = { ...commonProps, listing, isOwnListing: false, validListingTypes };
    const { getByText, queryAllByText } = render(<OrderPanel {...props} />, {
      config,
      routeConfiguration,
    });
    await waitFor(() => {
      expect(queryAllByText('title!')).toHaveLength(2);
      expect(queryAllByText('$10.00')).toHaveLength(2);
      expect(queryAllByText('OrderPanel.perUnit')).toHaveLength(2);
      expect(queryAllByText('OrderPanel.author')).toHaveLength(2);
      expect(getByText('BookingDatesForm.bookingStartTitle')).toBeInTheDocument();
      expect(getByText('BookingDatesForm.bookingEndTitle')).toBeInTheDocument();
      expect(getByText('BookingDatesForm.requestToBook')).toBeInTheDocument();
      expect(getByText('BookingDatesForm.youWontBeChargedInfo')).toBeInTheDocument();
      expect(getByText('OrderPanel.ctaButtonMessageBooking')).toBeInTheDocument();
    });
  });

  it('Booking: hourly', async () => {
    const listing = createListing('listing-hourly', {
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

    const props = { ...commonProps, listing, isOwnListing: false, validListingTypes };
    const { getByText, queryAllByText } = render(<OrderPanel {...props} />, {
      config,
      routeConfiguration,
    });

    await waitFor(() => {
      expect(queryAllByText('title!')).toHaveLength(2);
      expect(queryAllByText('$10.00')).toHaveLength(2);
      expect(queryAllByText('OrderPanel.perUnit')).toHaveLength(2);
      expect(queryAllByText('OrderPanel.author')).toHaveLength(2);
      expect(getByText('BookingTimeForm.bookingStartTitle')).toBeInTheDocument();
      expect(getByText('FieldDateAndTimeInput.startTime')).toBeInTheDocument();
      expect(getByText('FieldDateAndTimeInput.endTime')).toBeInTheDocument();
      expect(getByText('BookingTimeForm.requestToBook')).toBeInTheDocument();
      expect(getByText('BookingTimeForm.youWontBeChargedInfo')).toBeInTheDocument();
      expect(getByText('OrderPanel.ctaButtonMessageBooking')).toBeInTheDocument();
    });
  });

  it('Purchase: item ', async () => {
    const listing = createListing(
      'listing-product',
      {
        title: 'the listing',
        description: 'Lorem ipsum',
        price: new Money(1000, 'USD'),

        publicData: {
          listingType: 'sell-bicycles',
          transactionProcessAlias: 'default-purchase/release-1',
          unitType: 'item',
          amenities: ['dog_1'],
          location: {
            address: 'Main Street 123',
            building: 'A 1',
          },
          pickupEnabled: true,
        },
      },
      {
        currentStock: createStock('stock-id', { quantity: 5 }),
      }
    );

    const props = { ...commonProps, listing, isOwnListing: false, validListingTypes };
    const { getByText, queryAllByText } = render(<OrderPanel {...props} />, {
      config,
      routeConfiguration,
    });

    await waitFor(() => {
      expect(queryAllByText('title!')).toHaveLength(2);
      expect(queryAllByText('$10.00')).toHaveLength(2);
      expect(queryAllByText('OrderPanel.perUnit')).toHaveLength(2);
      expect(queryAllByText('OrderPanel.author')).toHaveLength(2);
      expect(getByText('ProductOrderForm.quantityLabel')).toBeInTheDocument();
      expect(getByText('ProductOrderForm.deliveryMethodLabel')).toBeInTheDocument();
      expect(getByText('ProductOrderForm.pickupOption')).toBeInTheDocument();
      expect(getByText('ProductOrderForm.breakdownTitle')).toBeInTheDocument();
      expect(getByText('ProductOrderForm.ctaButton')).toBeInTheDocument();
      expect(getByText('ProductOrderForm.finePrint')).toBeInTheDocument();
      expect(getByText('OrderPanel.ctaButtonMessagePurchase')).toBeInTheDocument();
    });
  });

  it('Purchase: item (no delivery method set)', async () => {
    const listing = createListing(
      'listing-product',
      {
        title: 'the listing',
        description: 'Lorem ipsum',
        price: new Money(1000, 'USD'),

        publicData: {
          listingType: 'sell-bicycles',
          transactionProcessAlias: 'default-purchase/release-1',
          unitType: 'item',
          amenities: ['dog_1'],
          location: {
            address: 'Main Street 123',
            building: 'A 1',
          },
        },
      },
      {
        currentStock: createStock('stock-id', { quantity: 5 }),
      }
    );

    const props = { ...commonProps, listing, isOwnListing: false, validListingTypes };
    const { getByText, queryAllByText } = render(<OrderPanel {...props} />, {
      config,
      routeConfiguration,
    });

    await waitFor(() => {
      expect(queryAllByText('title!')).toHaveLength(2);
      expect(queryAllByText('$10.00')).toHaveLength(2);
      expect(queryAllByText('OrderPanel.perUnit')).toHaveLength(2);
      expect(queryAllByText('OrderPanel.author')).toHaveLength(2);
      expect(getByText('ProductOrderForm.noDeliveryMethodSet')).toBeInTheDocument();
      expect(getByText('OrderPanel.ctaButtonMessagePurchase')).toBeInTheDocument();
    });
  });

  it('Inquiry: inquiry ', async () => {
    const listing = createListing('listing-inquiry', {
      title: 'the listing',
      description: 'Lorem ipsum',
      price: new Money(1000, 'USD'),

      publicData: {
        listingType: 'inquiry',
        transactionProcessAlias: 'default-inquiry/release-1',
        unitType: 'inquiry',
        amenities: ['dog_1'],
        location: {
          address: 'Main Street 123',
          building: 'A 1',
        },
      },
    });

    const props = { ...commonProps, listing, isOwnListing: false, validListingTypes };
    const { getByText, queryAllByText } = render(<OrderPanel {...props} />, {
      config,
      routeConfiguration,
    });

    await waitFor(() => {
      expect(queryAllByText('title!')).toHaveLength(2);
      expect(queryAllByText('$10.00')).toHaveLength(2);
      expect(queryAllByText('OrderPanel.perUnit')).toHaveLength(2);
      expect(queryAllByText('OrderPanel.author')).toHaveLength(2);
      expect(getByText('InquiryWithoutPaymentForm.ctaButton')).toBeInTheDocument();
      expect(getByText('OrderPanel.ctaButtonMessageInquiry')).toBeInTheDocument();
    });
  });
});
