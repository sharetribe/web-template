import {
  validURLParamForExtendedData,
  validFilterParams,
  validURLParamsForExtendedData,
  pickSearchParamsOnly,
} from './SearchPage.helpers.js';

const urlParams = {
  pub_category: 'men',
  pub_amenities: 'towels,bathroom',
};

const listingExtendedDataConfig = [
  {
    key: 'category',
    scope: 'public',
    includeForProcessAliases: ['flex-product-default-process/release-1'],
    schemaType: 'enum',
    schemaOptions: ['Men', 'Women', 'Kids'],
    indexForSearch: true,
    searchPageConfig: {
      label: 'Category',
      group: 'primary',
    },
  },
  {
    key: 'param1',
    scope: 'public',
    includeForProcessAliases: ['flex-product-default-process/release-1'],
    schemaType: 'enum',
    schemaOptions: ['Smoke', 'Wood'],
    indexForSearch: true,
    searchPageConfig: {
      label: 'Test',
      group: 'secondary',
    },
  },
  {
    key: 'amenities',
    scope: 'public',
    includeForProcessAliases: ['flex-booking-default-process/release-1'],
    schemaType: 'multi-enum',
    schemaOptions: ['Towels', 'Bathroom'],
    indexForSearch: true,
    searchPageConfig: {
      label: 'Amenities',
      //searchMode: 'has_all',
      group: 'secondary',
    },
  },
];

const defaultFiltersConfig = [
  {
    key: 'price',
    schemaType: 'price',
    label: 'Price',
    // Note: unlike most prices this is not handled in subunits
    min: 0,
    max: 1000,
    step: 5,
  },
  {
    key: 'keywords',
    schemaType: 'text',
    label: 'Keyword',
  },
];

const sortConfig = {
  active: true,
  queryParamName: 'sort',
  relevanceKey: 'relevance',
  conflictingFilters: ['keyword'],
  options: [
    { key: 'createdAt', label: 'Newest' },
    { key: '-createdAt', label: 'Oldest' },
    { key: '-price', label: 'Lowest price' },
    { key: 'price', label: 'Highest price' },
    { key: 'relevance', label: 'Relevance', longLabel: 'Relevance (Keyword search)' },
  ],
};

describe('SearchPage.helpers', () => {
  describe('validURLParamForExtendedData', () => {
    it('returns a valid parameter', () => {
      const validParam = validURLParamForExtendedData(
        'pub_category',
        'women',
        listingExtendedDataConfig,
        []
      );
      expect(validParam).toEqual({ pub_category: 'women' });
    });

    it('takes empty params', () => {
      const validParam = validURLParamForExtendedData(
        'pub_category',
        '',
        listingExtendedDataConfig
      );
      expect(validParam).toEqual({});
    });

    it('drops an invalid param value', () => {
      const validParam = validURLParamForExtendedData(
        'pub_category',
        'invalid',
        listingExtendedDataConfig,
        sortConfig
      );
      expect(validParam).toEqual({});
    });

    it('drops a param with invalid name', () => {
      const validParam = validURLParamForExtendedData(
        'pub_invalid',
        'towels',
        listingExtendedDataConfig
      );
      expect(validParam).toEqual({});
    });
  });

  describe('validFilterParams', () => {
    it('returns valid parameters', () => {
      const validParams = validFilterParams(
        urlParams,
        listingExtendedDataConfig,
        defaultFiltersConfig
      );
      expect(validParams).toEqual(urlParams);
    });

    it('takes empty params', () => {
      const validParams = validFilterParams({}, listingExtendedDataConfig, defaultFiltersConfig);
      expect(validParams).toEqual({});
    });

    it('drops an invalid filter param value', () => {
      const params = { pub_category: 'men', pub_amenities: 'invalid1,invalid2' };
      const validParams = validFilterParams(
        params,
        listingExtendedDataConfig,
        defaultFiltersConfig
      );
      expect(validParams).toEqual({ pub_category: 'men' });
    });

    it('drops non-filter params', () => {
      const params = { pub_category: 'men', other_param: 'somevalue' };
      const validParams = validFilterParams(
        params,
        listingExtendedDataConfig,
        defaultFiltersConfig
      );
      expect(validParams).toEqual({ pub_category: 'men' });
    });
  });

  describe('validURLParamsForExtendedData', () => {
    it('returns valid parameters', () => {
      const validParams = validURLParamsForExtendedData(
        urlParams,
        listingExtendedDataConfig,
        defaultFiltersConfig
      );
      expect(validParams).toEqual(urlParams);
    });

    it('takes empty params', () => {
      const validParams = validURLParamsForExtendedData(
        {},
        listingExtendedDataConfig,
        defaultFiltersConfig
      );
      expect(validParams).toEqual({});
    });

    it('drops an invalid filter param value', () => {
      const params = { pub_category: 'men', pub_amenities: 'invalid1,invalid2' };
      const validParams = validURLParamsForExtendedData(
        params,
        listingExtendedDataConfig,
        defaultFiltersConfig
      );
      expect(validParams).toEqual({ pub_category: 'men' });
    });

    it('returns non-filter params', () => {
      const params = { pub_category: 'men', other_param: 'somevalue' };
      const validParams = validURLParamsForExtendedData(
        params,
        listingExtendedDataConfig,
        defaultFiltersConfig
      );
      expect(validParams).toEqual(params);
    });
  });

  describe('pickSearchParamsOnly', () => {
    it('returns search parameters', () => {
      const params = {
        address: 'address value',
        origin: 'origin value',
        bounds: 'bounds value',
      };
      const validParams = pickSearchParamsOnly(
        params,
        listingExtendedDataConfig,
        defaultFiltersConfig,
        sortConfig
      );
      expect(validParams).toEqual({ bounds: 'bounds value' });
    });

    it('returns filter parameters', () => {
      const validParams = pickSearchParamsOnly(
        urlParams,
        listingExtendedDataConfig,
        defaultFiltersConfig,
        sortConfig
      );
      expect(validParams).toEqual(urlParams);
    });

    it('drops an invalid filter param value', () => {
      const params = { pub_category: 'men', pub_amenities: 'invalid1,invalid2' };
      const validParams = pickSearchParamsOnly(
        params,
        listingExtendedDataConfig,
        defaultFiltersConfig,
        sortConfig
      );
      expect(validParams).toEqual({ pub_category: 'men' });
    });

    it('drops non-search params', () => {
      const params = { pub_category: 'men', other_param: 'somevalue' };
      const validParams = pickSearchParamsOnly(
        params,
        listingExtendedDataConfig,
        defaultFiltersConfig,
        sortConfig
      );
      expect(validParams).toEqual({ pub_category: 'men' });
    });

    it('returns sort param', () => {
      const params = { sort: '-price', other_param: 'somevalue' };
      const validParams = pickSearchParamsOnly(
        params,
        listingExtendedDataConfig,
        defaultFiltersConfig,
        sortConfig
      );
      expect(validParams).toEqual({ sort: '-price' });
    });
  });
});
