import { filterSupportedCountriesByCurrency, stripeConfig } from './stripe';
import { buildAppConfig } from '../buildAppConfig';
import { configHandlers } from '../configRegistry';

const stripeDefaults = {
  publishableKey: 'pk_test_x',
  dayCountAvailableForBooking: 90,
  defaultMCC: '5734',
  supportedCountries: [
    { code: 'US', currency: 'USD', accountConfig: { routingNumber: true } },
    { code: 'XX', currency: 'NOT_A_CURRENCY', accountConfig: {} },
  ],
};

describe('stripe config', () => {
  describe('filterSupportedCountriesByCurrency', () => {
    it('keeps countries whose currency is in subUnitDivisors', () => {
      const { value, issues } = filterSupportedCountriesByCurrency(stripeDefaults);
      expect(value.supportedCountries).toEqual([
        { code: 'US', currency: 'USD', accountConfig: { routingNumber: true } },
      ]);
      expect(issues.map(i => i.code)).toEqual(['STRIPE_UNSUPPORTED_COUNTRY_CURRENCY']);
    });
  });

  describe('stripeConfig contract', () => {
    it('declares stripe id and empty assetKeys', () => {
      expect(stripeConfig.id).toBe('stripe');
      expect(stripeConfig.assetKeys).toEqual([]);
      expect(stripeConfig.mandatory).toBe(false);
    });

    it('normalizes to empty (no hosted asset)', () => {
      expect(stripeConfig.normalize({})).toEqual({});
    });

    it('is registered and resolves via buildAppConfig from defaults', () => {
      expect(configHandlers).toContain(stripeConfig);

      const { resolved, configIssues } = buildAppConfig({
        hosted: {},
        defaults: { stripe: stripeDefaults },
        handlers: [stripeConfig],
      });

      expect(resolved.stripe.publishableKey).toBe('pk_test_x');
      expect(resolved.stripe.dayCountAvailableForBooking).toBe(90);
      expect(resolved.stripe.supportedCountries).toEqual([
        { code: 'US', currency: 'USD', accountConfig: { routingNumber: true } },
      ]);
      expect(configIssues.map(i => i.code)).toContain('STRIPE_UNSUPPORTED_COUNTRY_CURRENCY');
    });
  });
});
