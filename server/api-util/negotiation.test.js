const {
  isIntentionToMakeOffer,
  isIntentionToMakeCounterOffer,
  isIntentionToRevokeCounterOffer,
  throwErrorIfNegotiationOfferHasInvalidHistory,
  getAmountFromPreviousOffer,
  addOfferToMetadata,
} = require('./negotiation');

describe('negotiation utils', () => {
  describe('isIntentionToMakeOffer(offerInSubunits, transitionName)', () => {
    describe('valid make offer transitions', () => {
      it('should return true for make-offer transition with positive offer', () => {
        expect(isIntentionToMakeOffer(1000, 'transition/make-offer')).toBe(true);
        expect(isIntentionToMakeOffer(5000, 'transition/make-offer')).toBe(true);
        expect(isIntentionToMakeOffer(1, 'transition/make-offer')).toBe(true);
      });

      it('should return true for make-offer-after-inquiry transition with positive offer', () => {
        expect(isIntentionToMakeOffer(1000, 'transition/make-offer-after-inquiry')).toBe(true);
        expect(isIntentionToMakeOffer(5000, 'transition/make-offer-after-inquiry')).toBe(true);
        expect(isIntentionToMakeOffer(1, 'transition/make-offer-after-inquiry')).toBe(true);
      });

      it('should return true for make-offer-from-quote-requested transition with positive offer', () => {
        expect(isIntentionToMakeOffer(1000, 'transition/make-offer-from-request')).toBe(true);
        expect(isIntentionToMakeOffer(5000, 'transition/make-offer-from-request')).toBe(true);
        expect(isIntentionToMakeOffer(1, 'transition/make-offer-from-request')).toBe(true);
      });

      it('should return false for make offer transitions with zero offer', () => {
        expect(isIntentionToMakeOffer(0, 'transition/make-offer')).toBe(false);
        expect(isIntentionToMakeOffer(0, 'transition/make-offer-after-inquiry')).toBe(false);
        expect(isIntentionToMakeOffer(0, 'transition/make-offer-from-request')).toBe(false);
      });

      it('should return false for make offer transitions with negative offer', () => {
        expect(isIntentionToMakeOffer(-100, 'transition/make-offer')).toBe(false);
        expect(isIntentionToMakeOffer(-5000, 'transition/make-offer-after-inquiry')).toBe(false);
        expect(isIntentionToMakeOffer(-1, 'transition/make-offer-from-request')).toBe(false);
      });
    });

    describe('invalid transitions', () => {
      it('should return false for counter offer transitions with positive offer', () => {
        expect(isIntentionToMakeOffer(1000, 'transition/customer-make-counter-offer')).toBe(false);
        expect(isIntentionToMakeOffer(5000, 'transition/provider-make-counter-offer')).toBe(false);
      });

      it('should return false for revoke counter offer transitions with positive offer', () => {
        expect(isIntentionToMakeOffer(1000, 'transition/customer-withdraw-counter-offer')).toBe(
          false
        );
        expect(isIntentionToMakeOffer(5000, 'transition/provider-reject-counter-offer')).toBe(
          false
        );
      });

      it('should return false for other transitions with positive offer', () => {
        expect(isIntentionToMakeOffer(1000, 'transition/accept-offer')).toBe(false);
        expect(isIntentionToMakeOffer(5000, 'transition/reject-offer')).toBe(false);
        expect(isIntentionToMakeOffer(1000, 'transition/cancel-negotiation')).toBe(false);
        expect(isIntentionToMakeOffer(5000, 'transition/complete-negotiation')).toBe(false);
      });

      it('should return false for invalid transitions with zero offer', () => {
        expect(isIntentionToMakeOffer(0, 'transition/customer-make-counter-offer')).toBe(false);
        expect(isIntentionToMakeOffer(0, 'transition/accept-offer')).toBe(false);
        expect(isIntentionToMakeOffer(0, 'transition/invalid-transition')).toBe(false);
      });

      it('should return false for invalid transitions with negative offer', () => {
        expect(isIntentionToMakeOffer(-100, 'transition/customer-make-counter-offer')).toBe(false);
        expect(isIntentionToMakeOffer(-5000, 'transition/accept-offer')).toBe(false);
        expect(isIntentionToMakeOffer(-1, 'transition/invalid-transition')).toBe(false);
      });
    });

    describe('edge cases', () => {
      it('should handle very large positive offers', () => {
        expect(isIntentionToMakeOffer(Number.MAX_SAFE_INTEGER, 'transition/make-offer')).toBe(true);
        expect(isIntentionToMakeOffer(999999999, 'transition/make-offer-after-inquiry')).toBe(true);
      });

      it('should handle very small positive offers', () => {
        expect(isIntentionToMakeOffer(1, 'transition/make-offer')).toBe(true);
        expect(isIntentionToMakeOffer(0.01, 'transition/make-offer-after-inquiry')).toBe(true);
      });

      it('should handle very large negative offers', () => {
        expect(isIntentionToMakeOffer(Number.MIN_SAFE_INTEGER, 'transition/make-offer')).toBe(
          false
        );
        expect(isIntentionToMakeOffer(-999999999, 'transition/make-offer-after-inquiry')).toBe(
          false
        );
      });

      it('should handle malformed transition names', () => {
        expect(isIntentionToMakeOffer(1000, 'make-offer')).toBe(false);
        expect(isIntentionToMakeOffer(1000, 'transition/make_offer')).toBe(false);
        expect(isIntentionToMakeOffer(1000, 'transition/makeoffer')).toBe(false);
        expect(isIntentionToMakeOffer(1000, 'TRANSITION/MAKE-OFFER')).toBe(false);
      });
    });
  });

  describe('isIntentionToMakeCounterOffer(offerInSubunits, transitionName)', () => {
    describe('valid counter offer transitions', () => {
      it('should return true for customer-make-counter-offer transition with positive offer', () => {
        expect(isIntentionToMakeCounterOffer(1000, 'transition/customer-make-counter-offer')).toBe(
          true
        );
        expect(isIntentionToMakeCounterOffer(5000, 'transition/customer-make-counter-offer')).toBe(
          true
        );
        expect(isIntentionToMakeCounterOffer(1, 'transition/customer-make-counter-offer')).toBe(
          true
        );
      });

      it('should return true for provider-make-counter-offer transition with positive offer', () => {
        expect(isIntentionToMakeCounterOffer(1000, 'transition/provider-make-counter-offer')).toBe(
          true
        );
        expect(isIntentionToMakeCounterOffer(5000, 'transition/provider-make-counter-offer')).toBe(
          true
        );
        expect(isIntentionToMakeCounterOffer(1, 'transition/provider-make-counter-offer')).toBe(
          true
        );
      });

      it('should return false for counter offer transitions with zero offer', () => {
        expect(isIntentionToMakeCounterOffer(0, 'transition/customer-make-counter-offer')).toBe(
          false
        );
        expect(isIntentionToMakeCounterOffer(0, 'transition/provider-make-counter-offer')).toBe(
          false
        );
      });

      it('should return false for counter offer transitions with negative offer', () => {
        expect(isIntentionToMakeCounterOffer(-100, 'transition/customer-make-counter-offer')).toBe(
          false
        );
        expect(isIntentionToMakeCounterOffer(-5000, 'transition/provider-make-counter-offer')).toBe(
          false
        );
      });
    });

    describe('invalid transitions', () => {
      it('should return false for make offer transitions with positive offer', () => {
        expect(isIntentionToMakeCounterOffer(1000, 'transition/make-offer')).toBe(false);
        expect(isIntentionToMakeCounterOffer(5000, 'transition/make-offer-after-inquiry')).toBe(
          false
        );
        expect(isIntentionToMakeCounterOffer(1000, 'transition/make-offer-from-request')).toBe(
          false
        );
      });

      it('should return false for revoke counter offer transitions with positive offer', () => {
        expect(
          isIntentionToMakeCounterOffer(1000, 'transition/customer-withdraw-counter-offer')
        ).toBe(false);
        expect(
          isIntentionToMakeCounterOffer(5000, 'transition/provider-reject-counter-offer')
        ).toBe(false);
      });

      it('should return false for other transitions with positive offer', () => {
        expect(isIntentionToMakeCounterOffer(1000, 'transition/accept-offer')).toBe(false);
        expect(isIntentionToMakeCounterOffer(5000, 'transition/reject-offer')).toBe(false);
        expect(isIntentionToMakeCounterOffer(1000, 'transition/cancel-negotiation')).toBe(false);
        expect(isIntentionToMakeCounterOffer(5000, 'transition/complete-negotiation')).toBe(false);
      });

      it('should return false for invalid transitions with zero offer', () => {
        expect(isIntentionToMakeCounterOffer(0, 'transition/make-offer')).toBe(false);
        expect(isIntentionToMakeCounterOffer(0, 'transition/accept-offer')).toBe(false);
        expect(isIntentionToMakeCounterOffer(0, 'transition/invalid-transition')).toBe(false);
      });

      it('should return false for invalid transitions with negative offer', () => {
        expect(isIntentionToMakeCounterOffer(-100, 'transition/make-offer')).toBe(false);
        expect(isIntentionToMakeCounterOffer(-5000, 'transition/accept-offer')).toBe(false);
        expect(isIntentionToMakeCounterOffer(-1, 'transition/invalid-transition')).toBe(false);
      });
    });

    describe('edge cases', () => {
      it('should handle very large positive offers', () => {
        expect(
          isIntentionToMakeCounterOffer(
            Number.MAX_SAFE_INTEGER,
            'transition/customer-make-counter-offer'
          )
        ).toBe(true);
        expect(
          isIntentionToMakeCounterOffer(999999999, 'transition/provider-make-counter-offer')
        ).toBe(true);
      });

      it('should handle very small positive offers', () => {
        expect(isIntentionToMakeCounterOffer(1, 'transition/customer-make-counter-offer')).toBe(
          true
        );
        expect(isIntentionToMakeCounterOffer(0.01, 'transition/provider-make-counter-offer')).toBe(
          true
        );
      });

      it('should handle very large negative offers', () => {
        expect(
          isIntentionToMakeCounterOffer(
            Number.MIN_SAFE_INTEGER,
            'transition/customer-make-counter-offer'
          )
        ).toBe(false);
        expect(
          isIntentionToMakeCounterOffer(-999999999, 'transition/provider-make-counter-offer')
        ).toBe(false);
      });

      it('should handle malformed transition names', () => {
        expect(isIntentionToMakeCounterOffer(1000, 'customer-make-counter-offer')).toBe(false);
        expect(isIntentionToMakeCounterOffer(1000, 'transition/customer_make_counter_offer')).toBe(
          false
        );
        expect(isIntentionToMakeCounterOffer(1000, 'transition/customermakecounteroffer')).toBe(
          false
        );
        expect(isIntentionToMakeCounterOffer(1000, 'TRANSITION/CUSTOMER-MAKE-COUNTER-OFFER')).toBe(
          false
        );
      });
    });
  });

  describe('isIntentionToRevokeCounterOffer(transitionName)', () => {
    describe('valid revoke counter offer transitions', () => {
      it('should return true for customer-withdraw-counter-offer transition', () => {
        expect(isIntentionToRevokeCounterOffer('transition/customer-withdraw-counter-offer')).toBe(
          true
        );
      });

      it('should return true for provider-reject-counter-offer transition', () => {
        expect(isIntentionToRevokeCounterOffer('transition/provider-reject-counter-offer')).toBe(
          true
        );
      });
    });

    describe('invalid transitions', () => {
      it('should return false for make offer transitions', () => {
        expect(isIntentionToRevokeCounterOffer('transition/make-offer')).toBe(false);
        expect(isIntentionToRevokeCounterOffer('transition/make-offer-after-inquiry')).toBe(false);
        expect(isIntentionToRevokeCounterOffer('transition/make-offer-from-request')).toBe(false);
      });

      it('should return false for counter offer transitions', () => {
        expect(isIntentionToRevokeCounterOffer('transition/customer-make-counter-offer')).toBe(
          false
        );
        expect(isIntentionToRevokeCounterOffer('transition/provider-make-counter-offer')).toBe(
          false
        );
      });

      it('should return false for other transitions', () => {
        expect(isIntentionToRevokeCounterOffer('transition/accept-offer')).toBe(false);
        expect(isIntentionToRevokeCounterOffer('transition/reject-offer')).toBe(false);
        expect(isIntentionToRevokeCounterOffer('transition/cancel-negotiation')).toBe(false);
        expect(isIntentionToRevokeCounterOffer('transition/complete-negotiation')).toBe(false);
        expect(isIntentionToRevokeCounterOffer('transition/invalid-transition')).toBe(false);
      });
    });

    describe('edge cases', () => {
      it('should handle malformed transition names', () => {
        expect(isIntentionToRevokeCounterOffer('customer-withdraw-counter-offer')).toBe(false);
        expect(isIntentionToRevokeCounterOffer('transition/customer_withdraw_counter_offer')).toBe(
          false
        );
        expect(isIntentionToRevokeCounterOffer('transition/customerwithdrawcounteroffer')).toBe(
          false
        );
        expect(isIntentionToRevokeCounterOffer('TRANSITION/CUSTOMER-WITHDRAW-COUNTER-OFFER')).toBe(
          false
        );
        expect(
          isIntentionToRevokeCounterOffer('transition/customer-withdraw-counter-offer-extra')
        ).toBe(false);
        expect(isIntentionToRevokeCounterOffer('transition/customer-withdraw')).toBe(false);
      });

      it('should handle empty and null values', () => {
        expect(isIntentionToRevokeCounterOffer('')).toBe(false);
        expect(isIntentionToRevokeCounterOffer(null)).toBe(false);
        expect(isIntentionToRevokeCounterOffer(undefined)).toBe(false);
      });

      it('should handle non-string values', () => {
        expect(isIntentionToRevokeCounterOffer(123)).toBe(false);
        expect(isIntentionToRevokeCounterOffer({})).toBe(false);
        expect(isIntentionToRevokeCounterOffer([])).toBe(false);
        expect(isIntentionToRevokeCounterOffer(true)).toBe(false);
        expect(isIntentionToRevokeCounterOffer(false)).toBe(false);
      });
    });
  });

  describe('throwErrorIfNegotiationOfferHasInvalidHistory(transitionName, offers, transitions)', () => {
    const mockTransitions = [
      {
        transition: 'transition/make-offer',
        by: 'provider',
        createdAt: '2023-01-01T00:00:00.000Z',
      },
      {
        transition: 'transition/customer-make-counter-offer',
        by: 'customer',
        createdAt: '2023-01-02T00:00:00.000Z',
      },
      {
        transition: 'transition/provider-make-counter-offer',
        by: 'provider',
        createdAt: '2023-01-03T00:00:00.000Z',
      },
    ];

    const mockOffers = [
      {
        transition: 'transition/make-offer',
        by: 'provider',
        offerInSubunits: 1000,
      },
      {
        transition: 'transition/customer-make-counter-offer',
        by: 'customer',
        offerInSubunits: 800,
      },
      {
        transition: 'transition/provider-make-counter-offer',
        by: 'provider',
        offerInSubunits: 900,
      },
    ];

    describe('valid scenarios', () => {
      it('should not throw error for valid offers array with matching transitions', () => {
        expect(() => {
          throwErrorIfNegotiationOfferHasInvalidHistory(
            'transition/customer-make-counter-offer',
            mockOffers,
            mockTransitions
          );
        }).not.toThrow();
      });

      it('should not throw error for non-relevant transition', () => {
        expect(() => {
          throwErrorIfNegotiationOfferHasInvalidHistory(
            'transition/accept-offer',
            mockOffers,
            mockTransitions
          );
        }).not.toThrow();
      });

      it('should not throw error for empty offers array with no relevant transitions', () => {
        const transitionsWithoutOffers = [
          {
            transition: 'transition/accept-offer',
            by: 'customer',
            createdAt: '2023-01-01T00:00:00.000Z',
          },
        ];

        expect(() => {
          throwErrorIfNegotiationOfferHasInvalidHistory(
            'transition/make-offer',
            [],
            transitionsWithoutOffers
          );
        }).not.toThrow();
      });

      it('should not throw error when offers and transitions are in sync', () => {
        const transitions = [
          {
            transition: 'transition/make-offer',
            by: 'provider',
            createdAt: '2023-01-01T00:00:00.000Z',
          },
        ];

        const offers = [
          {
            transition: 'transition/make-offer',
            by: 'provider',
            offerInSubunits: 1000,
          },
        ];

        expect(() => {
          throwErrorIfNegotiationOfferHasInvalidHistory(
            'transition/make-offer',
            offers,
            transitions
          );
        }).not.toThrow();
      });
    });

    describe('invalid scenarios', () => {
      it('should throw error when offers array has different length than relevant transitions', () => {
        const incompleteOffers = [
          {
            transition: 'transition/make-offer',
            by: 'provider',
            offerInSubunits: 1000,
          },
        ];

        expect(() => {
          throwErrorIfNegotiationOfferHasInvalidHistory(
            'transition/make-offer',
            incompleteOffers,
            mockTransitions
          );
        }).toThrow('Past negotiation offers are invalid');
      });

      it('should throw error when offer transition does not match transition at same index', () => {
        const mismatchedOffers = [
          {
            transition: 'transition/make-offer',
            by: 'provider',
            offerInSubunits: 1000,
          },
          {
            transition: 'transition/provider-make-counter-offer', // Wrong transition
            by: 'customer',
            offerInSubunits: 800,
          },
          {
            transition: 'transition/provider-make-counter-offer',
            by: 'provider',
            offerInSubunits: 900,
          },
        ];

        expect(() => {
          throwErrorIfNegotiationOfferHasInvalidHistory(
            'transition/make-offer',
            mismatchedOffers,
            mockTransitions
          );
        }).toThrow('Past negotiation offers are invalid');
      });

      it('should throw error when offer actor does not match transition actor at same index', () => {
        const mismatchedActors = [
          {
            transition: 'transition/make-offer',
            by: 'provider',
            offerInSubunits: 1000,
          },
          {
            transition: 'transition/customer-make-counter-offer',
            by: 'provider', // Wrong actor
            offerInSubunits: 800,
          },
          {
            transition: 'transition/provider-make-counter-offer',
            by: 'provider',
            offerInSubunits: 900,
          },
        ];

        expect(() => {
          throwErrorIfNegotiationOfferHasInvalidHistory(
            'transition/make-offer',
            mismatchedActors,
            mockTransitions
          );
        }).toThrow('Past negotiation offers are invalid');
      });

      it('should throw error when offers are in wrong order', () => {
        const wrongOrderOffers = [
          {
            transition: 'transition/make-offer',
            by: 'provider',
            offerInSubunits: 1000,
          },
          {
            transition: 'transition/provider-make-counter-offer', // Wrong order
            by: 'provider',
            offerInSubunits: 900,
          },
          {
            transition: 'transition/customer-make-counter-offer', // Wrong order
            by: 'customer',
            offerInSubunits: 800,
          },
        ];

        expect(() => {
          throwErrorIfNegotiationOfferHasInvalidHistory(
            'transition/make-offer',
            wrongOrderOffers,
            mockTransitions
          );
        }).toThrow('Past negotiation offers are invalid');
      });

      it('should throw error with correct error properties', () => {
        const invalidOffers = [
          {
            transition: 'transition/make-offer',
            by: 'provider',
            offerInSubunits: 1000,
          },
        ];

        try {
          throwErrorIfNegotiationOfferHasInvalidHistory(
            'transition/make-offer',
            invalidOffers,
            mockTransitions
          );
        } catch (error) {
          expect(error.message).toBe('Past negotiation offers are invalid');
          expect(error.status).toBe(400);
          expect(error.statusText).toBe('Past negotiation offers are invalid');
          expect(error.data).toHaveProperty('offers');
          expect(error.data).toHaveProperty('relevantTransitions');
          expect(error.data.offers).toEqual(invalidOffers);
          expect(error.data.relevantTransitions).toHaveLength(3);
        }
      });
    });

    describe('edge cases', () => {
      it('should handle empty offers and transitions arrays', () => {
        expect(() => {
          throwErrorIfNegotiationOfferHasInvalidHistory('transition/make-offer', [], []);
        }).not.toThrow();
      });

      it('should handle offers with missing properties', () => {
        const invalidOffers = [
          {
            transition: 'transition/make-offer',
            // missing 'by' property
            offerInSubunits: 1000,
          },
        ];

        expect(() => {
          throwErrorIfNegotiationOfferHasInvalidHistory(
            'transition/make-offer',
            invalidOffers,
            mockTransitions
          );
        }).toThrow('Past negotiation offers are invalid');
      });

      it('should handle transitions with missing properties', () => {
        const invalidTransitions = [
          {
            transition: 'transition/make-offer',
            // missing 'by' property
            createdAt: '2023-01-01T00:00:00.000Z',
          },
        ];

        const offers = [
          {
            transition: 'transition/make-offer',
            by: 'provider',
            offerInSubunits: 1000,
          },
        ];

        expect(() => {
          throwErrorIfNegotiationOfferHasInvalidHistory(
            'transition/make-offer',
            offers,
            invalidTransitions
          );
        }).toThrow('Past negotiation offers are invalid');
      });

      it('should handle null and undefined values', () => {
        expect(() => {
          throwErrorIfNegotiationOfferHasInvalidHistory(
            'transition/make-offer',
            null,
            mockTransitions
          );
        }).toThrow('Past negotiation offers are invalid');

        expect(() => {
          throwErrorIfNegotiationOfferHasInvalidHistory(
            'transition/make-offer',
            undefined,
            mockTransitions
          );
        }).toThrow('Past negotiation offers are invalid');
      });
    });
  });

  describe('getAmountFromPreviousOffer(offers)', () => {
    const mockOffers = [
      {
        transition: 'transition/make-offer',
        by: 'provider',
        offerInSubunits: 1000,
      },
      {
        transition: 'transition/customer-make-counter-offer',
        by: 'customer',
        offerInSubunits: 800,
      },
    ];

    it('should return value from previous offer', () => {
      const offer = getAmountFromPreviousOffer(mockOffers);
      expect(offer).toBe(1000);
    });

    it('should throw error when offers array has less than 2 elements', () => {
      expect(() => {
        getAmountFromPreviousOffer([mockOffers[0]]);
      }).toThrow('Past negotiation offers are invalid');
    });
  });

  describe('addOfferToMetadata(metadata, offer)', () => {
    const mockOffer = {
      transition: 'transition/make-offer',
      by: 'provider',
      offerInSubunits: 1000,
    };

    describe('valid scenarios', () => {
      it('should add offer to existing offers array', () => {
        const metadata = {
          offers: [
            {
              transition: 'transition/customer-make-counter-offer',
              by: 'customer',
              offerInSubunits: 800,
            },
          ],
        };

        const result = addOfferToMetadata(metadata, mockOffer);
        expect(result.metadata.offers).toHaveLength(2);
        expect(result.metadata.offers[1]).toEqual(mockOffer);
      });

      it('should create offers array if it does not exist', () => {
        const metadata = {};

        const result = addOfferToMetadata(metadata, mockOffer);
        expect(result.metadata.offers).toHaveLength(1);
        expect(result.metadata.offers[0]).toEqual(mockOffer);
      });

      it('should preserve other metadata properties', () => {
        const metadata = {
          someOtherProperty: 'value',
          offers: [],
        };

        const result = addOfferToMetadata(metadata, mockOffer);
        expect(result.metadata.someOtherProperty).toBe('value');
        expect(result.metadata.offers).toHaveLength(1);
      });
    });

    describe('edge cases', () => {
      it('should return metadata unchanged when offer is null', () => {
        const metadata = { offers: [] };
        const result = addOfferToMetadata(metadata, null);
        expect(result).toEqual({ metadata });
      });

      it('should return metadata unchanged when offer is undefined', () => {
        const metadata = { offers: [] };
        const result = addOfferToMetadata(metadata, undefined);
        expect(result).toEqual({ metadata });
      });

      it('should return empty object when metadata is null', () => {
        const result = addOfferToMetadata(null, mockOffer);
        expect(result).toEqual({});
      });

      it('should return empty object when metadata is undefined', () => {
        const result = addOfferToMetadata(undefined, mockOffer);
        expect(result).toEqual({});
      });
    });
  });
});
