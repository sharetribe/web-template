import { footerConfig } from './footer';
import { buildAppConfig } from '../buildAppConfig';
import { configHandlers } from '../configRegistry';

describe('footer config', () => {
  describe('footerConfig contract', () => {
    it('declares footer id and asset key', () => {
      expect(footerConfig.id).toBe('footer');
      expect(footerConfig.assetKeys).toEqual(['footer']);
      expect(footerConfig.mandatory).toBe(false);
    });

    it('normalizes a hosted footer object as-is', () => {
      const hosted = {
        numberOfColumns: 2,
        slogan: { content: 'Hello' },
        blocks: [{ blockId: 'a', blockName: 'About', blockType: 'footerBlock' }],
      };
      expect(footerConfig.normalize({ footer: hosted })).toEqual(hosted);
      expect(footerConfig.normalize({})).toEqual({});
      expect(footerConfig.normalize({ footer: null })).toEqual({});
    });

    it('keeps a valid footer object through validate', () => {
      const hosted = { numberOfColumns: 1, copyright: { content: '©' } };
      const { value, issues } = footerConfig.validate(hosted);
      expect(value).toEqual(hosted);
      expect(issues).toEqual([]);
    });

    it('is registered and resolves via buildAppConfig', () => {
      expect(configHandlers).toContain(footerConfig);

      const hosted = {
        numberOfColumns: 3,
        socialMediaLinks: [{ fieldType: 'socialMediaLink', platform: 'facebook', url: 'https://fb.example' }],
      };

      const { resolved, configIssues } = buildAppConfig({
        hosted: { footer: hosted },
        defaults: {},
        handlers: [footerConfig],
      });

      expect(resolved.footer).toEqual(hosted);
      expect(configIssues).toEqual([]);
    });

    it('resolves to empty object when the hosted asset is missing', () => {
      const { resolved, configIssues } = buildAppConfig({
        hosted: {},
        defaults: {},
        handlers: [footerConfig],
      });

      expect(resolved.footer).toEqual({});
      expect(configIssues).toEqual([]);
    });
  });
});
