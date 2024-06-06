import {
  validURLParamForExtendedData,
  validFilterParams,
  validURLParamsForExtendedData,
  validUrlQueryParamsFromProps,
  initialValues,
  cleanSearchFromConflictingParams,
  pickSearchParamsOnly,
  searchParamsPicker,
  groupListingFieldConfigs,
} from './SearchPage.shared.js';

const urlParams = {
  pub_category: 'men',
  pub_amenities: 'towels,bathroom',
};

const listingFieldsConfig = [
  {
    key: 'category',
    scope: 'public',
    includeForListingTypes: ['sell-bicycles'],
    schemaType: 'enum',
    enumOptions: [
      { option: 'men', label: 'Men' },
      { option: 'women', label: 'Women' },
      { option: 'kids', label: 'Kids' },
    ],
    filterConfig: {
      indexForSearch: true,
      label: 'Category',
      group: 'primary',
    },
  },
  {
    key: 'param1',
    scope: 'public',
    includeForListingTypes: ['sell-bicycles'],
    schemaType: 'enum',
    enumOptions: [{ option: 'smoke', label: 'Smoke' }, { option: 'wood', label: 'Wood' }],
    filterConfig: {
      indexForSearch: true,
      label: 'Test',
      group: 'secondary',
    },
  },
  {
    key: 'amenities',
    scope: 'public',
    includeForListingTypes: [
      'rent-bicycles-daily',
      'rent-bicycles-nightly',
      'rent-bicycles-hourly',
    ],
    schemaType: 'multi-enum',
    enumOptions: [{ option: 'towels', label: 'Towels' }, { option: 'bathroom', label: 'Bathroom' }],
    filterConfig: {
      indexForSearch: true,
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
  conflictingFilters: ['keywords'],
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
        listingFieldsConfig,
        []
      );
      expect(validParam).toEqual({ pub_category: 'women' });
    });

    it('takes empty params', () => {
      const validParam = validURLParamForExtendedData('pub_category', '', listingFieldsConfig);
      expect(validParam).toEqual({});
    });

    it('drops an invalid param value', () => {
      const validParam = validURLParamForExtendedData(
        'pub_category',
        'invalid',
        listingFieldsConfig,
        sortConfig
      );
      expect(validParam).toEqual({});
    });

    it('drops a param with invalid name', () => {
      const validParam = validURLParamForExtendedData('pub_invalid', 'towels', listingFieldsConfig);
      expect(validParam).toEqual({});
    });
  });

  describe('validFilterParams', () => {
    it('returns valid parameters', () => {
      const validParams = validFilterParams(urlParams, listingFieldsConfig, defaultFiltersConfig);
      expect(validParams).toEqual(urlParams);
    });

    it('takes empty params', () => {
      const validParams = validFilterParams({}, listingFieldsConfig, defaultFiltersConfig);
      expect(validParams).toEqual({});
    });

    it('drops an invalid filter param value', () => {
      const params = { pub_category: 'men', pub_amenities: 'invalid1,invalid2' };
      const validParams = validFilterParams(params, listingFieldsConfig, defaultFiltersConfig);
      expect(validParams).toEqual({ pub_category: 'men' });
    });

    it('drops non-filter params', () => {
      const params = { pub_category: 'men', other_param: 'somevalue' };
      const validParams = validFilterParams(params, listingFieldsConfig, defaultFiltersConfig);
      expect(validParams).toEqual({ pub_category: 'men' });
    });

    it('returns valid parameters, when "dropNonFilterParams" is false', () => {
      const validParams = validFilterParams(
        urlParams,
        listingFieldsConfig,
        defaultFiltersConfig,
        false
      );
      expect(validParams).toEqual(urlParams);
    });

    it('takes empty params, when "dropNonFilterParams" is false', () => {
      const validParams = validFilterParams({}, listingFieldsConfig, defaultFiltersConfig, false);
      expect(validParams).toEqual({});
    });

    it('drops an invalid filter param value, when "dropNonFilterParams" is false', () => {
      const params = { pub_category: 'men', pub_amenities: 'invalid1,invalid2' };
      const validParams = validFilterParams(
        params,
        listingFieldsConfig,
        defaultFiltersConfig,
        false
      );
      expect(validParams).toEqual({ pub_category: 'men' });
    });

    it('returns non-filter params, when "dropNonFilterParams" is false', () => {
      const params = { pub_category: 'men', other_param: 'somevalue' };
      const validParams = validFilterParams(
        params,
        listingFieldsConfig,
        defaultFiltersConfig,
        false
      );
      expect(validParams).toEqual(params);
    });
  });

  describe('validUrlQueryParamsFromProps', () => {
    it('returns a valid parameter', () => {
      const location = { search: '?pub_category=men&pub_amenities=towels,bathroom' };
      const pickedParams = validUrlQueryParamsFromProps({
        location,
        config: {
          listing: {
            listingFields: listingFieldsConfig,
          },
          search: {
            defaultFilters: defaultFiltersConfig,
          },
        },
      });
      expect(pickedParams).toEqual(urlParams);
    });

    it('returns valid values for parameters when also invalid is given', () => {
      // asdf is invalid value
      const location = { search: '?pub_category=men&pub_amenities=towels,bathroom,asdf' };
      const pickedParams = validUrlQueryParamsFromProps({
        location,
        config: {
          listing: {
            listingFields: listingFieldsConfig,
          },
          search: {
            defaultFilters: defaultFiltersConfig,
          },
        },
      });
      expect(pickedParams).toEqual(urlParams);
    });
  });

  describe('initialValues', () => {
    const location = { search: '?pub_category=men&pub_amenities=towels,bathroom' };
    const props = {
      location,
      config: {
        listing: {
          listingFields: listingFieldsConfig,
        },
        search: {
          defaultFilters: defaultFiltersConfig,
        },
      },
    };
    const currentQueryParams = {};

    it('returns a valid parameter for a selected queryParamName', () => {
      const queryParamNames = ['pub_amenities'];
      const isLiveEdit = true;

      const iv = initialValues(props, currentQueryParams)(queryParamNames, isLiveEdit);
      expect(iv).toEqual({ pub_amenities: urlParams.pub_amenities });
    });

    it('returns a valid parameter for a selected queryParamNames', () => {
      const queryParamNames = ['pub_category', 'pub_amenities'];
      const isLiveEdit = true;

      const iv = initialValues(props, currentQueryParams)(queryParamNames, isLiveEdit);
      expect(iv).toEqual(urlParams);
    });

    it('returns a valid parameter for a undefined queryParamName', () => {
      const queryParamNames = ['pub_asdf'];
      const isLiveEdit = true;

      const iv = initialValues(props, currentQueryParams)(queryParamNames, isLiveEdit);
      expect(iv).toEqual({ pub_asdf: undefined });
    });

    it('returns a valid parameter for a selected queryParamNames if currentQueryParams is overwritten', () => {
      const queryParamNames = ['pub_category', 'pub_amenities'];
      const isLiveEdit = true;

      const iv = initialValues(props, { pub_category: 'women' })(queryParamNames, isLiveEdit);
      expect(iv).toEqual(urlParams);
    });

    it('returns a valid parameters lisLiveEdit=false (uses currentQueryParams)', () => {
      const amenitiesOnly = { search: '?pub_amenities=towels,bathroom' };
      const props2 = { ...props, location: amenitiesOnly };
      const queryParamNames = ['pub_category', 'pub_amenities'];
      const isLiveEdit = false;

      const iv = initialValues(props2, { pub_category: 'men' })(queryParamNames, isLiveEdit);
      expect(iv).toEqual(urlParams);
    });

    it("returns a valid parameters lisLiveEdit=true (doesn't use currentQueryParams)", () => {
      const amenitiesOnly = { search: '?pub_amenities=towels,bathroom' };
      const props2 = { ...props, location: amenitiesOnly };
      const queryParamNames = ['pub_category', 'pub_amenities'];
      const isLiveEdit = true;

      const iv = initialValues(props2, { pub_category: 'men' })(queryParamNames, isLiveEdit);
      expect(iv).toEqual({ ...urlParams, pub_category: undefined });
    });
  });

  describe('cleanSearchFromConflictingParams', () => {
    it('returns sort as null if conflicting filter is active', () => {
      const searchParams = {
        address: 'address value',
        bounds: 'bounds value',
        keywords: 'asdf',
        sort: 'createdAt',
      };
      const validParams = cleanSearchFromConflictingParams(
        searchParams,
        listingFieldsConfig,
        defaultFiltersConfig,
        sortConfig
      );

      expect(validParams).toEqual({ ...searchParams, sort: null });
    });

    it('returns sort as null if one of conflicting filter is active', () => {
      const searchParams = {
        address: 'address value',
        bounds: 'bounds value',
        keywords: 'asdf',
        sort: 'createdAt',
      };
      const validParams = cleanSearchFromConflictingParams(
        searchParams,
        listingFieldsConfig,
        defaultFiltersConfig,
        { ...sortConfig, conflictingFilters: ['origin', 'keywords'] }
      );

      expect(validParams).toEqual({ ...searchParams, sort: null });
    });

    it('returns sort if conflicting filter is not active parameters', () => {
      const searchParams = {
        address: 'address value',
        bounds: 'bounds value',
        sort: 'createdAt',
      };
      const validParams = cleanSearchFromConflictingParams(
        searchParams,
        listingFieldsConfig,
        defaultFiltersConfig,
        sortConfig
      );

      expect(validParams).toEqual(searchParams);
    });
  });

  describe('pickSearchParamsOnly', () => {
    const isOriginInUse = false;
    it('returns search parameters', () => {
      const params = {
        address: 'address value',
        origin: 'origin value',
        bounds: 'bounds value',
      };
      const validParams = pickSearchParamsOnly(
        params,
        listingFieldsConfig,
        defaultFiltersConfig,
        sortConfig,
        isOriginInUse
      );
      expect(validParams).toEqual({ bounds: 'bounds value' });
    });

    it('returns filter parameters', () => {
      const validParams = pickSearchParamsOnly(
        urlParams,
        listingFieldsConfig,
        defaultFiltersConfig,
        sortConfig,
        isOriginInUse
      );
      expect(validParams).toEqual(urlParams);
    });

    it('drops an invalid filter param value', () => {
      const params = { pub_category: 'men', pub_amenities: 'invalid1,invalid2' };
      const validParams = pickSearchParamsOnly(
        params,
        listingFieldsConfig,
        defaultFiltersConfig,
        sortConfig,
        isOriginInUse
      );
      expect(validParams).toEqual({ pub_category: 'men' });
    });

    it('drops non-search params', () => {
      const params = { pub_category: 'men', other_param: 'somevalue' };
      const validParams = pickSearchParamsOnly(
        params,
        listingFieldsConfig,
        defaultFiltersConfig,
        sortConfig,
        isOriginInUse
      );
      expect(validParams).toEqual({ pub_category: 'men' });
    });

    it('returns sort param', () => {
      const params = { sort: '-price', other_param: 'somevalue' };
      const validParams = pickSearchParamsOnly(
        params,
        listingFieldsConfig,
        defaultFiltersConfig,
        sortConfig,
        isOriginInUse
      );
      expect(validParams).toEqual({ sort: '-price' });
    });
  });

  describe('searchParamsPicker', () => {
    const isOriginInUse = false;
    it("returns searchParamsAreInSync: false if searchParamsInProps and location.search don't match", () => {
      const location = { search: '?pub_category=men&pub_amenities=towels,bathroom' };
      const searchParamsInProps = {
        address: 'address value',
        origin: 'origin value',
        bounds: 'bounds value',
      };

      const paramsInfo = searchParamsPicker(
        location.search,
        searchParamsInProps,
        listingFieldsConfig,
        defaultFiltersConfig,
        sortConfig,
        isOriginInUse
      );

      expect(paramsInfo).toEqual({
        searchParamsAreInSync: false,
        searchParamsInURL: { pub_amenities: 'towels,bathroom', pub_category: 'men' },
        urlQueryParams: { pub_amenities: 'towels,bathroom', pub_category: 'men' },
      });
    });

    it('returns searchParamsAreInSync: true if searchParamsInProps and location.search match', () => {
      const location = { search: '?pub_category=men&pub_amenities=towels,bathroom' };
      const searchParamsInProps = { pub_amenities: 'towels,bathroom', pub_category: 'men' };

      const paramsInfo = searchParamsPicker(
        location.search,
        searchParamsInProps,
        listingFieldsConfig,
        defaultFiltersConfig,
        sortConfig,
        isOriginInUse
      );

      expect(paramsInfo).toEqual({
        searchParamsAreInSync: true,
        searchParamsInURL: { pub_amenities: 'towels,bathroom', pub_category: 'men' },
        urlQueryParams: { pub_amenities: 'towels,bathroom', pub_category: 'men' },
      });
    });

    it('returns correct info even if location.search contains page and mapSearch params', () => {
      const location = {
        search: '?pub_category=men&pub_amenities=towels,bathroom&page=2&mapSearch=true',
      };
      const searchParamsInProps = { pub_amenities: 'towels,bathroom', pub_category: 'men' };

      const paramsInfo = searchParamsPicker(
        location.search,
        searchParamsInProps,
        listingFieldsConfig,
        defaultFiltersConfig,
        sortConfig,
        isOriginInUse
      );

      expect(paramsInfo).toEqual({
        searchParamsAreInSync: true,
        searchParamsInURL: { pub_amenities: 'towels,bathroom', pub_category: 'men' },
        urlQueryParams: { pub_amenities: 'towels,bathroom', pub_category: 'men' },
      });
    });

    it('returns correct urlQueryParams even if location.search contains unknown search params', () => {
      const location = { search: '?pub_category=men&pub_amenities=towels,bathroom&pub_asdf=true' };
      const searchParamsInProps = { pub_amenities: 'towels,bathroom', pub_category: 'men' };

      const paramsInfo = searchParamsPicker(
        location.search,
        searchParamsInProps,
        listingFieldsConfig,
        defaultFiltersConfig,
        sortConfig,
        isOriginInUse
      );

      expect(paramsInfo).toEqual({
        searchParamsAreInSync: true,
        searchParamsInURL: {
          pub_amenities: 'towels,bathroom',
          pub_category: 'men',
          pub_asdf: true,
        },
        urlQueryParams: { pub_amenities: 'towels,bathroom', pub_category: 'men' },
      });
    });
  });

  describe('groupListingFieldConfigs', () => {
    it('returns grouped configs for the extended data of the listinga', () => {
      const activeListingTypes = [
        'sell-bicycles',
        'rent-bicycles-daily',
        'rent-bicycles-nightly',
        'rent-bicycles-hourly',
      ];
      const [primary, secondary] = groupListingFieldConfigs(
        listingFieldsConfig,
        activeListingTypes
      );
      expect(primary).toEqual([listingFieldsConfig[0]]);
      expect(secondary).toEqual([listingFieldsConfig[1], listingFieldsConfig[2]]);
    });
  });
});
