import React, { useState } from 'react';
import { FormattedMessage, useIntl } from '../../util/reactIntl';
import classNames from 'classnames';
import { propTypes } from '../../util/types';
import { obfuscatedCoordinates } from '../../util/maps';
import { Heading, Map } from '../../components';

import css from './ListingPage.module.css';

/**
 * The SectionMapMaybe component.
 *
 * @component
 * @param {Object} props
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} [props.rootClassName] - Custom class that overrides the default class for the root element
 * @param {propTypes.latlng} [props.geolocation] - The geolocation
 * @param {propTypes.uuid} props.listingId - The listing id
 * @returns {JSX.Element} section map maybe component
 */
const SectionMapMaybe = props => {
  const [isStatic, setIsStatic] = useState(true);
  const intl = useIntl();
  const { className, rootClassName, geolocation, publicData, listingId, mapsConfig } = props;

  if (!geolocation) {
    return null;
  }

  const address = publicData && publicData.location ? publicData.location.address : '';
  const classes = classNames(rootClassName || css.sectionMap, className);
  const cacheKey = listingId ? `${listingId.uuid}_${geolocation.lat}_${geolocation.lng}` : null;

  const mapProps = mapsConfig.fuzzy.enabled
    ? { obfuscatedCenter: obfuscatedCoordinates(geolocation, mapsConfig.fuzzy.offset, cacheKey) }
    : { address, center: geolocation };
  const map = <Map {...mapProps} useStaticMap={isStatic} />;

  return (
    <section className={classes} id="listing-location">
      <Heading as="h2" rootClassName={css.sectionHeadingWithExtraMargin}>
        <FormattedMessage id="ListingPage.locationTitle" />
      </Heading>
      {isStatic ? (
        <button
          className={css.map}
          onClick={() => {
            setIsStatic(false);
          }}
          aria-label={intl.formatMessage({ id: 'ListingPage.screenreader.showMap' })}
        >
          {map}
        </button>
      ) : (
        <div className={css.map}>{map}</div>
      )}
    </section>
  );
};

export default SectionMapMaybe;
