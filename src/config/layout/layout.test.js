import { mergeLayoutConfig, layoutConfig, parseAspectRatio, resolveVariantConfig } from './layout';
import { applyConfigHandlers, configHandlers } from '../mergeConfig';

describe('layout config', () => {
  const defaults = {
    searchPage: { variantType: 'map' },
    listingPage: { variantType: 'carousel' },
    listingImage: {
      variantType: 'cropImage',
      aspectRatio: '4/3',
      variantPrefix: 'listing-card',
    },
  };

  describe('helpers', () => {
    it('parses aspectRatio strings', () => {
      expect(parseAspectRatio('4/3')).toEqual({ aspectWidth: 4, aspectHeight: 3 });
      expect(parseAspectRatio('bad')).toBeNull();
      expect(parseAspectRatio(undefined)).toBeNull();
    });

    it('falls back when variantType is unsupported', () => {
      const { value, unsupported } = resolveVariantConfig({
        hostedVariant: { variantType: 'unknown' },
        defaultVariant: { variantType: 'map' },
        validVariantTypes: ['map', 'grid'],
        fallback: { variantType: 'grid' },
      });
      expect(unsupported).toBe(true);
      expect(value).toEqual({ variantType: 'grid' });
    });
  });

  describe('mergeLayoutConfig', () => {
    it('uses hosted search and listing page variants when valid', () => {
      expect(
        mergeLayoutConfig(
          {
            searchPage: { variantType: 'grid' },
            listingPage: { variantType: 'coverPhoto' },
          },
          defaults
        )
      ).toMatchObject({
        searchPage: { variantType: 'grid' },
        listingPage: { variantType: 'coverPhoto' },
      });
    });

    it('derives aspectWidth/aspectHeight for listingImage', () => {
      expect(
        mergeLayoutConfig(
          {
            listingImage: {
              variantType: 'cropImage',
              aspectRatio: '16/9',
            },
          },
          defaults
        ).listingImage
      ).toEqual({
        variantType: 'cropImage',
        aspectRatio: '16/9',
        aspectWidth: 16,
        aspectHeight: 9,
        variantPrefix: 'listing-card',
      });
    });

    it('uses built-in defaults when hosted layout is empty', () => {
      expect(mergeLayoutConfig({}, defaults)).toMatchObject({
        searchPage: { variantType: 'map' },
        listingPage: { variantType: 'carousel' },
        listingImage: {
          variantType: 'cropImage',
          aspectWidth: 4,
          aspectHeight: 3,
          variantPrefix: 'listing-card',
        },
      });
    });

    it('uses hard fallbacks when hosted and default variants are unsupported', () => {
      expect(
        mergeLayoutConfig(
          { searchPage: { variantType: 'nope' } },
          { searchPage: { variantType: 'also-nope' } }
        ).searchPage
      ).toEqual({ variantType: 'grid' });
    });
  });

  describe('layoutConfig contract', () => {
    it('declares app-config id and hosted asset keys', () => {
      expect(layoutConfig.id).toBe('layout');
      expect(layoutConfig.assetKeys).toEqual(['layout']);
      expect(layoutConfig.mandatory).toBe(false);
    });

    it('normalizes to known layout keys only', () => {
      expect(
        layoutConfig.normalize({
          layout: {
            searchPage: { variantType: 'grid' },
            extra: true,
          },
        })
      ).toEqual({ searchPage: { variantType: 'grid' } });
    });

    it('warns on unsupported searchPage variant', () => {
      const { value, issues } = layoutConfig.validate({
        searchPage: { variantType: 'nope' },
        listingPage: { variantType: 'carousel' },
        listingImage: { variantType: 'cropImage', aspectRatio: '4/3' },
      });
      expect(value.searchPage).toBeUndefined();
      expect(issues.map(i => i.code)).toContain('LAYOUT_UNSUPPORTED_SEARCH_PAGE');
    });

    it('warns when required layout blocks are missing', () => {
      const { issues } = layoutConfig.validate({
        searchPage: { variantType: 'grid' },
      });
      expect(issues.map(i => i.code)).toEqual([
        'LAYOUT_MISSING_LISTING_PAGE',
        'LAYOUT_MISSING_LISTING_IMAGE',
      ]);
    });

    it('resolves via applyConfigHandlers from registry', () => {
      const { resolved, configIssues } = applyConfigHandlers({
        hosted: {
          branding: { logo: { type: 'imageAsset', id: 'logo' }, favicon: { type: 'imageAsset' } },
          layout: {
            searchPage: { variantType: 'grid' },
            listingPage: { variantType: 'coverPhoto' },
            listingImage: { variantType: 'cropImage', aspectRatio: '4/3' },
          },
        },
        defaults: { layout: defaults },
        handlers: configHandlers,
      });
      expect(resolved.layout.searchPage.variantType).toBe('grid');
      expect(resolved.layout.listingPage.variantType).toBe('coverPhoto');
      expect(resolved.layout.listingImage.aspectWidth).toBe(4);
      expect(configIssues.filter(i => i.configId === 'layout')).toEqual([]);
    });
  });
});
