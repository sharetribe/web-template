import React from 'react';
import classNames from 'classnames';
import { FormattedMessage } from 'react-intl';

import { Heading } from '../../../../components';
import AddressLinkMaybe from '../../../../containers/TransactionPage/TransactionPanel/AddressLinkMaybe';
import { SELL_PURCHASE_PROCESS_NAME } from '../../sellPurchase/transactions/transactionProcessSellPurchase';

import css from './ManagerInformationMaybe.module.css';

function ManagerInformationMaybe({
  protectedData = {},
  stateData = {},
  className,
  headingClassName,
}) {
  const { processName } = stateData;
  const {
    managerAddress,
    managerAddressGeo,
    managerEmail,
    managerName,
    managerPhoneNumber,
  } = protectedData;

  const classes = classNames(css.root, className);
  const headingClasses = classNames(css.heading, headingClassName);

  if (processName !== SELL_PURCHASE_PROCESS_NAME) {
    return null;
  }

  return (
    <div className={classes}>
      <Heading as="h3" rootClassName={headingClasses}>
        <FormattedMessage id="TransactionPanel.managerInformationHeading" />
      </Heading>
      {!!managerName && (
        <p className={css.sectionContent}>
          <FormattedMessage id="TransactionPanel.managerNameContent" values={{ managerName }} />
        </p>
      )}
      {!!managerPhoneNumber && (
        <p className={css.sectionContent}>
          <FormattedMessage
            id="TransactionPanel.managerPhoneNumberContent"
            values={{ managerPhoneNumber }}
          />
        </p>
      )}
      {!!managerEmail && (
        <p className={css.sectionContent}>
          <FormattedMessage id="TransactionPanel.managerEmailTitle" />
          <a href={`mailto:${managerEmail}`}>{managerEmail}</a>
        </p>
      )}

      {!!managerAddress && !!managerAddressGeo && (
        <AddressLinkMaybe
          linkRootClassName={css.locationAddress}
          location={{ address: managerAddress }}
          geolocation={managerAddressGeo}
          showAddress={true}
          prefixElement={<FormattedMessage id="TransactionPanel.managerAddressTitle" />}
        />
      )}
    </div>
  );
}

export default ManagerInformationMaybe;
