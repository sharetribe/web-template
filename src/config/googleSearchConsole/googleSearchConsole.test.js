import { mergeGoogleSearchConsoleConfig, googleSearchConsoleConfig } from './googleSearchConsole';
import { applyConfigHandlers, configHandlers } from '../mergeConfig';

describe('googleSearchConsole config', () => {
  const defaults = { googleSiteVerification: null };

  describe('mergeGoogleSearchConsoleConfig', () => {
    it('uses hosted token when non-empty', () => {
      expect(
        mergeGoogleSearchConsoleConfig({ googleSiteVerification: 'token-hosted' }, defaults)
      ).toEqual({ googleSiteVerification: 'token-hosted' });
    });

    it('falls back to built-in when hosted token is missing or empty', () => {
      expect(mergeGoogleSearchConsoleConfig({}, defaults)).toEqual({
        googleSiteVerification: null,
      });
      expect(mergeGoogleSearchConsoleConfig({ googleSiteVerification: '' }, defaults)).toEqual({
        googleSiteVerification: null,
      });
      expect(
        mergeGoogleSearchConsoleConfig({}, { googleSiteVerification: 'token-default' })
      ).toEqual({ googleSiteVerification: 'token-default' });
    });
  });

  describe('googleSearchConsoleConfig contract', () => {
    it('declares googleSearchConsole id and asset key', () => {
      expect(googleSearchConsoleConfig.id).toBe('googleSearchConsole');
      expect(googleSearchConsoleConfig.assetKeys).toEqual(['googleSearchConsole']);
    });

    it('normalizes googleSiteVerification string only', () => {
      expect(
        googleSearchConsoleConfig.normalize({
          googleSearchConsole: { googleSiteVerification: 'abc', extra: true },
        })
      ).toEqual({ googleSiteVerification: 'abc' });
      expect(googleSearchConsoleConfig.normalize({})).toEqual({});
      expect(
        googleSearchConsoleConfig.normalize({
          googleSearchConsole: { googleSiteVerification: 123 },
        })
      ).toEqual({});
    });

    it('treats empty verification token as unset (no warn)', () => {
      const { value, issues } = googleSearchConsoleConfig.validate({
        googleSiteVerification: '',
      });
      expect(value).toEqual({});
      expect(issues).toEqual([]);
    });

    it('warns when the token contains whitespace', () => {
      const { value, issues } = googleSearchConsoleConfig.validate({
        googleSiteVerification: 'bad token',
      });
      expect(value).toEqual({});
      expect(issues.map(i => i.code)).toContain('GSC_INVALID_SITE_VERIFICATION');
    });

    it('is registered and resolves via applyConfigHandlers', () => {
      expect(configHandlers).toContain(googleSearchConsoleConfig);

      const { resolved, configIssues } = applyConfigHandlers({
        hosted: {
          googleSearchConsole: { googleSiteVerification: 'token-hosted' },
        },
        defaults: { googleSearchConsole: defaults },
        handlers: [googleSearchConsoleConfig],
      });

      expect(resolved.googleSearchConsole).toEqual({
        googleSiteVerification: 'token-hosted',
      });
      expect(configIssues).toEqual([]);
    });
  });
});
