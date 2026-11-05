import {
  categoryConfigurationConfig,
  getBuiltInCategorySpecs,
  sanitizeCategoryTree,
  isValidCategoryId,
  isValidCategoryName,
} from './categoryConfiguration';
import { applyConfigHandlers, configHandlers } from '../mergeConfig';

describe('categoryConfiguration config', () => {
  const sampleTree = [
    {
      name: 'Cats',
      id: 'cats',
      subcategories: [
        { name: 'Burmese', id: 'burmese', subcategories: [] },
        { name: 'Egyptian Mau', id: 'egyptian-mau' },
      ],
    },
  ];

  describe('helpers', () => {
    it('validates category id pattern', () => {
      expect(isValidCategoryId('cats')).toBe(true);
      expect(isValidCategoryId('egyptian-mau')).toBe(true);
      expect(isValidCategoryId('Level_1')).toBe(true);
      expect(isValidCategoryId('bad id')).toBe(false);
      expect(isValidCategoryId('bad/id')).toBe(false);
      expect(isValidCategoryId('')).toBe(false);
      expect(isValidCategoryId(undefined)).toBe(false);
    });

    it('requires a non-empty category name', () => {
      expect(isValidCategoryName('Cats')).toBe(true);
      expect(isValidCategoryName('  Dogs  ')).toBe(true);
      expect(isValidCategoryName('')).toBe(false);
      expect(isValidCategoryName('   ')).toBe(false);
      expect(isValidCategoryName(undefined)).toBe(false);
    });
    it('sanitizes category trees to known fields', () => {
      expect(
        sanitizeCategoryTree([
          {
            name: 'Dogs',
            id: 'dogs',
            extra: true,
            subcategories: [{ name: 'Poodle', id: 'poodle', other: 1 }],
          },
        ])
      ).toEqual([
        {
          name: 'Dogs',
          id: 'dogs',
          subcategories: [{ name: 'Poodle', id: 'poodle', subcategories: [] }],
        },
      ]);
    });

    it('derives categoryLevelKeys from tree depth', () => {
      expect(getBuiltInCategorySpecs(sampleTree)).toEqual({
        key: 'categoryLevel',
        scope: 'public',
        categoryLevelKeys: ['categoryLevel1', 'categoryLevel2'],
        categories: sampleTree,
      });
    });

    it('returns empty categoryLevelKeys for an empty tree', () => {
      expect(getBuiltInCategorySpecs([])).toEqual({
        key: 'categoryLevel',
        scope: 'public',
        categoryLevelKeys: [],
        categories: [],
      });
    });
  });

  describe('categoryConfigurationConfig contract', () => {
    it('declares app-config id and hosted asset keys', () => {
      expect(categoryConfigurationConfig.id).toBe('categoryConfiguration');
      expect(categoryConfigurationConfig.assetKeys).toEqual(['categories']);
    });

    it('normalizes hosted categories array only', () => {
      expect(
        categoryConfigurationConfig.normalize({
          categories: { categories: sampleTree, extra: true },
        })
      ).toEqual({ categories: sampleTree });
      expect(categoryConfigurationConfig.normalize({ categories: null })).toEqual({});
      expect(categoryConfigurationConfig.normalize({})).toEqual({});
    });

    it('validates by sanitizing the hosted tree', () => {
      const { value, issues } = categoryConfigurationConfig.validate({
        categories: [{ name: 'A', id: 'a', noise: true, subcategories: null }],
      });
      expect(issues).toEqual([]);
      expect(value.categories).toEqual([{ name: 'A', id: 'a', subcategories: [] }]);
    });

    it('warns when hosted category tree is deeper than 3 levels', () => {
      const deepTree = [
        {
          name: 'L1',
          id: 'l1',
          subcategories: [
            {
              name: 'L2',
              id: 'l2',
              subcategories: [
                {
                  name: 'L3',
                  id: 'l3',
                  subcategories: [{ name: 'L4', id: 'l4', subcategories: [] }],
                },
              ],
            },
          ],
        },
      ];
      const { value, issues } = categoryConfigurationConfig.validate({ categories: deepTree });
      expect(value.categories).toEqual(deepTree);
      expect(issues.map(i => i.code)).toEqual(['CATEGORY_TREE_TOO_DEEP']);
      expect(issues[0].level).toBe('warn');
    });

    it('warns and drops categories with invalid ids', () => {
      const { value, issues } = categoryConfigurationConfig.validate({
        categories: [
          { name: 'Good', id: 'good', subcategories: [] },
          { name: 'Bad', id: 'bad id', subcategories: [{ name: 'Child', id: 'child' }] },
          {
            name: 'Also good',
            id: 'also-good',
            subcategories: [{ name: 'Nested bad', id: 'nested bad', subcategories: [] }],
          },
        ],
      });
      expect(value.categories).toEqual([
        { name: 'Good', id: 'good', subcategories: [] },
        { name: 'Also good', id: 'also-good', subcategories: [] },
      ]);
      expect(issues.map(i => i.code)).toEqual(['CATEGORY_INVALID_ID', 'CATEGORY_INVALID_ID']);
    });

    it('warns and drops categories with missing or empty names', () => {
      const { value, issues } = categoryConfigurationConfig.validate({
        categories: [
          { name: 'Good', id: 'good', subcategories: [] },
          { name: '', id: 'empty-name', subcategories: [] },
          { id: 'missing-name', subcategories: [] },
          {
            name: 'Parent',
            id: 'parent',
            subcategories: [{ name: '   ', id: 'blank-name', subcategories: [] }],
          },
        ],
      });
      expect(value.categories).toEqual([
        { name: 'Good', id: 'good', subcategories: [] },
        { name: 'Parent', id: 'parent', subcategories: [] },
      ]);
      expect(issues.map(i => i.code)).toEqual([
        'CATEGORY_MISSING_OR_EMPTY_NAME',
        'CATEGORY_MISSING_OR_EMPTY_NAME',
        'CATEGORY_MISSING_OR_EMPTY_NAME',
      ]);
    });

    it('warns and drops duplicate ids among siblings (keeps first)', () => {
      const { value, issues } = categoryConfigurationConfig.validate({
        categories: [
          { name: 'First', id: 'dup', subcategories: [] },
          { name: 'Second', id: 'dup', subcategories: [{ name: 'Child', id: 'child' }] },
          { name: 'Unique', id: 'unique', subcategories: [] },
          {
            name: 'Parent',
            id: 'parent',
            subcategories: [
              { name: 'Nested first', id: 'nested-dup', subcategories: [] },
              { name: 'Nested second', id: 'nested-dup', subcategories: [] },
              // Same id as a root sibling is allowed under a different parent
              { name: 'Reused under parent', id: 'unique', subcategories: [] },
            ],
          },
        ],
      });
      expect(value.categories).toEqual([
        { name: 'First', id: 'dup', subcategories: [] },
        { name: 'Unique', id: 'unique', subcategories: [] },
        {
          name: 'Parent',
          id: 'parent',
          subcategories: [
            { name: 'Nested first', id: 'nested-dup', subcategories: [] },
            { name: 'Reused under parent', id: 'unique', subcategories: [] },
          ],
        },
      ]);
      expect(issues.map(i => i.code)).toEqual([
        'CATEGORY_DUPLICATE_SIBLING_ID',
        'CATEGORY_DUPLICATE_SIBLING_ID',
      ]);
    });

    it('resolves via applyConfigHandlers from registry using hosted categories', () => {
      const { resolved, configIssues } = applyConfigHandlers({
        hosted: {
          branding: { logo: { type: 'imageAsset', id: 'logo' }, favicon: { type: 'imageAsset' } },
          categories: { categories: sampleTree },
        },
        defaults: { categoryConfiguration: { categories: [] } },
        handlers: configHandlers,
      });
      expect(resolved.categoryConfiguration.key).toBe('categoryLevel');
      expect(resolved.categoryConfiguration.categoryLevelKeys).toEqual([
        'categoryLevel1',
        'categoryLevel2',
      ]);
      expect(resolved.categoryConfiguration.categories[0].id).toBe('cats');
      expect(configIssues.filter(i => i.configId === 'categoryConfiguration')).toEqual([]);
    });

    it('falls back to built-in categories when hosted categories are omitted', () => {
      const builtIn = [{ name: 'Built-in', id: 'built-in', subcategories: [] }];
      const { resolved } = applyConfigHandlers({
        hosted: {
          branding: { logo: { type: 'imageAsset', id: 'logo' }, favicon: { type: 'imageAsset' } },
        },
        defaults: { categoryConfiguration: { categories: builtIn } },
        handlers: configHandlers,
      });
      expect(resolved.categoryConfiguration.categories).toEqual(builtIn);
      expect(resolved.categoryConfiguration.categoryLevelKeys).toEqual(['categoryLevel1']);
    });

    it('keeps an explicit empty hosted categories array (does not use built-ins)', () => {
      const { resolved } = applyConfigHandlers({
        hosted: {
          branding: { logo: { type: 'imageAsset', id: 'logo' }, favicon: { type: 'imageAsset' } },
          categories: { categories: [] },
        },
        defaults: {
          categoryConfiguration: {
            categories: [{ name: 'Built-in', id: 'built-in', subcategories: [] }],
          },
        },
        handlers: configHandlers,
      });
      expect(resolved.categoryConfiguration.categories).toEqual([]);
      expect(resolved.categoryConfiguration.categoryLevelKeys).toEqual([]);
    });
  });
});
