import React from 'react';
import classNames from 'classnames';

import config from '../../../config';
import getCountryCodes from '../../../translations/countryCodes';
import { FormattedMessage } from '../../../util/reactIntl';

import AddressLinkMaybe from './AddressLinkMaybe';

import css from './TransactionPanel.module.css';

// Functional component as a helper to build ActivityFeed section
const DeliveryInfoMaybe = props => {
  const { className, rootClassName, transaction, listing } = props;
  const classes = classNames(rootClassName || css.deliveryInfoContainer, className);
  const protectedData = transaction?.attributes?.protectedData;
  const deliveryMethod = protectedData?.deliveryMethod;
  const isShipping = deliveryMethod === 'shipping';
  const isPickup = deliveryMethod === 'pickup';

  if (isPickup) {
    const pickupLocation = listing?.attributes?.publicData.location || {};
    return (
      <div className={classes}>
        <h3 className={css.sectionHeading}>
          <FormattedMessage id="TransactionPanel.pickupInfoHeading" />
        </h3>
        <div className={css.pickupInfoContent}>
          <AddressLinkMaybe
            linkRootClassName={css.pickupAddress}
            location={pickupLocation}
            geolocation={listing?.attributes?.geolocation}
            showAddress={true}
          />
        </div>
      </div>
    );
  } else if (isShipping) {
    const { name, phoneNumber, address } = protectedData?.shippingDetails || {};
    const { line1, line2, city, postalCode, state, country: countryCode } = address || {};
    const phoneMaybe = !!phoneNumber ? (
      <>
        {phoneNumber}
        <br />
      </>
    ) : null;

    const countryCodes = getCountryCodes(config.locale);
    const countryInfo = countryCodes.find(c => c.code === countryCode);
    const country = countryInfo?.name;

    return (
      <div className={classes}>
        <h3 className={css.sectionHeading}>
          <FormattedMessage id="TransactionPanel.shippingInfoHeading" />
        </h3>
        <div className={css.shippingInfoContent}>
          {name}
          <br />
          {phoneMaybe}
          {line1}
          {line2 ? `, ${line2}` : ''}
          <br />
          {postalCode}, {city}
          <br />
          {state ? `${state}, ` : ''}
          {country}
          <br />
        </div>
      </div>
    );
  }
  return null;
};

export default DeliveryInfoMaybe;
