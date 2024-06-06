import React, { Component } from 'react';
import { string } from 'prop-types';
import { FormattedMessage } from '../../util/reactIntl';
import classNames from 'classnames';
import { propTypes } from '../../util/types';
import { obfuscatedCoordinates } from '../../util/maps';
import { Heading, Map } from '../../components';

import css from './ListingPage.module.css';

class SectionMapMaybe extends Component {
  constructor(props) {
    super(props);
    this.state = { isStatic: true };
  }

  render() {
    const { className, rootClassName, geolocation, publicData, listingId, mapsConfig } = this.props;

    if (!geolocation) {
      return null;
    }

    const address = publicData && publicData.location ? publicData.location.address : '';
    const classes = classNames(rootClassName || css.sectionMap, className);
    const cacheKey = listingId ? `${listingId.uuid}_${geolocation.lat}_${geolocation.lng}` : null;

    const mapProps = mapsConfig.fuzzy.enabled
      ? { obfuscatedCenter: obfuscatedCoordinates(geolocation, mapsConfig.fuzzy.offset, cacheKey) }
      : { address, center: geolocation };
    const map = <Map {...mapProps} useStaticMap={this.state.isStatic} />;

    return (
      <div className={classes}>
        <Heading as="h2" rootClassName={css.sectionHeadingWithExtraMargin}>
          <FormattedMessage id="ListingPage.locationTitle" />
        </Heading>
        {this.state.isStatic ? (
          <button
            className={css.map}
            onClick={() => {
              this.setState({ isStatic: false });
            }}
          >
            {map}
          </button>
        ) : (
          <div className={css.map}>{map}</div>
        )}
      </div>
    );
  }
}

SectionMapMaybe.defaultProps = {
  rootClassName: null,
  className: null,
  geolocation: null,
  listingId: null,
};

SectionMapMaybe.propTypes = {
  rootClassName: string,
  className: string,
  geolocation: propTypes.latlng,
  listingId: propTypes.uuid,
};

export default SectionMapMaybe;
