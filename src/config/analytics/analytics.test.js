import {
  mergeAnalyticsConfig,
  analyticsConfig,
  isValidGoogleAnalyticsMeasurementId,
  isValidPlausibleDomain,
} from './analytics';
import { applyConfigHandlers, configHandlers } from '../mergeConfig';

describe('analytics config', () => {
  const defaults = {
    googleAnalyticsId: 'G-DEFAULT',
    plausibleDomains: 'built-in.example',
  };

  describe('schema helpers', () => {
    it('accepts GA4 measurement ids', () => {
      expect(isValidGoogleAnalyticsMeasurementId('G-GS62BP8F1L')).toBe(true);
      expect(isValidGoogleAnalyticsMeasurementId('UA-123')).toBe(false);
      expect(isValidGoogleAnalyticsMeasurementId('')).toBe(false);
    });

    it('rejects Plausible domains with http(s) protocol', () => {
      expect(isValidPlausibleDomain('example.com')).toBe(true);
      expect(isValidPlausibleDomain('https://example.com')).toBe(false);
      expect(isValidPlausibleDomain('http://example.com')).toBe(false);
      expect(isValidPlausibleDomain('')).toBe(false);
    });
  });

  describe('mergeAnalyticsConfig', () => {
    it('uses default Google Analytics id when hosted GA is disabled', () => {
      expect(
        mergeAnalyticsConfig(
          { googleAnalytics: { enabled: false, measurementId: 'G-HOSTED' } },
          defaults
        )
      ).toEqual({
        googleAnalyticsId: 'G-DEFAULT',
        plausibleDomains: 'built-in.example',
      });
    });

    it('uses hosted Google Analytics id when enabled', () => {
      expect(
        mergeAnalyticsConfig(
          { googleAnalytics: { enabled: true, measurementId: 'G-HOSTED' } },
          defaults
        ).googleAnalyticsId
      ).toBe('G-HOSTED');
    });

    it('does not treat invalid measurement id as hosted win', () => {
      expect(
        mergeAnalyticsConfig(
          { googleAnalytics: { enabled: true, measurementId: 'UA-LEGACY' } },
          defaults
        ).googleAnalyticsId
      ).toBe('G-DEFAULT');
    });

    it('merges Plausible hosted domain with built-in domains', () => {
      expect(
        mergeAnalyticsConfig({ plausible: { enabled: true, domain: 'hosted.example' } }, defaults)
          .plausibleDomains
      ).toBe('hosted.example,built-in.example');
    });

    it('omits plausibleDomains when neither source has domains', () => {
      expect(mergeAnalyticsConfig({}, { googleAnalyticsId: 'G-DEFAULT' })).toEqual({
        googleAnalyticsId: 'G-DEFAULT',
      });
    });
  });

  describe('analyticsConfig contract', () => {
    it('declares app-config id and hosted asset keys', () => {
      expect(analyticsConfig.id).toBe('analytics');
      expect(analyticsConfig.assetKeys).toEqual(['analytics']);
    });

    it('normalizes missing or non-object analytics asset to empty object', () => {
      expect(analyticsConfig.normalize({})).toEqual({});
      expect(analyticsConfig.normalize({ analytics: undefined })).toEqual({});
      expect(analyticsConfig.normalize({ analytics: 'nope' })).toEqual({});
    });

    it('strips unknown top-level keys and non-object providers', () => {
      expect(
        analyticsConfig.normalize({
          analytics: {
            googleAnalytics: { enabled: true, measurementId: 'G-HOSTED' },
            plausible: 'bad',
            extra: true,
          },
        })
      ).toEqual({
        googleAnalytics: { enabled: true, measurementId: 'G-HOSTED' },
      });
    });

    it('drops invalid GA when enabled without a valid measurementId', () => {
      const { value, issues } = analyticsConfig.validate({
        googleAnalytics: { enabled: true, measurementId: 'not-ga4' },
      });
      expect(value.googleAnalytics).toBeUndefined();
      expect(issues[0].code).toBe('GA_INVALID_OR_MISSING_MEASUREMENT_ID');
    });

    it('drops invalid Plausible when enabled with http domain', () => {
      const { value, issues } = analyticsConfig.validate({
        plausible: { enabled: true, domain: 'https://example.com' },
      });
      expect(value.plausible).toBeUndefined();
      expect(issues[0].code).toBe('PLAUSIBLE_INVALID_OR_MISSING_DOMAIN');
    });

    it('keeps valid hosted providers', () => {
      const { value, issues } = analyticsConfig.validate({
        googleAnalytics: { enabled: true, measurementId: 'G-HOSTED' },
        plausible: { enabled: true, domain: ' example.com ' },
      });
      expect(issues).toEqual([]);
      expect(value).toEqual({
        googleAnalytics: { enabled: true, measurementId: 'G-HOSTED' },
        plausible: { enabled: true, domain: 'example.com' },
      });
    });

    it('resolves via applyConfigHandlers from registry', () => {
      const { resolved, configIssues } = applyConfigHandlers({
        hosted: {
          analytics: { googleAnalytics: { enabled: true, measurementId: 'G-HOSTED' } },
          branding: { logo: { type: 'imageAsset', id: 'logo' } },
        },
        defaults: { analytics: defaults },
        handlers: configHandlers,
      });
      expect(resolved.analytics).toEqual({
        googleAnalyticsId: 'G-HOSTED',
        plausibleDomains: 'built-in.example',
      });
      expect(configIssues.filter(i => i.configId === 'analytics')).toEqual([]);
    });

    it('falls back to built-in when hosted GA id is invalid', () => {
      const { resolved, configIssues } = applyConfigHandlers({
        hosted: {
          analytics: { googleAnalytics: { enabled: true, measurementId: 'UA-123' } },
          branding: { logo: { type: 'imageAsset', id: 'logo' } },
        },
        defaults: { analytics: defaults },
        handlers: configHandlers,
      });
      expect(resolved.analytics.googleAnalyticsId).toBe('G-DEFAULT');
      expect(configIssues.filter(i => i.configId === 'analytics')).toHaveLength(1);
    });
  });
});
