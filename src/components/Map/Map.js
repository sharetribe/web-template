import React from 'react';
import classNames from 'classnames';

import { useConfiguration } from '../../context/configurationContext';
import { bool, number, object, string } from 'prop-types';
import { propTypes } from '../../util/types';
import * as mapboxMap from './MapboxMap';
import * as googleMapsMap from './GoogleMap';

import css from './Map.module.css';

export const Map = props => {
  const config = useConfiguration();
  const {
    className,
    rootClassName,
    mapRootClassName,
    address,
    center,
    obfuscatedCenter,
    zoom,
    mapsConfig,
    useStaticMap,
  } = props;
  const mapsConfiguration = mapsConfig || config.maps;
  const isGoogleMapsInUse = mapsConfiguration.mapProvider === 'googleMaps';
  const StaticMap = isGoogleMapsInUse ? googleMapsMap.StaticMap : mapboxMap.StaticMap;
  const DynamicMap = isGoogleMapsInUse ? googleMapsMap.DynamicMap : mapboxMap.DynamicMap;
  const isMapsLibLoaded = isGoogleMapsInUse
    ? googleMapsMap.isMapsLibLoaded
    : mapboxMap.isMapsLibLoaded;

  const classes = classNames(rootClassName || css.root, className);
  const mapClasses = mapRootClassName || css.mapRoot;

  if (mapsConfiguration.fuzzy.enabled && !obfuscatedCenter) {
    throw new Error(
      'Map: obfuscatedCenter prop is required when config.maps.fuzzy.enabled === true'
    );
  }
  if (!mapsConfiguration.fuzzy.enabled && !center) {
    throw new Error('Map: center prop is required when config.maps.fuzzy.enabled === false');
  }

  const location = mapsConfiguration.fuzzy.enabled ? obfuscatedCenter : center;
  const zoomLevel =
    zoom || mapsConfiguration.fuzzy.enabled ? mapsConfiguration.fuzzy.defaultZoomLevel : 11;

  return !isMapsLibLoaded() ? (
    <div className={classes} />
  ) : useStaticMap ? (
    <StaticMap
      center={location}
      zoom={zoomLevel}
      address={address}
      mapsConfig={mapsConfiguration}
    />
  ) : (
    <DynamicMap
      containerClassName={classes}
      mapClassName={mapClasses}
      center={location}
      zoom={zoomLevel}
      address={address}
      mapsConfig={mapsConfiguration}
    />
  );
};

Map.defaultProps = {
  className: null,
  rootClassName: null,
  mapRootClassName: null,
  address: '',
  zoom: null,
  mapsConfig: null,
  useStaticMap: false,
};

Map.propTypes = {
  className: string,
  rootClassName: string,
  mapRootClassName: string,
  address: string,
  center: propTypes.latlng,
  obfuscatedCenter: propTypes.latlng,
  zoom: number,
  mapsConfig: object,
  useStaticMap: bool,
};

export default Map;
