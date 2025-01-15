import React from 'react';
import polyline from '@mapbox/polyline';

import { lazyLoadWithDimensions } from '../../util/uiHelpers';
import { circlePolyline } from '../../util/maps';

const formatColor = color => {
  return color.replace(/^#/, '');
};

const fuzzyCircleOverlay = (center, mapsConfig) => {
  const strokeWeight = 1;
  const strokeColor = mapsConfig.fuzzy.circleColor;
  const strokeOpacity = 0.5;
  const fillColor = mapsConfig.fuzzy.circleColor;
  const fillOpacity = 0.2;

  const path = circlePolyline(center, mapsConfig.fuzzy.offset);
  const styles = `-${strokeWeight}+${formatColor(strokeColor)}-${strokeOpacity}+${formatColor(
    fillColor
  )}-${fillOpacity}`;
  return `path${styles}(${encodeURIComponent(polyline.encode(path))})`;
};

const markerOverlay = center => {
  return `pin-s(${center.lng},${center.lat})`;
};

const mapOverlay = (center, mapsConfig) => {
  if (mapsConfig.fuzzy.enabled) {
    return fuzzyCircleOverlay(center, mapsConfig);
  }
  return markerOverlay(center);
};

/**
 * Static version of Mapbox
 * Note: Google supports max 640px wide static map tile. It's enforced with Mapbox too.
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to component's own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @param {string?} props.address
 * @param {Object} props.center LatLng
 * @param {number} props.center.lat latitude
 * @param {number} props.center.lng longitude
 * @param {number} props.zoom zoom level
 * @param {Object} props.mapsConfig
 * @param {Object} props.dimensions
 * @param {number} props.dimensions.width
 * @param {number} props.dimensions.height
 * @returns {JSX.Element} static version of Mapbox
 */
const StaticMapboxMap = props => {
  const { address, center, zoom, mapsConfig, dimensions } = props;
  const { width, height } = dimensions;

  const libLoaded = typeof window !== 'undefined' && window.mapboxgl;
  if (!libLoaded) {
    return null;
  }

  const overlay = mapOverlay(center, mapsConfig);
  const src =
    'https://api.mapbox.com/styles/v1/mapbox/streets-v10/static' +
    (overlay ? `/${overlay}` : '') +
    `/${center.lng},${center.lat},${zoom}` +
    `/${width}x${height}` +
    `?access_token=${mapsConfig.mapboxAccessToken}`;

  return <img src={src} alt={address} crossOrigin="anonymous" />;
};

export default lazyLoadWithDimensions(StaticMapboxMap, { maxWidth: '640px' });
