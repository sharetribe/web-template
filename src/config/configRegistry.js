import { analyticsConfig } from './analytics/analytics';
import { brandingConfig } from './branding/branding';
import { layoutConfig } from './layout/layout';

/**
 * Ordered registry of config handlers used by buildAppConfig.
 *
 * Each entry owns one config domain (normalize → validate → resolve).
 * Handlers declare `id` (app-config key) and `assetKeys` (hosted-asset keys).
 * Add handlers here as domains are ported out of mergeConfig.
 * Interdependent handlers must follow their dependencies (e.g. search after listing).
 */
export const configHandlers = [analyticsConfig, brandingConfig, layoutConfig];
