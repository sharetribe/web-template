import { analyticsConfig } from './analytics/analytics';
import { brandingConfig } from './branding/branding';
import { categoryConfigurationConfig } from './categoryConfiguration/categoryConfiguration';
import { layoutConfig } from './layout/layout';
import { listingConfig } from './listing/listing';
import { mapsConfig } from './maps/maps';

/**
 * Ordered registry of config handlers used by buildAppConfig.
 *
 * Each entry owns one config domain (normalize → validate → resolve).
 * Handlers declare `id` (app-config key) and `assetKeys` (hosted-asset keys).
 * Add handlers here as domains are ported out of mergeConfig.
 * Interdependent handlers must follow their dependencies
 * (e.g. categoryConfiguration before listing; listing before search).
 */
export const configHandlers = [
  analyticsConfig,
  brandingConfig,
  layoutConfig,
  mapsConfig,
  categoryConfigurationConfig,
  listingConfig,
];
