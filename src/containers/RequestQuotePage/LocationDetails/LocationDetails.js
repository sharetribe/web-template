import React from 'react';

// Import contexts and util modules
import { FormattedMessage } from '../../../util/reactIntl.js';

// Import shared components
import { Heading } from '../../../components/index.js';

import css from './LocationDetails.module.css';

/**
 * LocationDetails component
 * @param {Object} props - The component props
 * @param {boolean} props.showLocation - Whether to show the location details
 * @param {Object} props.listingLocation - The listing location object
 * @param {string} [props.listingLocation.building] - The building name
 * @param {string} [props.listingLocation.address] - The address
 * @param {string} props.sectionHeadingClassName - The class name for the section heading
 * @returns {React.ReactElement} The LocationDetails component
 */
const LocationDetails = props => {
  const { showLocation, listingLocation, sectionHeadingClassName } = props;

  const locationDetails = listingLocation?.building
    ? `${listingLocation.building}, ${listingLocation.address}`
    : listingLocation?.address
    ? listingLocation.address
    : null;

  return showLocation && locationDetails ? (
    <div className={css.locationContainer}>
      <Heading as="h3" rootClassName={sectionHeadingClassName}>
        <FormattedMessage id="RequestQuotePage.locationDetailsTitle" />
      </Heading>
      <p className={css.locationDetails}>{locationDetails}</p>
    </div>
  ) : null;
};

export default LocationDetails;
