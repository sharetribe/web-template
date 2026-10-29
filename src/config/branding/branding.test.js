import {
  mergeBrandingConfig,
  brandingConfig,
  isValidHexColor,
  isValidLogoSettings,
  hexToCssHsl,
} from './branding';
import { applyConfigHandlers, configHandlers } from '../mergeConfig';

describe('branding config', () => {
  const defaults = {
    marketplaceColor: '#7c3aed',
    logoSettings: { format: 'image', height: 24 },
    logoImageDesktopURL: 'default-desktop.png',
    logoImageMobileURL: 'default-mobile.png',
    brandImageURL: 'default-brand.jpg',
    facebookImageURL: 'default-facebook.jpg',
    twitterImageURL: 'default-twitter.jpg',
  };

  describe('schema helpers', () => {
    it('accepts #RGB and #RRGGBB hex colors', () => {
      expect(isValidHexColor('#7c3aed')).toBe(true);
      expect(isValidHexColor('#fff')).toBe(true);
      expect(isValidHexColor('7c3aed')).toBe(false);
      expect(isValidHexColor('')).toBe(false);
    });

    it('accepts logoSettings with image format and known heights', () => {
      expect(isValidLogoSettings({ format: 'image', height: 24 })).toBe(true);
      expect(isValidLogoSettings({ format: 'image', height: 36 })).toBe(true);
      expect(isValidLogoSettings({ format: 'image', height: 48 })).toBe(true);
      expect(isValidLogoSettings({ format: 'image', height: 32 })).toBe(false);
      expect(isValidLogoSettings({ format: 'svg', height: 24 })).toBe(false);
    });

    it('derives darker and lighter hsl variants from hex', () => {
      expect(hexToCssHsl('#7c3aed', -10)).toMatch(/^hsl\(/);
      expect(hexToCssHsl('#7c3aed', 10)).toMatch(/^hsl\(/);
    });
  });

  describe('mergeBrandingConfig', () => {
    it('uses built-in marketplace color when hosted mainColor is absent', () => {
      const result = mergeBrandingConfig({}, defaults);
      expect(result.marketplaceColor).toBe('#7c3aed');
      expect(result.marketplaceColorDark).toMatch(/^hsl\(/);
      expect(result.marketplaceColorLight).toMatch(/^hsl\(/);
    });

    it('uses hosted marketplaceColors.mainColor when present', () => {
      expect(
        mergeBrandingConfig({ marketplaceColors: { mainColor: '#112233' } }, defaults)
          .marketplaceColor
      ).toBe('#112233');
    });

    it('falls back to built-in logos when hosted logo is absent', () => {
      const result = mergeBrandingConfig({}, defaults);
      expect(result.logoImageDesktop).toBe('default-desktop.png');
      expect(result.logoImageMobile).toBe('default-mobile.png');
    });

    it('uses hosted logo for both desktop and mobile images', () => {
      const logo = { type: 'imageAsset', id: 'logo' };
      const result = mergeBrandingConfig({ logo }, defaults);
      expect(result.logoImageDesktop).toBe(logo);
      expect(result.logoImageMobile).toBe(logo);
    });

    it('maps loginBackgroundImage to brandImage without built-in fallback', () => {
      expect(mergeBrandingConfig({}, defaults).brandImage).toBeUndefined();
      const bg = { type: 'imageAsset', id: 'bg' };
      expect(mergeBrandingConfig({ loginBackgroundImage: bg }, defaults).brandImage).toBe(bg);
    });

    it('uses social sharing image variants when present', () => {
      const socialSharingImage = {
        type: 'imageAsset',
        attributes: {
          variants: {
            scaled1200: { url: 'hosted-facebook.jpg' },
            scaled600: { url: 'hosted-twitter.jpg' },
          },
        },
      };
      const result = mergeBrandingConfig({ socialSharingImage }, defaults);
      expect(result.facebookImage).toBe('hosted-facebook.jpg');
      expect(result.twitterImage).toBe('hosted-twitter.jpg');
    });

    it('falls back to default logoSettings when hosted settings are invalid', () => {
      expect(
        mergeBrandingConfig({ logoSettings: { format: 'image', height: 99 } }, defaults)
          .logoSettings
      ).toEqual({ format: 'image', height: 24 });
    });
  });

  describe('brandingConfig contract', () => {
    it('declares app-config id and hosted asset keys', () => {
      expect(brandingConfig.id).toBe('branding');
      expect(brandingConfig.assetKeys).toEqual(['branding']);
      expect(brandingConfig.mandatory).toBe(true);
    });

    it('normalizes missing or non-object branding asset to empty object', () => {
      expect(brandingConfig.normalize({})).toEqual({});
      expect(brandingConfig.normalize({ branding: undefined })).toEqual({});
      expect(brandingConfig.normalize({ branding: 'nope' })).toEqual({});
    });

    it('keeps known branding fields from the hosted asset', () => {
      expect(
        brandingConfig.normalize({
          branding: {
            marketplaceColors: {
              mainColor: '#112233',
              notificationPrimaryButton: '#6938EF',
            },
            logoSettings: { format: 'image', height: 36 },
            favicon: { type: 'imageAsset', id: 'favicon' },
            extra: true,
          },
        })
      ).toEqual({
        marketplaceColors: { mainColor: '#112233' },
        logoSettings: { format: 'image', height: 36 },
        favicon: { type: 'imageAsset', id: 'favicon' },
      });
    });

    it('emits error when hosted logo is missing', () => {
      const { value, issues } = brandingConfig.validate({
        marketplaceColors: { mainColor: '#112233' },
      });
      expect(value.logo).toBeUndefined();
      expect(issues[0]).toMatchObject({
        level: 'error',
        code: 'BRANDING_MISSING_LOGO',
      });
    });

    it('keeps valid hosted logo without mandatory error', () => {
      const logo = { type: 'imageAsset', id: 'logo' };
      const favicon = { type: 'imageAsset', id: 'favicon' };
      const { issues } = brandingConfig.validate({ logo, favicon });
      expect(issues.filter(i => i.level === 'error')).toEqual([]);
    });

    it('warns when favicon is missing without failing mandatory checks', () => {
      const { issues } = brandingConfig.validate({
        logo: { type: 'imageAsset', id: 'logo' },
      });
      expect(issues.filter(i => i.level === 'error')).toEqual([]);
      expect(issues).toContainEqual(
        expect.objectContaining({
          level: 'warn',
          code: 'BRANDING_MISSING_FAVICON',
        })
      );
    });

    it('warns and drops invalid favicon', () => {
      const { value, issues } = brandingConfig.validate({
        logo: { type: 'imageAsset', id: 'logo' },
        favicon: { type: 'notAnImage' },
      });
      expect(value.favicon).toBeUndefined();
      expect(issues.map(i => i.code)).toContain('BRANDING_INVALID_FAVICON');
    });

    it('drops invalid mainColor', () => {
      const { value, issues } = brandingConfig.validate({
        logo: { type: 'imageAsset' },
        marketplaceColors: { mainColor: 'not-a-color' },
      });
      expect(value.marketplaceColors).toBeUndefined();
      expect(issues.map(i => i.code)).toContain('BRANDING_INVALID_MAIN_COLOR');
    });

    it('drops invalid logoSettings', () => {
      const { value, issues } = brandingConfig.validate({
        logo: { type: 'imageAsset' },
        logoSettings: { format: 'image', height: 99 },
      });
      expect(value.logoSettings).toBeUndefined();
      expect(issues.map(i => i.code)).toContain('BRANDING_INVALID_LOGO_SETTINGS');
    });

    it('resolves via applyConfigHandlers from registry', () => {
      const { resolved, configIssues } = applyConfigHandlers({
        hosted: {
          branding: {
            logo: { type: 'imageAsset', id: 'logo' },
            marketplaceColors: { mainColor: '#112233' },
          },
        },
        defaults: { branding: defaults },
        handlers: configHandlers,
      });
      expect(resolved.branding.marketplaceColor).toBe('#112233');
      expect(resolved.branding.logoImageDesktop).toEqual({ type: 'imageAsset', id: 'logo' });
      expect(configIssues.filter(i => i.configId === 'branding' && i.level === 'error')).toEqual(
        []
      );
    });

    it('falls back to built-in color when hosted mainColor is invalid', () => {
      const { resolved, configIssues } = applyConfigHandlers({
        hosted: {
          branding: {
            logo: { type: 'imageAsset', id: 'logo' },
            marketplaceColors: { mainColor: 'bad' },
          },
        },
        defaults: { branding: defaults },
        handlers: configHandlers,
      });
      expect(resolved.branding.marketplaceColor).toBe('#7c3aed');
      expect(configIssues.map(i => i.code)).toContain('BRANDING_INVALID_MAIN_COLOR');
    });

    it('reports missing logo as an error through applyConfigHandlers', () => {
      const { configIssues } = applyConfigHandlers({
        hosted: {
          branding: { marketplaceColors: { mainColor: '#112233' } },
        },
        defaults: { branding: defaults },
        handlers: configHandlers,
      });
      expect(
        configIssues.some(i => i.code === 'BRANDING_MISSING_LOGO' && i.level === 'error')
      ).toBe(true);
    });
  });
});
