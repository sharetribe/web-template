import { types as sdkTypes } from '../util/sdkLoader';

const { LatLng, LatLngBounds } = sdkTypes;

// An array of locations to show in the LocationAutocompleteInput when
// the input is in focus but the user hasn't typed in any search yet.
//
// Each item in the array should be an object with a unique `id` (String) and a
// `predictionPlace` (util.types.place) properties.
//
// NOTE: these are highly recommended, since they
//       1) help customers to find relevant locations, and
//       2) reduce the cost of using map providers geocoding API
const defaultLocations = [
  {
    id: 'default-bariloche',
    predictionPlace: {
      address: 'San Carlos de Bariloche, Río Negro, Argentina',
      bounds: new LatLngBounds(
        new LatLng(-41.140536, -71.308623),
        new LatLng(-41.125837, -71.288113)
      ),
    },
  },
  {
    id: 'default-bariloche2',
    predictionPlace: {
      address: 'Bariloche, Río Negro, Argentina',
      bounds: new LatLngBounds(
        new LatLng(-41.140536, -71.308623),
        new LatLng(-41.125837, -71.288113)
      ),
    },
  },
  {
    id: 'default-dina-huapi',
    predictionPlace: {
      address: 'Dina Huapi, Río Negro, Argentina',
      bounds: new LatLngBounds(
        new LatLng(-41.133472, -71.310693),
        new LatLng(-41.122620, -71.286236)
      ),
    },
  },
  {
    id: 'default-villa-la-angostura',
    predictionPlace: {
      address: 'Villa la Angostura, Neuquén, Argentina',
      bounds: new LatLngBounds(
        new LatLng(-40.7627426, -71.6417984),
        new LatLng(-40.7616474, -71.6447641)
      ),
    },
  }
  // {
  //   id: 'default-helsinki',
  //   predictionPlace: {
  //     address: 'Helsinki, Finland',
  //     bounds: new LatLngBounds(new LatLng(60.29783, 25.25448),
  //                              new LatLng(59.92248, 24.78287)),
  //   },
  // },
  // {
  //   id: 'default-turku',
  //   predictionPlace: {
  //     address: 'Turku, Finland',
  //     bounds: new LatLngBounds(new LatLng(60.53045, 22.38197), new LatLng(60.33361, 22.06644)),
  //   },
  // },
  // {
  //   id: 'default-tampere',
  //   predictionPlace: {
  //     address: 'Tampere, Finland',
  //     bounds: new LatLngBounds(new LatLng(61.83657, 24.11838), new LatLng(61.42728, 23.5422)),
  //   },
  // },
  // {
  //   id: 'default-oulu',
  //   predictionPlace: {
  //     address: 'Oulu, Finland',
  //     bounds: new LatLngBounds(new LatLng(65.56434, 26.77069), new LatLng(64.8443, 24.11494)),
  //   },
  // },
  // {
  //   id: 'default-ruka',
  //   predictionPlace: {
  //     address: 'Ruka, Finland',
  //     bounds: new LatLngBounds(new LatLng(66.16997, 29.16773), new LatLng(66.16095, 29.13572)),
  //   },
  // },
];
export default defaultLocations;
