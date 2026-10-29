import {
  mergeLocalizationConfig,
  getMarketplaceCurrency,
  localizationConfig,
} from './localization';
import { applyConfigHandlers, configHandlers } from '../mergeConfig';

describe('localization config', () => {
  const defaults = { locale: 'en-US', firstDayOfWeek: 1 };
  const defaultCurrency = 'USD';

  describe('mergeLocalizationConfig', () => {
    it('uses hosted locale and firstDayOfWeek when present', () => {
      expect(
        mergeLocalizationConfig(
          { locale: 'fi-FI', firstDayOfWeek: 1, currency: 'EUR' },
          defaults,
          defaultCurrency
        )
      ).toEqual({ locale: 'fi-FI', firstDayOfWeek: 1, currency: 'EUR' });
    });

    it('maps Sunday (7) to 0 for DatePicker/moment', () => {
      expect(mergeLocalizationConfig({ firstDayOfWeek: 7 }, defaults, defaultCurrency)).toEqual({
        locale: 'en-US',
        firstDayOfWeek: 0,
        currency: 'USD',
      });
    });

    it('fills gaps from built-in defaults', () => {
      expect(mergeLocalizationConfig({}, defaults, defaultCurrency)).toEqual({
        locale: 'en-US',
        firstDayOfWeek: 1,
        currency: 'USD',
      });
    });
  });

  describe('getMarketplaceCurrency', () => {
    it('prefers localization.currency when supported', () => {
      expect(getMarketplaceCurrency({ currency: 'EUR' }, 'USD')).toBe('EUR');
    });

    it('falls back to default when currency missing', () => {
      expect(getMarketplaceCurrency({}, 'USD')).toBe('USD');
    });

    it('returns null if neither hosted nor default currency is supported', () => {
      expect(getMarketplaceCurrency({ currency: 'XYZ' }, 'BAD')).toBeNull();
    });
  });

  describe('localizationConfig contract', () => {
    it('declares localization id and asset key', () => {
      expect(localizationConfig.id).toBe('localization');
      expect(localizationConfig.assetKeys).toEqual(['localization']);
      expect(localizationConfig.mandatory).toBe(false);
    });

    it('normalizes locale, currency, and firstDayOfWeek', () => {
      expect(
        localizationConfig.normalize({
          localization: {
            locale: 'de-DE',
            currency: 'EUR',
            firstDayOfWeek: 1,
            extra: true,
          },
        })
      ).toEqual({ locale: 'de-DE', currency: 'EUR', firstDayOfWeek: 1 });
      expect(localizationConfig.normalize({})).toEqual({});
    });

    it('warns and drops invalid or unsupported currency', () => {
      const unsupported = localizationConfig.validate({ currency: 'XYZ' });
      expect(unsupported.value).toEqual({});
      expect(unsupported.issues.map(i => i.code)).toContain('LOCALIZATION_INVALID_CURRENCY');

      const empty = localizationConfig.validate({ currency: '' });
      expect(empty.value).toEqual({});
      expect(empty.issues.map(i => i.code)).toContain('LOCALIZATION_INVALID_CURRENCY');
    });

    it('is registered and resolves via applyConfigHandlers', () => {
      expect(configHandlers).toContain(localizationConfig);

      const { resolved, configIssues } = applyConfigHandlers({
        hosted: {
          localization: { locale: 'fi-FI', currency: 'EUR', firstDayOfWeek: 1 },
        },
        defaults: { localization: defaults, currency: defaultCurrency },
        handlers: [localizationConfig],
      });

      expect(resolved.localization).toEqual({
        locale: 'fi-FI',
        firstDayOfWeek: 1,
        currency: 'EUR',
      });
      expect(getMarketplaceCurrency(resolved.localization, defaultCurrency)).toBe('EUR');
      expect(configIssues).toEqual([]);
    });
  });
});
