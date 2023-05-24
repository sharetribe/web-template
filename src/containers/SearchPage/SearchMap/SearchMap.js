import React, { Component } from 'react';
import { arrayOf, func, number, string, shape, object } from 'prop-types';
import { useHistory } from 'react-router-dom';
import classNames from 'classnames';

import { useConfiguration } from '../../../context/configurationContext';
import { useRouteConfiguration } from '../../../context/routeConfigurationContext';
import { createResourceLocatorString } from '../../../util/routes';
import { createSlug } from '../../../util/urlHelpers';
import { propTypes } from '../../../util/types';
import { obfuscatedCoordinates } from '../../../util/maps';

import { hasParentWithClassName } from './SearchMap.helpers.js';
import * as searchMapMapbox from './SearchMapWithMapbox';
import * as searchMapGoogleMaps from './SearchMapWithGoogleMaps';
import ReusableMapContainer from './ReusableMapContainer';
import css from './SearchMap.module.css';

const REUSABLE_MAP_HIDDEN_HANDLE = 'reusableMapHidden';

const getSearchMapVariant = mapProvider => {
  const isGoogleMapsInUse = mapProvider === 'googleMaps';
  return isGoogleMapsInUse ? searchMapGoogleMaps : searchMapMapbox;
};
const getSearchMapVariantHandles = mapProvider => {
  const searchMapVariant = getSearchMapVariant(mapProvider);
  return {
    labelHandle: searchMapVariant.LABEL_HANDLE,
    infoCardHandle: searchMapVariant.INFO_CARD_HANDLE,
  };
};
const getFitMapToBounds = mapProvider => {
  const searchMapVariant = getSearchMapVariant(mapProvider);
  return searchMapVariant.fitMapToBounds;
};
const getSearchMapVariantComponent = mapProvider => {
  const searchMapVariant = getSearchMapVariant(mapProvider);
  return searchMapVariant.default;
};

const withCoordinatesObfuscated = (listings, offset) => {
  return listings.map(listing => {
    const { id, attributes, ...rest } = listing;
    const origGeolocation = attributes.geolocation;
    const cacheKey = id ? `${id.uuid}_${origGeolocation.lat}_${origGeolocation.lng}` : null;
    const geolocation = obfuscatedCoordinates(origGeolocation, offset, cacheKey);
    return {
      id,
      ...rest,
      attributes: {
        ...attributes,
        geolocation,
      },
    };
  });
};

export class SearchMapComponent extends Component {
  constructor(props) {
    super(props);

    this.listings = [];
    this.mapRef = null;

    let mapReattachmentCount = 0;

    if (typeof window !== 'undefined') {
      if (window.mapReattachmentCount) {
        mapReattachmentCount = window.mapReattachmentCount;
      } else {
        window.mapReattachmentCount = 0;
      }
    }

    this.state = { infoCardOpen: null, mapReattachmentCount };

    this.createURLToListing = this.createURLToListing.bind(this);
    this.onListingInfoCardClicked = this.onListingInfoCardClicked.bind(this);
    this.onListingClicked = this.onListingClicked.bind(this);
    this.onMapClicked = this.onMapClicked.bind(this);
    this.onMapLoadHandler = this.onMapLoadHandler.bind(this);
  }

  componentWillUnmount() {
    this.listings = [];
  }

  createURLToListing(listing) {
    const routes = this.props.routeConfiguration;

    const id = listing.id.uuid;
    const slug = createSlug(listing.attributes.title);
    const pathParams = { id, slug };

    return createResourceLocatorString('ListingPage', routes, pathParams, {});
  }

  onListingClicked(listings) {
    this.setState({ infoCardOpen: listings });
  }

  onListingInfoCardClicked(listing) {
    if (this.props.onCloseAsModal) {
      this.props.onCloseAsModal();
    }

    // To avoid full page refresh we need to use internal router
    const history = this.props.history;
    history.push(this.createURLToListing(listing));
  }

  onMapClicked(e) {
    // Close open listing popup / infobox, unless the click is attached to a price label
    const variantHandles = getSearchMapVariantHandles(this.props.config.maps.mapProvider);
    const labelClicked = hasParentWithClassName(e.nativeEvent.target, variantHandles.labelHandle);
    const infoCardClicked = hasParentWithClassName(
      e.nativeEvent.target,
      variantHandles.infoCardHandle
    );
    if (this.state.infoCardOpen != null && !labelClicked && !infoCardClicked) {
      this.setState({ infoCardOpen: null });
    }
  }

  onMapLoadHandler(map) {
    this.mapRef = map;

    if (this.mapRef && this.state.mapReattachmentCount === 0) {
      // map is ready, let's fit search area's bounds to map's viewport
      const fitMapToBounds = getFitMapToBounds(this.props.config.maps.mapProvider);
      fitMapToBounds(this.mapRef, this.props.bounds, { padding: 0, isAutocompleteSearch: true });
    }
  }

  render() {
    const {
      id,
      className,
      rootClassName,
      reusableContainerClassName,
      bounds,
      center,
      location,
      listings: originalListings,
      onMapMoveEnd,
      zoom,
      config,
      activeListingId,
      messages,
    } = this.props;
    const classes = classNames(rootClassName || css.root, className);

    const listingsWithLocation = originalListings.filter(l => !!l.attributes.geolocation);
    const listings = config.maps.fuzzy.enabled
      ? withCoordinatesObfuscated(listingsWithLocation, config.maps.fuzzy.offset)
      : listingsWithLocation;
    const infoCardOpen = this.state.infoCardOpen;

    const forceUpdateHandler = () => {
      // Update global reattachement count
      window.mapReattachmentCount += 1;
      // Initiate rerendering
      this.setState({ mapReattachmentCount: window.mapReattachmentCount });
    };
    const mapProvider = config.maps.mapProvider;
    const SearchMapVariantComponent = getSearchMapVariantComponent(mapProvider);

    return getSearchMapVariant(mapProvider).isMapsLibLoaded() ? (
      <ReusableMapContainer
        className={reusableContainerClassName}
        reusableMapHiddenHandle={REUSABLE_MAP_HIDDEN_HANDLE}
        onReattach={forceUpdateHandler}
        messages={messages}
        config={config}
      >
        <SearchMapVariantComponent
          id={id}
          className={classes}
          bounds={bounds}
          center={center}
          location={location}
          infoCardOpen={infoCardOpen}
          listings={listings}
          activeListingId={activeListingId}
          mapComponentRefreshToken={this.state.mapReattachmentCount}
          createURLToListing={this.createURLToListing}
          onClick={this.onMapClicked}
          onListingClicked={this.onListingClicked}
          onListingInfoCardClicked={this.onListingInfoCardClicked}
          onMapLoad={this.onMapLoadHandler}
          onMapMoveEnd={onMapMoveEnd}
          reusableMapHiddenHandle={REUSABLE_MAP_HIDDEN_HANDLE}
          zoom={zoom}
          config={config}
        />
      </ReusableMapContainer>
    ) : (
      <div className={classes} />
    );
  }
}

SearchMapComponent.defaultProps = {
  id: 'searchMap',
  className: null,
  rootClassName: null,
  mapRootClassName: null,
  reusableContainerClassName: null,
  bounds: null,
  center: null,
  activeListingId: null,
  listings: [],
  onCloseAsModal: null,
  zoom: 11,
};

SearchMapComponent.propTypes = {
  id: string,
  className: string,
  rootClassName: string,
  mapRootClassName: string,
  reusableContainerClassName: string,
  bounds: propTypes.latlngBounds,
  center: propTypes.latlng,
  location: shape({
    search: string.isRequired,
  }).isRequired,
  activeListingId: propTypes.uuid,
  listings: arrayOf(propTypes.listing),
  onCloseAsModal: func,
  onMapMoveEnd: func.isRequired,
  zoom: number,
  messages: object.isRequired,

  // from useConfiguration
  config: object.isRequired,

  // from useRouteConfiguration
  routeConfiguration: arrayOf(propTypes.route).isRequired,

  // from useHistory
  history: shape({
    push: func.isRequired,
  }).isRequired,
};

const SearchMap = props => {
  const config = useConfiguration();
  const routeConfiguration = useRouteConfiguration();
  const history = useHistory();
  return (
    <SearchMapComponent
      config={config}
      routeConfiguration={routeConfiguration}
      history={history}
      {...props}
    />
  );
};

export default SearchMap;
