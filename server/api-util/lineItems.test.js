const { types } = require('sharetribe-flex-sdk');
const { Money } = types;
const { transactionLineItems } = require('./lineItems');

describe('transactionLineItems', () => {
  // Mock data for testing
  const mockListing = {
    attributes: {
      price: new Money(10000, 'EUR'), // €100.00
      publicData: {
        unitType: 'day',
        priceVariationsEnabled: false,
      },
    },
  };

  const mockProviderCommission = {
    percentage: 10,
    minimum_amount: 500, // €5.00
  };

  const mockCustomerCommission = {
    percentage: 5,
    minimum_amount: 200, // €2.00
  };

  const mockOrderData = {
    bookingStart: '2024-01-01T00:00:00.000Z',
    bookingEnd: '2024-01-03T00:00:00.000Z',
    seats: 2,
    stockReservationQuantity: 3,
    deliveryMethod: 'shipping',
    currency: 'EUR',
  };

  describe('Default Booking Process - Day Unit Type', () => {
    it('should create line items for day-based booking without seats', () => {
      const listing = {
        ...mockListing,
        attributes: {
          ...mockListing.attributes,
          publicData: {
            ...mockListing.attributes.publicData,
            unitType: 'day',
          },
        },
      };

      const orderData = {
        bookingStart: '2024-01-01T00:00:00.000Z',
        bookingEnd: '2024-01-03T00:00:00.000Z',
      };

      const result = transactionLineItems(
        listing,
        orderData,
        mockProviderCommission,
        mockCustomerCommission
      );

      expect(result).toHaveLength(3); // order + provider commission + customer commission

      // Check main order line item
      expect(result[0]).toEqual({
        code: 'line-item/day',
        unitPrice: new Money(10000, 'EUR'),
        quantity: 2, // 2 days between dates
        includeFor: ['customer', 'provider'],
      });

      // Check provider commission
      expect(result[1].code).toBe('line-item/provider-commission');
      expect(result[1].includeFor).toEqual(['provider']);

      // Check customer commission
      expect(result[2].code).toBe('line-item/customer-commission');
      expect(result[2].includeFor).toEqual(['customer']);
    });

    it('should create line items for day-based booking with seats', () => {
      const listing = {
        ...mockListing,
        attributes: {
          ...mockListing.attributes,
          publicData: {
            ...mockListing.attributes.publicData,
            unitType: 'day',
          },
        },
      };

      const orderData = {
        bookingStart: '2024-01-01T00:00:00.000Z',
        bookingEnd: '2024-01-03T00:00:00.000Z',
        seats: 3,
      };

      const result = transactionLineItems(
        listing,
        orderData,
        mockProviderCommission,
        mockCustomerCommission
      );

      expect(result).toHaveLength(3);

      // Check main order line item with seats
      expect(result[0]).toEqual({
        code: 'line-item/day',
        unitPrice: new Money(10000, 'EUR'),
        units: 2, // 2 days
        seats: 3, // 3 seats
        includeFor: ['customer', 'provider'],
      });
    });
  });

  describe('Default Booking Process - Night Unit Type', () => {
    it('should create line items for night-based booking without seats', () => {
      const listing = {
        ...mockListing,
        attributes: {
          ...mockListing.attributes,
          publicData: {
            ...mockListing.attributes.publicData,
            unitType: 'night',
          },
        },
      };

      const orderData = {
        bookingStart: '2024-01-01T00:00:00.000Z',
        bookingEnd: '2024-01-03T00:00:00.000Z',
      };

      const result = transactionLineItems(
        listing,
        orderData,
        mockProviderCommission,
        mockCustomerCommission
      );

      expect(result).toHaveLength(3);

      // Check main order line item
      expect(result[0]).toEqual({
        code: 'line-item/night',
        unitPrice: new Money(10000, 'EUR'),
        quantity: 2, // 2 nights between dates
        includeFor: ['customer', 'provider'],
      });
    });

    it('should create line items for night-based booking with seats', () => {
      const listing = {
        ...mockListing,
        attributes: {
          ...mockListing.attributes,
          publicData: {
            ...mockListing.attributes.publicData,
            unitType: 'night',
          },
        },
      };

      const orderData = {
        bookingStart: '2024-01-01T00:00:00.000Z',
        bookingEnd: '2024-01-03T00:00:00.000Z',
        seats: 4,
      };

      const result = transactionLineItems(
        listing,
        orderData,
        mockProviderCommission,
        mockCustomerCommission
      );

      expect(result).toHaveLength(3);

      // Check main order line item with seats
      expect(result[0]).toEqual({
        code: 'line-item/night',
        unitPrice: new Money(10000, 'EUR'),
        units: 2, // 2 nights
        seats: 4, // 4 seats
        includeFor: ['customer', 'provider'],
      });
    });
  });

  describe('Default Booking Process - Hour Unit Type', () => {
    it('should create line items for hour-based booking without seats', () => {
      const listing = {
        ...mockListing,
        attributes: {
          ...mockListing.attributes,
          publicData: {
            ...mockListing.attributes.publicData,
            unitType: 'hour',
          },
        },
      };

      const orderData = {
        bookingStart: '2024-01-01T00:00:00.000Z',
        bookingEnd: '2024-01-01T03:00:00.000Z', // 3 hours
      };

      const result = transactionLineItems(
        listing,
        orderData,
        mockProviderCommission,
        mockCustomerCommission
      );

      expect(result).toHaveLength(3);

      // Check main order line item
      expect(result[0]).toEqual({
        code: 'line-item/hour',
        unitPrice: new Money(10000, 'EUR'),
        quantity: 3, // 3 hours
        includeFor: ['customer', 'provider'],
      });
    });

    it('should create line items for hour-based booking with seats', () => {
      const listing = {
        ...mockListing,
        attributes: {
          ...mockListing.attributes,
          publicData: {
            ...mockListing.attributes.publicData,
            unitType: 'hour',
          },
        },
      };

      const orderData = {
        bookingStart: '2024-01-01T00:00:00.000Z',
        bookingEnd: '2024-01-01T03:00:00.000Z', // 3 hours
        seats: 2,
      };

      const result = transactionLineItems(
        listing,
        orderData,
        mockProviderCommission,
        mockCustomerCommission
      );

      expect(result).toHaveLength(3);

      // Check main order line item with seats
      expect(result[0]).toEqual({
        code: 'line-item/hour',
        unitPrice: new Money(10000, 'EUR'),
        units: 3, // 3 hours
        seats: 2, // 2 seats
        includeFor: ['customer', 'provider'],
      });
    });
  });

  describe('Default Booking Process - Fixed Unit Type', () => {
    it('should create line items for fixed-duration booking without seats', () => {
      const listing = {
        ...mockListing,
        attributes: {
          ...mockListing.attributes,
          publicData: {
            ...mockListing.attributes.publicData,
            unitType: 'fixed',
          },
        },
      };

      const orderData = {
        bookingStart: '2024-01-01T00:00:00.000Z',
        bookingEnd: '2024-01-01T02:00:00.000Z',
      };

      const result = transactionLineItems(
        listing,
        orderData,
        mockProviderCommission,
        mockCustomerCommission
      );

      expect(result).toHaveLength(3);

      // Check main order line item
      expect(result[0]).toEqual({
        code: 'line-item/fixed',
        unitPrice: new Money(10000, 'EUR'),
        quantity: 1, // 1 fixed session
        includeFor: ['customer', 'provider'],
      });
    });

    it('should create line items for fixed-duration booking with seats', () => {
      const listing = {
        ...mockListing,
        attributes: {
          ...mockListing.attributes,
          publicData: {
            ...mockListing.attributes.publicData,
            unitType: 'fixed',
          },
        },
      };

      const orderData = {
        bookingStart: '2024-01-01T00:00:00.000Z',
        bookingEnd: '2024-01-01T02:00:00.000Z',
        seats: 5,
      };

      const result = transactionLineItems(
        listing,
        orderData,
        mockProviderCommission,
        mockCustomerCommission
      );

      expect(result).toHaveLength(3);

      // Check main order line item with seats
      expect(result[0]).toEqual({
        code: 'line-item/fixed',
        unitPrice: new Money(10000, 'EUR'),
        units: 1, // 1 fixed session
        seats: 5, // 5 seats
        includeFor: ['customer', 'provider'],
      });
    });
  });

  describe('Default Purchase Process - Item Unit Type', () => {
    it('should create line items for item purchase with pickup delivery', () => {
      const listing = {
        ...mockListing,
        attributes: {
          ...mockListing.attributes,
          publicData: {
            ...mockListing.attributes.publicData,
            unitType: 'item',
            shippingPriceInSubunitsOneItem: 500, // €5.00
            shippingPriceInSubunitsAdditionalItems: 200, // €2.00
          },
        },
      };

      const orderData = {
        stockReservationQuantity: 2,
        deliveryMethod: 'pickup',
        currency: 'EUR',
      };

      const result = transactionLineItems(
        listing,
        orderData,
        mockProviderCommission,
        mockCustomerCommission
      );

      expect(result).toHaveLength(3); // order + provider commission + customer commission (no shipping for pickup)

      // Check main order line item
      expect(result[0]).toEqual({
        code: 'line-item/item',
        unitPrice: new Money(10000, 'EUR'),
        quantity: 2,
        includeFor: ['customer', 'provider'],
      });
    });

    it('should create line items for item purchase with shipping delivery', () => {
      const listing = {
        ...mockListing,
        attributes: {
          ...mockListing.attributes,
          publicData: {
            ...mockListing.attributes.publicData,
            unitType: 'item',
            shippingPriceInSubunitsOneItem: 500, // €5.00
            shippingPriceInSubunitsAdditionalItems: 200, // €2.00
          },
        },
      };

      const orderData = {
        stockReservationQuantity: 3,
        deliveryMethod: 'shipping',
        currency: 'EUR',
      };

      const result = transactionLineItems(
        listing,
        orderData,
        mockProviderCommission,
        mockCustomerCommission
      );

      expect(result).toHaveLength(4); // order + shipping + provider commission + customer commission

      // Check main order line item
      expect(result[0]).toEqual({
        code: 'line-item/item',
        unitPrice: new Money(10000, 'EUR'),
        quantity: 3,
        includeFor: ['customer', 'provider'],
      });

      // Check shipping line item
      expect(result[1]).toEqual({
        code: 'line-item/shipping-fee',
        unitPrice: new Money(900, 'EUR'), // €5.00 + (2 * €2.00) = €9.00
        quantity: 1,
        includeFor: ['customer', 'provider'],
      });
    });

    it('should create line items for single item purchase with shipping', () => {
      const listing = {
        ...mockListing,
        attributes: {
          ...mockListing.attributes,
          publicData: {
            ...mockListing.attributes.publicData,
            unitType: 'item',
            shippingPriceInSubunitsOneItem: 500, // €5.00
            shippingPriceInSubunitsAdditionalItems: 200, // €2.00
          },
        },
      };

      const orderData = {
        stockReservationQuantity: 1,
        deliveryMethod: 'shipping',
        currency: 'EUR',
      };

      const result = transactionLineItems(
        listing,
        orderData,
        mockProviderCommission,
        mockCustomerCommission
      );

      expect(result).toHaveLength(4); // order + shipping + provider commission + customer commission

      // Check shipping line item for single item
      expect(result[1]).toEqual({
        code: 'line-item/shipping-fee',
        unitPrice: new Money(500, 'EUR'), // €5.00 for first item only
        quantity: 1,
        includeFor: ['customer', 'provider'],
      });
    });
  });

  describe('Default Negotiation Process - Request Unit Type (Reverse Flow)', () => {
    it('should create line items for negotiation request with offer', () => {
      const listing = {
        ...mockListing,
        attributes: {
          ...mockListing.attributes,
          publicData: {
            ...mockListing.attributes.publicData,
            unitType: 'request',
          },
        },
      };

      const orderData = {
        offer: new Money(15000, 'EUR'), // €150.00 offer
        currency: 'EUR',
      };

      const result = transactionLineItems(
        listing,
        orderData,
        mockProviderCommission,
        mockCustomerCommission
      );

      expect(result).toHaveLength(3); // order + provider commission + customer commission

      // Check main order line item
      expect(result[0]).toEqual({
        code: 'line-item/request',
        unitPrice: new Money(15000, 'EUR'), // Uses the offer amount
        quantity: 1,
        includeFor: ['customer', 'provider'],
      });
    });

    it('should create line items for negotiation request without offer (uses listing price)', () => {
      const listing = {
        ...mockListing,
        attributes: {
          ...mockListing.attributes,
          publicData: {
            ...mockListing.attributes.publicData,
            unitType: 'request',
          },
        },
      };

      const orderData = {
        currency: 'EUR',
      };

      const result = transactionLineItems(
        listing,
        orderData,
        mockProviderCommission,
        mockCustomerCommission
      );

      expect(result).toHaveLength(3);

      // Check main order line item uses listing price when no offer
      expect(result[0]).toEqual({
        code: 'line-item/request',
        unitPrice: new Money(10000, 'EUR'), // Uses listing price
        quantity: 1,
        includeFor: ['customer', 'provider'],
      });
    });
  });

  describe('Price Variants', () => {
    it('should use price variant when priceVariationsEnabled is true', () => {
      const listing = {
        ...mockListing,
        attributes: {
          ...mockListing.attributes,
          publicData: {
            ...mockListing.attributes.publicData,
            unitType: 'day',
            priceVariationsEnabled: true,
            priceVariants: [
              {
                name: 'weekend',
                priceInSubunits: 15000, // €150.00
              },
            ],
          },
        },
      };

      const orderData = {
        bookingStart: '2024-01-01T00:00:00.000Z',
        bookingEnd: '2024-01-03T00:00:00.000Z',
        priceVariantName: 'weekend',
      };

      const result = transactionLineItems(
        listing,
        orderData,
        mockProviderCommission,
        mockCustomerCommission
      );

      expect(result[0].unitPrice).toEqual(new Money(15000, 'EUR'));
    });
  });

  describe('Commission Handling', () => {
    it('should not add commission line items when commissions are not provided', () => {
      const listing = {
        ...mockListing,
        attributes: {
          ...mockListing.attributes,
          publicData: {
            ...mockListing.attributes.publicData,
            unitType: 'day',
          },
        },
      };

      const orderData = {
        bookingStart: '2024-01-01T00:00:00.000Z',
        bookingEnd: '2024-01-03T00:00:00.000Z',
      };

      const result = transactionLineItems(listing, orderData, null, null);

      expect(result).toHaveLength(1); // Only order line item
      expect(result[0].code).toBe('line-item/day');
    });

    it('should use minimum commission when it is greater than percentage-based commission', () => {
      const listing = {
        ...mockListing,
        attributes: {
          ...mockListing.attributes,
          publicData: {
            ...mockListing.attributes.publicData,
            unitType: 'day',
          },
        },
      };

      const orderData = {
        bookingStart: '2024-01-01T00:00:00.000Z',
        bookingEnd: '2024-01-03T00:00:00.000Z',
      };

      const providerCommission = {
        percentage: 5,
        minimum_amount: 3000, // €30.00 minimum (greater than 5% of €200 = €10)
      };

      const result = transactionLineItems(listing, orderData, providerCommission, null);

      expect(result).toHaveLength(2); // order + provider commission
      expect(result[1].code).toBe('line-item/provider-commission');
      expect(result[1].unitPrice).toEqual(new Money(3000, 'EUR')); // Uses minimum amount
      expect(result[1].quantity).toBe(-1); // Negative for provider commission
    });

    it('should use percentage-based commission when it is greater than minimum', () => {
      const listing = {
        ...mockListing,
        attributes: {
          ...mockListing.attributes,
          publicData: {
            ...mockListing.attributes.publicData,
            unitType: 'day',
          },
        },
      };

      const orderData = {
        bookingStart: '2024-01-01T00:00:00.000Z',
        bookingEnd: '2024-01-03T00:00:00.000Z',
      };

      const providerCommission = {
        percentage: 15,
        minimum_amount: 100, // €1.00 minimum (less than 15% of €200 = €30)
      };

      const result = transactionLineItems(listing, orderData, providerCommission, null);

      expect(result).toHaveLength(2); // order + provider commission
      expect(result[1].code).toBe('line-item/provider-commission');
      expect(result[1].percentage).toBe(-15); // Negative percentage for provider commission
    });
  });

  describe('Error Handling', () => {
    it('should throw error when orderData is missing required quantity information', () => {
      const listing = {
        ...mockListing,
        attributes: {
          ...mockListing.attributes,
          publicData: {
            ...mockListing.attributes.publicData,
            unitType: 'day',
          },
        },
      };

      const orderData = {
        // Missing bookingStart and bookingEnd
      };

      expect(() => {
        transactionLineItems(listing, orderData, mockProviderCommission, mockCustomerCommission);
      }).toThrow(
        'Error: orderData is missing the following information: quantity, units, seats. Quantity or either units & seats is required.'
      );
    });

    it('should throw error when orderData is missing units and seats for seat-based booking', () => {
      const listing = {
        ...mockListing,
        attributes: {
          ...mockListing.attributes,
          publicData: {
            ...mockListing.attributes.publicData,
            unitType: 'day',
          },
        },
      };

      const orderData = {
        // Missing bookingStart and bookingEnd - this will cause calculateQuantityFromDates to return null
        seats: 2,
      };

      expect(() => {
        transactionLineItems(listing, orderData, mockProviderCommission, mockCustomerCommission);
      }).toThrow(
        'Error: orderData is missing the following information: quantity, units. Quantity or either units & seats is required.'
      );
    });

    it('should throw error when minimum commission is greater than transaction amount', () => {
      const listing = {
        ...mockListing,
        attributes: {
          ...mockListing.attributes,
          publicData: {
            ...mockListing.attributes.publicData,
            unitType: 'day',
          },
        },
      };

      const orderData = {
        bookingStart: '2024-01-01T00:00:00.000Z',
        bookingEnd: '2024-01-03T00:00:00.000Z',
      };

      const providerCommission = {
        percentage: 5,
        minimum_amount: 50000, // €500.00 minimum (greater than transaction amount)
      };

      expect(() => {
        transactionLineItems(listing, orderData, providerCommission, null);
      }).toThrow('Minimum commission amount is greater than the amount of money paid in');
    });
  });

  describe('Currency Handling', () => {
    it('should use currency from orderData when listing price has no currency', () => {
      const listing = {
        ...mockListing,
        attributes: {
          price: null, // No price attribute
          publicData: {
            ...mockListing.attributes.publicData,
            unitType: 'day',
          },
        },
      };

      const orderData = {
        bookingStart: '2024-01-01T00:00:00.000Z',
        bookingEnd: '2024-01-03T00:00:00.000Z',
        currency: 'USD',
      };

      const result = transactionLineItems(listing, orderData, null, null);

      expect(result[0].unitPrice).toBeNull(); // No unit price when no listing price
    });

    it('should use currency from listing price when available', () => {
      const listing = {
        ...mockListing,
        attributes: {
          price: new Money(10000, 'USD'), // USD currency
          publicData: {
            ...mockListing.attributes.publicData,
            unitType: 'day',
          },
        },
      };

      const orderData = {
        bookingStart: '2024-01-01T00:00:00.000Z',
        bookingEnd: '2024-01-03T00:00:00.000Z',
        currency: 'EUR', // Different currency in orderData
      };

      const result = transactionLineItems(listing, orderData, null, null);

      expect(result[0].unitPrice.currency).toBe('USD'); // Uses listing currency
    });
  });
});
