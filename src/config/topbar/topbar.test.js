import { topbarConfig } from './topbar';
import { applyConfigHandlers, configHandlers } from '../mergeConfig';

describe('topbar config', () => {
  describe('topbarConfig contract', () => {
    it('declares topbar id and asset key', () => {
      expect(topbarConfig.id).toBe('topbar');
      expect(topbarConfig.assetKeys).toEqual(['topbar']);
      expect(topbarConfig.mandatory).toBe(false);
    });

    it('normalizes known topbar keys only', () => {
      expect(
        topbarConfig.normalize({
          topbar: {
            logoLink: { href: 'https://example.com' },
            customLinks: [{ type: 'internal', text: 'About', href: '/about', group: 'primary' }],
            searchBar: { display: 'always' },
            postListingsLink: { showToUnauthenticatedUsers: false },
            extra: true,
          },
        })
      ).toEqual({
        logoLink: { href: 'https://example.com' },
        customLinks: [{ type: 'internal', text: 'About', href: '/about', group: 'primary' }],
        searchBar: { display: 'always' },
        postListingsLink: { showToUnauthenticatedUsers: false },
      });
      expect(topbarConfig.normalize({})).toEqual({});
    });

    it('warns and drops invalid custom links and search display', () => {
      const { value, issues } = topbarConfig.validate({
        customLinks: [
          { type: 'internal', text: 'About', href: '/about', group: 'primary' },
          { type: 'internal', text: 'Broken' },
          { type: 'link', text: 'Nope', href: '/x' },
        ],
        searchBar: { display: 'sometimes' },
        logoLink: { href: '' },
      });

      expect(value).toEqual({
        customLinks: [{ type: 'internal', text: 'About', href: '/about', group: 'primary' }],
      });
      expect(issues.map(i => i.code)).toEqual(
        expect.arrayContaining(['TOPBAR_INVALID_CUSTOM_LINK', 'TOPBAR_INVALID_SEARCH_BAR'])
      );
    });

    it('is registered and resolves via applyConfigHandlers', () => {
      expect(configHandlers).toContain(topbarConfig);

      const hosted = {
        logoLink: { href: 'https://example.com' },
        customLinks: [{ type: 'external', text: 'Blog', href: 'https://blog.example.com' }],
        searchBar: { display: 'notLandingPage' },
        postListingsLink: { showToUnauthenticatedUsers: true },
      };

      const { resolved, configIssues } = applyConfigHandlers({
        hosted: { topbar: hosted },
        defaults: {},
        handlers: [topbarConfig],
      });

      expect(resolved.topbar).toEqual(hosted);
      expect(configIssues).toEqual([]);
    });
  });
});
