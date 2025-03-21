import React, { Component } from 'react';
import { circlePolyline } from '../../util/maps';

/**
 * Map that uses Google Maps and is fully dynamic (zoom, pan, etc.).
 *
 * @component
 * @param {Object} props
 * @param {string?} props.containerClassName add style rules for the root container
 * @param {string?} props.mapClassName add style rules for the map div
 * @param {string?} props.address
 * @param {Object} props.center LatLng
 * @param {number} props.center.lat latitude
 * @param {number} props.center.lng longitude
 * @param {number} props.zoom
 * @param {Object} props.mapsConfig
 * @returns {JSX.Element} dynamic version of Google Maps
 */
class DynamicGoogleMap extends Component {
  constructor(props) {
    super(props);
    this.map = null;
    this.mapContainer = null;

    this.initializeMap = this.initializeMap.bind(this);
  }

  componentDidMount(prevProps) {
    if (!this.map && this.mapContainer) {
      this.initializeMap();
    }
  }

  initializeMap() {
    const { offsetHeight, offsetWidth } = this.mapContainer;
    const hasDimensions = offsetHeight > 0 && offsetWidth > 0;

    if (hasDimensions) {
      const { center, zoom, address, mapsConfig } = this.props;
      const maps = window.google.maps;
      const controlPosition = window.google.maps.ControlPosition.LEFT_TOP;

      const mapConfig = {
        center,
        zoom,
        // Disable all controls except zoom
        // https://developers.google.com/maps/documentation/javascript/reference/map#MapOptions

        // Disable map type (ie. Satellite etc.)
        mapTypeControl: false,
        // Disable zooming by scrolling
        scrollwheel: false,
        // Fullscreen control toggle
        fullscreenControl: false,
        // Street View control
        streetViewControl: false,
        // Zoom control position
        zoomControlOptions: {
          position: controlPosition,
        },
      };

      this.map = new maps.Map(this.mapContainer, mapConfig);

      if (mapsConfig.fuzzy.enabled) {
        const GoogleLatLng = window.google.maps.LatLng;
        // Origin as object literal (LatLngLiteral)
        const origin = { lat: center.lat, lng: center.lng };
        const radius = mapsConfig.fuzzy.offset;
        const path = circlePolyline(origin, radius).map(c => new GoogleLatLng(c[0], c[1]));

        const circleProps = {
          options: {
            fillColor: mapsConfig.fuzzy.circleColor,
            fillOpacity: 0.2,
            strokeColor: mapsConfig.fuzzy.circleColor,
            strokeOpacity: 0.5,
            strokeWeight: 1,
            clickable: false,
          },
          path,
          map: this.map,
        };

        // Add a circle. We use Polygon because the default Circle class is not round enough.
        const Polygon = window.google.maps.Polygon;
        new Polygon(circleProps);
      } else {
        new window.google.maps.Marker({
          position: center,
          map: this.map,
          title: address,
        });
      }
    }
  }

  render() {
    const { containerClassName, mapClassName } = this.props;
    return (
      <div className={containerClassName}>
        <div className={mapClassName} ref={el => (this.mapContainer = el)} />
      </div>
    );
  }
}

export default DynamicGoogleMap;
