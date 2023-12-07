import { types as sdkTypes } from '../util/sdkLoader';

const { LatLng, LatLngBounds } = sdkTypes;

const defaultLocations = [
  {
    id: 'default-thessaloniki',
    predictionPlace: {
      address: 'Thessaloniki, Greece',
      bounds: new LatLngBounds(
        new LatLng(40.629269, 22.947412),  // Southwestern point
        new LatLng(40.650846, 22.991094)   // Northeastern point
      ),
    },
  }
];
export default defaultLocations;
