import routeConfiguration from '../routing/routeConfiguration';
import {
  createResourceLocatorString,
  findRouteByRouteName,
  canonicalRoutePath,
  replaceParamsInHref,
} from './routes';

const layoutConfig = {
  searchPage: { variantType: 'map' },
  listingPage: { variantType: 'carousel' },
};

describe('util/routes.js', () => {
  const routes = routeConfiguration(layoutConfig);

  describe('createResourceLocatorString', () => {
    it('should return meaningful strings if parameters are not needed', () => {
      // default links without params in path or search query
      expect(createResourceLocatorString('SearchPage', routes, undefined, undefined)).toEqual('/s');
      expect(createResourceLocatorString('SearchPage', routes, {}, {})).toEqual('/s');
    });

    it('should return meaningful strings with path parameters', () => {
      expect(
        createResourceLocatorString('ListingPage', routes, { id: '1234', slug: 'nice-listing' }, {})
      ).toEqual('/l/nice-listing/1234');
      expect(() => createResourceLocatorString('ListingPage', routes, {}, {})).toThrowError(
        TypeError('Missing parameters: slug, id')
      );
      expect(() =>
        createResourceLocatorString('ListingPage', routes, { id: '1234' }, {})
      ).toThrowError(TypeError('Missing parameters: slug'));
      expect(() =>
        createResourceLocatorString('ListingPage', routes, { slug: 'nice-listing' }, {})
      ).toThrowError(TypeError('Missing parameters: id'));
    });

    it('should return meaningful strings with search parameters', () => {
      expect(createResourceLocatorString('SearchPage', routes, {}, { page: 2 })).toEqual(
        '/s?page=2'
      );
      expect(
        createResourceLocatorString('SearchPage', routes, {}, { address: 'Helsinki', page: 2 })
      ).toEqual('/s?address=Helsinki&page=2');
    });

    it('should return meaningful strings with path and search parameters', () => {
      expect(
        createResourceLocatorString(
          'ListingPage',
          routes,
          { id: '1234', slug: 'nice-listing' },
          { extrainfo: true }
        )
      ).toEqual('/l/nice-listing/1234?extrainfo=true');
    });
  });

  describe('findRouteByRouteName', () => {
    it('should return CheckoutPage route', () => {
      const foundRoute = findRouteByRouteName('CheckoutPage', routes);
      expect(foundRoute.name).toEqual('CheckoutPage');
      expect(typeof foundRoute.setInitialValues).toEqual('function');
    });

    it('should throw exception for non-existing route (BlaaBlaaPage)', () => {
      expect(() => findRouteByRouteName('BlaaBlaaPage', routes)).toThrowError(
        'Component "BlaaBlaaPage" was not found.'
      );
    });
  });

  describe('canonicalRoutePath', () => {
    it('handles non-listing route', () => {
      const location = {
        pathname: '/',
        search: '?some=value',
        hash: '#and-some-hash',
      };
      expect(canonicalRoutePath(routes, location)).toEqual('/?some=value#and-some-hash');
    });
    it('handles ListingPage', () => {
      const location = {
        pathname: '/l/some-slug-here/00000000-0000-0000-0000-000000000000',
        search: '',
        hash: '',
      };
      expect(canonicalRoutePath(routes, location)).toEqual(
        '/l/00000000-0000-0000-0000-000000000000'
      );
    });
    it('handles ListingPage book', () => {
      const location = {
        pathname: '/l/some-slug-here/00000000-0000-0000-0000-000000000000?book=true',
        search: '',
        hash: '',
      };
      expect(canonicalRoutePath(routes, location)).toEqual(
        '/l/00000000-0000-0000-0000-000000000000?book=true'
      );
    });
    it('handles ListingBasePage', () => {
      const location = {
        pathname: '/l',
        search: '',
        hash: '',
      };
      expect(canonicalRoutePath(routes, location)).toEqual('/l');
    });
    it('handles CheckoutPage', () => {
      const location = {
        pathname: '/l/some-slug-here/00000000-0000-0000-0000-000000000000/checkout',
        search: '',
        hash: '',
      };
      expect(canonicalRoutePath(routes, location)).toEqual(
        '/l/some-slug-here/00000000-0000-0000-0000-000000000000/checkout'
      );
    });
    it('handles NewListingPage', () => {
      const location = {
        pathname: '/l/new',
        search: '',
        hash: '',
      };
      expect(canonicalRoutePath(routes, location)).toEqual('/l/new');
    });
    it('handles ListingPageCanonical', () => {
      const location = {
        pathname: '/l/00000000-0000-0000-0000-000000000000',
        search: '',
        hash: '',
      };
      expect(canonicalRoutePath(routes, location)).toEqual(
        '/l/00000000-0000-0000-0000-000000000000'
      );
    });
  });
  describe('replaceUserParamsInHref', () => {
    it('should correctly replace {userId} and {userEmail} in the href', () => {
      const userId = '00000000-aaaa-bbbb-cccc-ffffffffffff';
      const userEmail = 'user@example.com';

      // Path with {userId} and {userEmail}
      const href1 = 'https://buy.example.com/{userId}?prefilled_email={userEmail}';
      const result1 = replaceParamsInHref(href1, { userId, userEmail });
      expect(result1).toEqual(
        'https://buy.example.com/00000000-aaaa-bbbb-cccc-ffffffffffff?prefilled_email=user%40example.com'
      );
    });

    it('should correctly replace {listingId} and {userEmail} in the href', () => {
      const userEmail = 'user@example.com';
      const listingId = '11111111-bbbb-cccc-dddd-eeeeeeeeeeee';

      // Path with {listingId} and {userEmail}
      const href2 =
        'https://buy.example.com/path?client_reference_id={listingId}&prefilled_email={userEmail}';
      const result2 = replaceParamsInHref(href2, { listingId, userEmail });
      expect(result2).toEqual(
        'https://buy.example.com/path?client_reference_id=11111111-bbbb-cccc-dddd-eeeeeeeeeeee&prefilled_email=user%40example.com'
      );
    });

    it('should correctly replace multiple {userId} variables in the href', () => {
      const userId = '00000000-aaaa-bbbb-cccc-ffffffffffff';
      const userEmail = 'user@example.com';

      // Path with multiple {userId} variables
      const href3 =
        'https://buy.example.com/path?client_reference_id={userId}&prefilled_email={userEmail}&prefilled_userId={userId}';
      const result3 = replaceParamsInHref(href3, { userId, userEmail });
      expect(result3).toEqual(
        'https://buy.example.com/path?client_reference_id=00000000-aaaa-bbbb-cccc-ffffffffffff&prefilled_email=user%40example.com&prefilled_userId=00000000-aaaa-bbbb-cccc-ffffffffffff'
      );
    });
  });
});
