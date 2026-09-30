import {
  searchConfig,
  mergeSearchConfig,
  mergeSortConfig,
  getSortOptionsFromListingFields,
} from './search';
import { buildAppConfig } from '../buildAppConfig';
import { configHandlers } from '../configRegistry';

describe('search config', () => {
  const defaultSortConfig = {
    active: true,
    queryParamName: 'sort',
    relevanceKey: 'relevance',
    relevanceFilter: 'keywords',
    conflictingFilters: [],
    options: [
      { key: 'createdAt', labelTranslationKey: 'SortBy.newest' },
      { key: '-createdAt', labelTranslationKey: 'SortBy.oldest' },
      { key: '-price', labelTranslationKey: 'SortBy.lowestPrice' },
      { key: 'price', labelTranslationKey: 'SortBy.highestPrice' },
      { key: 'relevance', labelTranslationKey: 'SortBy.relevance' },
    ],
  };

  const defaultSearchConfig = {
    mainSearch: { searchType: 'location' },
    listingTypeFilter: { enabled: false, schemaType: 'listingType' },
    categoryFilter: { enabled: false, schemaType: 'category' },
    dateRangeFilter: {
      schemaType: 'dates',
      availability: 'time-full',
      dateRangeMode: 'day',
    },
    priceFilter: { schemaType: 'price', min: 0, max: 1000, step: 5 },
    sortConfig: defaultSortConfig,
  };

  const emptyCategories = {
    key: 'categoryLevel',
    scope: 'public',
    categoryLevelKeys: [],
    categories: [],
  };

  describe('helpers', () => {
    it('builds sort options from numeric listing fields with showSorting', () => {
      const { primaryOptions, secondaryOptions } = getSortOptionsFromListingFields([
        {
          key: 'capacity',
          scope: 'public',
          schemaType: 'long',
          filterConfig: {
            showSorting: true,
            label: 'Capacity',
            sortingOrder: { asc: true, desc: true },
            sortingGroup: 'primary',
          },
        },
        {
          key: 'rating',
          scope: 'metadata',
          schemaType: 'long',
          filterConfig: {
            showSorting: true,
            label: 'Rating',
            sortingOrder: { desc: true },
            sortingGroup: 'secondary',
          },
        },
        {
          key: 'bikeType',
          scope: 'public',
          schemaType: 'enum',
          filterConfig: { showSorting: true },
        },
      ]);
      expect(primaryOptions.map(o => o.key)).toEqual(['-pub_capacity', 'pub_capacity']);
      expect(secondaryOptions.map(o => o.key)).toEqual(['meta_rating']);
    });

    it('guards getSortOptionsFromListingFields when listingFields is missing', () => {
      expect(getSortOptionsFromListingFields(undefined)).toEqual({
        primaryOptions: [],
        secondaryOptions: [],
      });
    });
  });

  describe('mergeSortConfig', () => {
    it('keeps all default options when hosted sorting is null', () => {
      const merged = mergeSortConfig(null, defaultSortConfig, false, []);
      expect(merged.options.map(o => o.key)).toEqual(defaultSortConfig.options.map(o => o.key));
      expect(merged.active).toBe(true);
    });

    it('omits relevance when omitRelevance is true and hosted sorting is present', () => {
      const merged = mergeSortConfig(
        { newest: true, oldest: true, lowestPrice: true, highestPrice: true, relevance: true },
        defaultSortConfig,
        true,
        []
      );
      expect(merged.options.map(o => o.key)).not.toContain('relevance');
    });

    it('prepends listing-field sort options (arity: listingFields is 4th arg)', () => {
      const listingFields = [
        {
          key: 'capacity',
          scope: 'public',
          schemaType: 'long',
          filterConfig: {
            showSorting: true,
            label: 'Capacity',
            sortingOrder: { asc: true },
            sortingGroup: 'primary',
          },
        },
      ];
      const merged = mergeSortConfig(null, defaultSortConfig, false, listingFields);
      expect(merged.options[0].key).toBe('-pub_capacity');
    });
  });

  describe('mergeSearchConfig', () => {
    it('uses hosted mainSearch and builds defaultFilters', () => {
      const merged = mergeSearchConfig(
        {
          mainSearch: { searchType: 'keywords' },
          priceFilter: { schemaType: 'price', min: 0, max: 500, step: 10 },
          dateRangeFilter: defaultSearchConfig.dateRangeFilter,
        },
        defaultSearchConfig,
        emptyCategories,
        [],
        []
      );
      expect(merged.mainSearch).toEqual({ searchType: 'keywords' });
      expect(merged.defaultFilters.map(f => f.schemaType)).toEqual(['dates', 'price']);
      expect(merged.defaultFilters.find(f => f.schemaType === 'price').max).toBe(500);
    });

    it('falls back to keywords for invalid searchType', () => {
      const merged = mergeSearchConfig(
        {
          mainSearch: { searchType: 'nonsense' },
          dateRangeFilter: defaultSearchConfig.dateRangeFilter,
        },
        defaultSearchConfig,
        emptyCategories,
        [],
        []
      );
      expect(merged.mainSearch).toEqual({ searchType: 'keywords' });
    });

    it('includes category filter when categories exist and filter is enabled', () => {
      const merged = mergeSearchConfig(
        {
          mainSearch: { searchType: 'location' },
          categoryFilter: { enabled: true, schemaType: 'category' },
          dateRangeFilter: defaultSearchConfig.dateRangeFilter,
          priceFilter: defaultSearchConfig.priceFilter,
        },
        defaultSearchConfig,
        {
          ...emptyCategories,
          categoryLevelKeys: ['categoryLevel1'],
          categories: [{ id: 'bikes', name: 'Bikes', subcategories: [] }],
        },
        [],
        []
      );
      expect(merged.defaultFilters.some(f => f.schemaType === 'category')).toBe(true);
    });

    it('warns and drops price filter when min >= max', () => {
      const issues = [];
      const merged = mergeSearchConfig(
        {
          mainSearch: { searchType: 'location' },
          dateRangeFilter: defaultSearchConfig.dateRangeFilter,
          priceFilter: { schemaType: 'price', min: 100, max: 50, step: 5 },
        },
        defaultSearchConfig,
        emptyCategories,
        [],
        [],
        issues
      );
      expect(merged.defaultFilters.some(f => f.schemaType === 'price')).toBe(false);
      expect(issues.map(i => i.code)).toContain('SEARCH_PRICE_FILTER_INVALID_RANGE');
    });

    it('warns and drops price filter when min/max are not non-negative integers', () => {
      const issues = [];
      const merged = mergeSearchConfig(
        {
          mainSearch: { searchType: 'location' },
          dateRangeFilter: defaultSearchConfig.dateRangeFilter,
          priceFilter: { schemaType: 'price', min: -1, max: 100.5, step: 5 },
        },
        defaultSearchConfig,
        emptyCategories,
        [],
        [],
        issues
      );
      expect(merged.defaultFilters.some(f => f.schemaType === 'price')).toBe(false);
      expect(issues.map(i => i.code)).toContain('SEARCH_PRICE_FILTER_INVALID_BOUNDS');
    });

    it('forces keywordsFilter off when mainSearch is keywords', () => {
      const issues = [];
      const merged = mergeSearchConfig(
        {
          mainSearch: { searchType: 'keywords' },
          keywordsFilter: { enabled: true },
          dateRangeFilter: defaultSearchConfig.dateRangeFilter,
          priceFilter: defaultSearchConfig.priceFilter,
        },
        defaultSearchConfig,
        emptyCategories,
        [],
        [],
        issues
      );
      expect(merged.defaultFilters.some(f => f.schemaType === 'keywords')).toBe(false);
      expect(issues.map(i => i.code)).toContain(
        'SEARCH_KEYWORDS_FILTER_DISABLED_FOR_KEYWORDS_SEARCH'
      );
    });

    it('does not fall back to default keywordsFilter when mainSearch is keywords', () => {
      const merged = mergeSearchConfig(
        {
          mainSearch: { searchType: 'keywords' },
          dateRangeFilter: defaultSearchConfig.dateRangeFilter,
          priceFilter: defaultSearchConfig.priceFilter,
        },
        {
          ...defaultSearchConfig,
          keywordsFilter: { key: 'keywords', schemaType: 'keywords' },
        },
        emptyCategories,
        [],
        []
      );
      expect(merged.defaultFilters.some(f => f.schemaType === 'keywords')).toBe(false);
    });

    it('falls back to default keywordsFilter for location search when hosted is off', () => {
      const merged = mergeSearchConfig(
        {
          mainSearch: { searchType: 'location' },
          keywordsFilter: { enabled: false },
          dateRangeFilter: defaultSearchConfig.dateRangeFilter,
          priceFilter: defaultSearchConfig.priceFilter,
        },
        {
          ...defaultSearchConfig,
          keywordsFilter: { key: 'keywords', schemaType: 'keywords' },
        },
        emptyCategories,
        [],
        []
      );
      expect(merged.defaultFilters.some(f => f.schemaType === 'keywords')).toBe(true);
    });

    it('allows keywordsFilter when mainSearch is location', () => {
      const merged = mergeSearchConfig(
        {
          mainSearch: { searchType: 'location' },
          keywordsFilter: { enabled: true },
          dateRangeFilter: defaultSearchConfig.dateRangeFilter,
          priceFilter: defaultSearchConfig.priceFilter,
        },
        defaultSearchConfig,
        emptyCategories,
        [],
        []
      );
      expect(merged.defaultFilters.some(f => f.schemaType === 'keywords')).toBe(true);
    });

    it('forces seatsFilter off when dateRangeFilter is not enabled', () => {
      const issues = [];
      const merged = mergeSearchConfig(
        {
          mainSearch: { searchType: 'location' },
          dateRangeFilter: { schemaType: 'dates', enabled: false },
          seatsFilter: { schemaType: 'seats', enabled: true },
          priceFilter: defaultSearchConfig.priceFilter,
        },
        defaultSearchConfig,
        emptyCategories,
        [],
        [],
        issues
      );
      expect(merged.defaultFilters.some(f => f.schemaType === 'seats')).toBe(false);
      expect(merged.defaultFilters.some(f => f.schemaType === 'dates')).toBe(false);
      expect(issues.map(i => i.code)).toContain('SEARCH_SEATS_FILTER_DISABLED_WITHOUT_DATES');
    });

    it('allows seatsFilter when dateRangeFilter is enabled', () => {
      const merged = mergeSearchConfig(
        {
          mainSearch: { searchType: 'location' },
          dateRangeFilter: {
            schemaType: 'dates',
            enabled: true,
            availability: 'time-full',
            dateRangeMode: 'day',
          },
          seatsFilter: { schemaType: 'seats', enabled: true },
          priceFilter: defaultSearchConfig.priceFilter,
        },
        defaultSearchConfig,
        emptyCategories,
        [],
        []
      );
      expect(merged.defaultFilters.some(f => f.schemaType === 'seats')).toBe(true);
    });

    it('merges listing-field sorts when hosted mainSearch is missing', () => {
      const listingFields = [
        {
          key: 'capacity',
          scope: 'public',
          schemaType: 'long',
          filterConfig: {
            showSorting: true,
            label: 'Capacity',
            sortingOrder: { asc: true },
          },
        },
      ];
      const merged = mergeSearchConfig({}, defaultSearchConfig, emptyCategories, [], listingFields);
      expect(merged.sortConfig.options[0].key).toBe('-pub_capacity');
      expect(merged.mainSearch).toEqual({ searchType: 'location' });
    });
  });

  describe('searchConfig contract', () => {
    it('declares app-config id and hosted asset keys', () => {
      expect(searchConfig.id).toBe('search');
      expect(searchConfig.assetKeys).toEqual(['search']);
    });

    it('is registered after listing in configHandlers', () => {
      const ids = configHandlers.map(h => h.id);
      expect(ids.indexOf('listing')).toBeLessThan(ids.indexOf('search'));
      expect(ids).toContain('search');
    });

    it('normalizes hosted search slice', () => {
      expect(
        searchConfig.normalize({
          search: { mainSearch: { searchType: 'keywords' } },
        })
      ).toEqual({ mainSearch: { searchType: 'keywords' } });
      expect(searchConfig.normalize({ search: null })).toEqual({});
    });

    it('validate merges with defaults and ctx.resolved listing/categories', () => {
      const { value, issues } = searchConfig.validate(
        {
          mainSearch: { searchType: 'keywords' },
          dateRangeFilter: defaultSearchConfig.dateRangeFilter,
          priceFilter: defaultSearchConfig.priceFilter,
        },
        {
          defaults: { search: defaultSearchConfig },
          resolved: {
            categoryConfiguration: emptyCategories,
            listing: { listingTypes: [], listingFields: [] },
          },
        }
      );
      expect(issues).toEqual([]);
      expect(value.mainSearch).toEqual({ searchType: 'keywords' });
      expect(value.defaultFilters.map(f => f.schemaType)).toEqual(['dates', 'price']);
    });

    it('warns on invalid hosted mainSearch.searchType', () => {
      const { issues } = searchConfig.validate(
        { mainSearch: { searchType: 'bad' } },
        {
          defaults: { search: defaultSearchConfig },
          resolved: {
            categoryConfiguration: emptyCategories,
            listing: { listingTypes: [], listingFields: [] },
          },
        }
      );
      expect(issues.map(i => i.code)).toContain('SEARCH_INVALID_MAIN_SEARCH_TYPE');
    });

    it('buildAppConfig produces search after listing', () => {
      const { resolved } = buildAppConfig({
        hosted: {
          search: {
            mainSearch: { searchType: 'keywords' },
            dateRangeFilter: defaultSearchConfig.dateRangeFilter,
            priceFilter: defaultSearchConfig.priceFilter,
          },
          listingTypes: {
            listingTypes: [
              {
                id: 'sell',
                label: 'Sell',
                transactionProcess: {
                  name: 'default-purchase',
                  alias: 'default-purchase/release-1',
                },
                unitType: 'item',
              },
            ],
          },
          listingFields: { listingFields: [] },
          categories: { categories: [] },
        },
        defaults: {
          search: defaultSearchConfig,
          listing: { listingTypes: [], listingFields: [], enforceValidListingType: false },
          categoryConfiguration: { categories: [] },
          branding: {},
          analytics: {},
          layout: {},
          maps: {},
        },
        handlers: configHandlers.filter(h =>
          ['categoryConfiguration', 'listing', 'search'].includes(h.id)
        ),
      });
      expect(resolved.search.mainSearch).toEqual({ searchType: 'keywords' });
      expect(resolved.listing.listingTypes[0].listingType).toBe('sell');
    });
  });
});
