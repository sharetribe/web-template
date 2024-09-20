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
    id: 'default-delhi',
    predictionPlace: {
      address: 'Delhi, India',
      bounds: new LatLngBounds(new LatLng(28.882121, 77.331936), new LatLng(28.403218, 76.838160)),
    },
  },
  {
    id: 'default-bangalore',
    predictionPlace: {
      address: 'Bangalore, India',
      bounds: new LatLngBounds(new LatLng(13.139236, 77.739029), new LatLng(12.734288, 77.379376)),
    },
  },
  
  {
    id: 'default-mumbai',
    predictionPlace: {
      address: 'Mumbai, India',
      bounds: new LatLngBounds(new LatLng(19.271208, 72.986532), new LatLng(18.892006, 72.775939)),
    },
  },
  {
    id: 'default-chennai',
    predictionPlace: {
      address: 'Chennai, India',
      bounds: new LatLngBounds(new LatLng(13.232469, 80.335623), new LatLng(12.828569, 80.157191)),
    },
  },
  {
    id: 'default-hyderabad',
    predictionPlace: {
      address: 'Hyderabad, India',
      bounds: new LatLngBounds(new LatLng(17.615695, 78.609289), new LatLng(17.172481, 78.284196)),
    },
  },
      
];
export default defaultLocations;
