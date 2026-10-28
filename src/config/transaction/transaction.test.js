import { getListingMinimumPriceSubUnits, transactionConfig } from './transaction';
import { buildAppConfig } from '../buildAppConfig';
import { configHandlers } from '../configRegistry';

describe('transaction config', () => {
  describe('getListingMinimumPriceSubUnits', () => {
    it('uses hosted subunit amount when positive', () => {
      expect(
        getListingMinimumPriceSubUnits(
          { listingMinimumPrice: { type: 'subunit', amount: 1000 } },
          500
        )
      ).toBe(1000);
    });

    it('falls back to default when amount is 0 or missing', () => {
      expect(
        getListingMinimumPriceSubUnits({ listingMinimumPrice: { type: 'subunit', amount: 0 } }, 500)
      ).toBe(500);
      expect(getListingMinimumPriceSubUnits({}, 500)).toBe(500);
      expect(getListingMinimumPriceSubUnits(undefined, 500)).toBe(500);
    });
  });

  describe('transactionConfig contract', () => {
    it('declares transaction id and minimumTransactionSize asset key', () => {
      expect(transactionConfig.id).toBe('transaction');
      expect(transactionConfig.assetKeys).toEqual(['minimumTransactionSize']);
      expect(transactionConfig.mandatory).toBe(true);
    });

    it('normalizes listingMinimumPrice from minimumTransactionSize', () => {
      expect(
        transactionConfig.normalize({
          minimumTransactionSize: {
            listingMinimumPrice: { type: 'subunit', amount: 750 },
            extra: true,
          },
        })
      ).toEqual({
        listingMinimumPrice: { type: 'subunit', amount: 750 },
      });
      expect(transactionConfig.normalize({})).toEqual({});
      expect(transactionConfig.normalize({ minimumTransactionSize: null })).toEqual({});
    });

    it('errors when listingMinimumPrice is missing or invalid', () => {
      const missing = transactionConfig.validate({});
      expect(missing.value).toEqual({});
      expect(missing.issues.map(i => i.code)).toEqual([
        'TRANSACTION_INVALID_LISTING_MINIMUM_PRICE',
      ]);
      expect(missing.issues[0].level).toBe('error');

      const invalid = transactionConfig.validate({
        listingMinimumPrice: { type: 'currency', amount: 10 },
      });
      expect(invalid.value).toEqual({});
      expect(invalid.issues.map(i => i.code)).toEqual([
        'TRANSACTION_INVALID_LISTING_MINIMUM_PRICE',
      ]);
    });

    it('keeps valid listingMinimumPrice including amount 0', () => {
      const { value, issues } = transactionConfig.validate({
        listingMinimumPrice: { type: 'subunit', amount: 0 },
      });
      expect(issues).toEqual([]);
      expect(value.listingMinimumPrice).toEqual({ type: 'subunit', amount: 0 });
    });

    it('is registered and resolves listingMinimumPrice onto config.transaction', () => {
      expect(configHandlers).toContain(transactionConfig);

      const { resolved, configIssues } = buildAppConfig({
        hosted: {
          minimumTransactionSize: {
            listingMinimumPrice: { type: 'subunit', amount: 900 },
          },
        },
        defaults: { listingMinimumPriceSubUnits: 500 },
        handlers: [transactionConfig],
      });

      expect(resolved.transaction).toEqual({
        listingMinimumPrice: { type: 'subunit', amount: 900 },
      });
      expect(configIssues).toEqual([]);
      expect(getListingMinimumPriceSubUnits(resolved.transaction, 500)).toBe(900);
    });
  });
});
