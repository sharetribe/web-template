import { filterSupportedCountriesByCurrency, stripeConfig } from './stripe';
import { applyConfigHandlers, configHandlers } from '../mergeConfig';

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

    it('validate does not apply built-ins', () => {
      const { value, issues } = stripeConfig.validate({}, { defaults: { stripe: stripeDefaults } });
      expect(value).toEqual({});
      expect(issues).toEqual([]);
    });

    it('resolve filters defaults and pushes currency warns onto ctx.issues', () => {
      const issues = [];
      const resolved = stripeConfig.resolve({}, { stripe: stripeDefaults }, { issues });
      expect(resolved.publishableKey).toBe('pk_test_x');
      expect(resolved.supportedCountries).toEqual([
        { code: 'US', currency: 'USD', accountConfig: { routingNumber: true } },
      ]);
      expect(issues.map(i => i.code)).toEqual(['STRIPE_UNSUPPORTED_COUNTRY_CURRENCY']);
    });

    it('is registered and resolves via applyConfigHandlers from defaults', () => {
      expect(configHandlers).toContain(stripeConfig);

      const { resolved, configIssues } = applyConfigHandlers({
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
