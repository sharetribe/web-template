import React, { Component } from 'react';
import pick from 'lodash/pick';
import isEqual from 'lodash/isEqual';
import polyline from '@mapbox/polyline';

import { encodeLatLng, stringify } from '../../util/urlHelpers';
import { lazyLoadWithDimensions } from '../../util/uiHelpers';
import { circlePolyline } from '../../util/maps';

const DEFAULT_COLOR = 'FF0000';
const DEFAULT_STROKE_OPACITY = 0.3;
const DEFAULT_FILL_OPACITY = 0.2;

// Extract color from string. Given value should be either with '#' (e.g. #FFFFFF') or without it.
const formatColorFromString = color => {
  if (typeof color === 'string' && /^#[0-9A-F]{6}$/i.test(color)) {
    return color.substring(1).toUpperCase();
  } else if (typeof color === 'string' && /^[0-9A-F]{6}$/i) {
    return color.toUpperCase();
  } else {
    return DEFAULT_COLOR;
  }
};

// Convert opacity from floating point value (0.0 -> 1.0) to a hexadecimal format
const convertOpacity = opacity => {
  if (typeof opacity === 'number' && !isNaN(opacity) && opacity >= 0 && opacity <= 1) {
    // 0.2 => 20
    return Math.floor(opacity * 255)
      .toString(16)
      .toUpperCase();
  }
};

// Draw a circle polyline for fuzzy location.
const drawFuzzyCircle = (mapsConfig, center) => {
  if (!(mapsConfig && typeof mapsConfig === 'object' && center && typeof center === 'object')) {
    return '';
  }

  const fillColor = mapsConfig.fuzzy.circleColor;
  const fillOpacity = 0.2;
  const strokeColor = mapsConfig.fuzzy.circleColor;
  const strokeWeight = 1;

  const circleRadius = mapsConfig.fuzzy.offset || 500;
  const circleStrokeWeight = strokeWeight || 1;
  const circleStrokeColor = formatColorFromString(strokeColor);
  const circleStrokeOpacity = convertOpacity(DEFAULT_STROKE_OPACITY);
  const circleFill = formatColorFromString(fillColor);
  const circleFillOpacity = convertOpacity(fillOpacity || DEFAULT_FILL_OPACITY);

  // Encoded polyline string
  const encodedPolyline = polyline.encode(circlePolyline(center, circleRadius));

  const polylineGraphicTokens = [
    `color:0x${circleStrokeColor}${circleStrokeOpacity}`,
    `fillcolor:0x${circleFill}${circleFillOpacity}`,
    `weight:${circleStrokeWeight}`,
    `enc:${encodedPolyline}`,
  ];

  return polylineGraphicTokens.join('|');
};

/**
 * Static version of Google Maps
 * Note: Google supports max 640px wide static map tile.
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
 * @returns {JSX.Element} static version of Google Maps
 */
class StaticGoogleMap extends Component {
  shouldComponentUpdate(nextProps, prevState) {
    // Do not draw the map unless center, zoom or dimensions change
    // We want to prevent unnecessary calls to Google Maps APIs due
    const currentData = pick(this.props, ['center', 'zoom', 'dimensions']);
    const nextData = pick(nextProps, ['center', 'zoom', 'dimensions']);
    return !isEqual(currentData, nextData);
  }

  render() {
    const { center, zoom, address, mapsConfig, dimensions } = this.props;
    const { lat, lng } = center || {};
    const { width, height } = dimensions;

    // Extra graphics for the static map image
    // 1. if fuzzy coordinates are used, return circle path
    // 2. else return default marker
    const targetMaybe = mapsConfig.fuzzy.enabled
      ? { path: drawFuzzyCircle(mapsConfig, center) }
      : { markers: `${lat},${lng}` };

    const srcParams = stringify({
      center: encodeLatLng(center),
      zoom,
      size: `${width}x${height}`,
      maptype: 'roadmap',
      key: mapsConfig.googleMapsAPIKey,
      ...targetMaybe,
    });

    return (
      <img
        src={`https://maps.googleapis.com/maps/api/staticmap?${srcParams}`}
        alt={address}
        crossOrigin="anonymous"
      />
    );
  }
}

export default lazyLoadWithDimensions(StaticGoogleMap, { maxWidth: '640px' });
