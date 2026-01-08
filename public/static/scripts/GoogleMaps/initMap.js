// Note: the callback function is catching most calls to initMap function,
// but it is modified in SearchMapWithGoogleMaps.js for the full page load on SearchPageWithMap component.
// If you are using Google Maps on your custom components, you need to setup something similar there too.
window.initMap = () => {
  window.__googleMapsLoaded = true;
};
