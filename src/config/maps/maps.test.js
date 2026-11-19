import {
  mergeMapsConfig,
  mapsConfig,
  isValidMapboxAccessToken,
  isValidGoogleMapsApiKey,
} from './maps';
import { applyConfigHandlers, configHandlers } from '../mergeConfig';

describe('maps config', () => {
  const validMapboxToken = 'pk.abc123.def456';
  const validGoogleKey = 'ASmos65oljiAX89dgdq92hgimnws56Pqr7stUvWx89z';

  const defaults = {
    mapProvider: 'mapbox',
    mapboxAccessToken: 'default-mapbox-token',
    googleMapsAPIKey: 'default-google-key',
    search: { suggestCurrentLocation: true },
    fuzzy: { enabled: false },
  };

  describe('helpers', () => {
    it('validates Mapbox public token format', () => {
      expect(isValidMapboxAccessToken(validMapboxToken)).toBe(true);
      expect(isValidMapboxAccessToken('pk.a.b')).toBe(true);
      expect(isValidMapboxAccessToken('sk.a.b')).toBe(false);
      expect(isValidMapboxAccessToken('pk.onlyonepart')).toBe(false);
      expect(isValidMapboxAccessToken('')).toBe(false);
      expect(isValidMapboxAccessToken(undefined)).toBe(false);
    });

    it('validates Google Maps API key length', () => {
      expect(isValidGoogleMapsApiKey(validGoogleKey)).toBe(true);
      expect(isValidGoogleMapsApiKey('x')).toBe(true);
      expect(isValidGoogleMapsApiKey('')).toBe(false);
      expect(isValidGoogleMapsApiKey('a'.repeat(256))).toBe(false);
      expect(isValidGoogleMapsApiKey(undefined)).toBe(false);
    });
  });

  describe('mergeMapsConfig', () => {
    it('uses hosted provider and tokens when present', () => {
      expect(
        mergeMapsConfig(
          {
            provider: 'googleMaps',
            googleMapsApiKey: validGoogleKey,
            mapboxAccessToken: validMapboxToken,
          },
          defaults
        )
      ).toEqual({
        search: defaults.search,
        fuzzy: defaults.fuzzy,
        mapProvider: 'googleMaps',
        mapboxAccessToken: validMapboxToken,
        googleMapsAPIKey: validGoogleKey,
      });
    });

    it('uses built-in defaults when hosted maps is empty', () => {
      expect(mergeMapsConfig({}, defaults)).toEqual({
        search: defaults.search,
        fuzzy: defaults.fuzzy,
        mapProvider: 'mapbox',
        mapboxAccessToken: 'default-mapbox-token',
        googleMapsAPIKey: 'default-google-key',
      });
    });

    it('keeps built-in search and fuzzy from defaults', () => {
      const merged = mergeMapsConfig({ provider: 'mapbox' }, defaults);
      expect(merged.search).toEqual(defaults.search);
      expect(merged.fuzzy).toEqual(defaults.fuzzy);
    });
  });

  describe('mapsConfig contract', () => {
    it('declares app-config id and hosted asset keys', () => {
      expect(mapsConfig.id).toBe('maps');
      expect(mapsConfig.assetKeys).toEqual(['maps']);
    });

    it('normalizes to known maps keys only', () => {
      expect(
        mapsConfig.normalize({
          maps: {
            provider: 'mapbox',
            mapboxAccessToken: validMapboxToken,
            googleMapsApiKey: validGoogleKey,
            extra: true,
          },
        })
      ).toEqual({
        provider: 'mapbox',
        mapboxAccessToken: validMapboxToken,
        googleMapsApiKey: validGoogleKey,
      });
    });

    it('warns on unsupported provider and skips token checks', () => {
      const { value, issues } = mapsConfig.validate({
        provider: 'leaflet',
        mapboxAccessToken: validMapboxToken,
      });
      expect(value).toEqual({});
      expect(issues.map(i => i.code)).toEqual(['MAPS_UNSUPPORTED_PROVIDER']);
    });

    it('warns and drops invalid Mapbox access token', () => {
      const { value, issues } = mapsConfig.validate({
        provider: 'mapbox',
        mapboxAccessToken: 'not-a-mapbox-token',
      });
      expect(value.mapboxAccessToken).toBeUndefined();
      expect(value.provider).toBe('mapbox');
      expect(issues.map(i => i.code)).toContain('MAPS_INVALID_MAPBOX_ACCESS_TOKEN');
    });

    it('warns and drops invalid Google Maps API key', () => {
      const { value, issues } = mapsConfig.validate({
        provider: 'googleMaps',
        googleMapsApiKey: 'a'.repeat(256),
      });
      expect(value.googleMapsApiKey).toBeUndefined();
      expect(value.provider).toBe('googleMaps');
      expect(issues.map(i => i.code)).toContain('MAPS_INVALID_GOOGLE_MAPS_API_KEY');
    });

    it('warns when mapbox provider is missing its access token', () => {
      const { value, issues } = mapsConfig.validate({
        provider: 'mapbox',
      });
      expect(value.provider).toBe('mapbox');
      expect(value.mapboxAccessToken).toBeUndefined();
      expect(issues.map(i => i.code)).toEqual(['MAPS_INVALID_MAPBOX_ACCESS_TOKEN']);
    });

    it('warns when googleMaps provider is missing its API key', () => {
      const { value, issues } = mapsConfig.validate({
        provider: 'googleMaps',
      });
      expect(value.provider).toBe('googleMaps');
      expect(value.googleMapsApiKey).toBeUndefined();
      expect(issues.map(i => i.code)).toEqual(['MAPS_INVALID_GOOGLE_MAPS_API_KEY']);
    });

    it('resolves via applyConfigHandlers from registry', () => {
      const { resolved, configIssues } = applyConfigHandlers({
        hosted: {
          branding: { logo: { type: 'imageAsset', id: 'logo' }, favicon: { type: 'imageAsset' } },
          maps: {
            provider: 'googleMaps',
            googleMapsApiKey: validGoogleKey,
          },
        },
        defaults: { maps: defaults },
        handlers: configHandlers,
      });
      expect(resolved.maps.mapProvider).toBe('googleMaps');
      expect(resolved.maps.googleMapsAPIKey).toBe(validGoogleKey);
      expect(resolved.maps.mapboxAccessToken).toBe('default-mapbox-token');
      expect(resolved.maps.search).toEqual(defaults.search);
      expect(configIssues.filter(i => i.configId === 'maps')).toEqual([]);
    });

    it('falls back to built-in token when hosted Mapbox token is invalid', () => {
      const { resolved, configIssues } = applyConfigHandlers({
        hosted: {
          branding: { logo: { type: 'imageAsset', id: 'logo' }, favicon: { type: 'imageAsset' } },
          maps: {
            provider: 'mapbox',
            mapboxAccessToken: 'bad-token',
          },
        },
        defaults: { maps: defaults },
        handlers: configHandlers,
      });
      expect(resolved.maps.mapProvider).toBe('mapbox');
      expect(resolved.maps.mapboxAccessToken).toBe('default-mapbox-token');
      expect(configIssues.map(i => i.code)).toContain('MAPS_INVALID_MAPBOX_ACCESS_TOKEN');
    });

    it('keeps hosted provider and fills built-in token when pairing token is missing', () => {
      const { resolved, configIssues } = applyConfigHandlers({
        hosted: {
          branding: { logo: { type: 'imageAsset', id: 'logo' }, favicon: { type: 'imageAsset' } },
          maps: {
            provider: 'googleMaps',
          },
        },
        defaults: { maps: defaults },
        handlers: configHandlers,
      });
      expect(resolved.maps.mapProvider).toBe('googleMaps');
      expect(resolved.maps.googleMapsAPIKey).toBe('default-google-key');
      expect(configIssues.map(i => i.code)).toContain('MAPS_INVALID_GOOGLE_MAPS_API_KEY');
    });
  });
});
