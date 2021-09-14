import React from 'react';
import { bool, func, number, string } from 'prop-types';
import { Form as FinalForm, FormSpy } from 'react-final-form';

import config from '../../../config';
import { FormattedMessage, intlShape, useIntl } from '../../../util/reactIntl';
import { propTypes } from '../../../util/types';
import { Form, FieldSelect, PrimaryButton } from '../../../components';

import EstimatedCustomerBreakdownMaybe from '../EstimatedCustomerBreakdownMaybe';

import css from './ProductOrderForm.module.css';

const renderForm = formRenderProps => {
  const {
    // FormRenderProps from final-form
    handleSubmit,
    invalid,
    values,

    // Custom props passed to the form component
    intl,
    formId,
    price,
    currentStock,
    listingId,
    isOwnListing,
    onFetchTransactionLineItems,
    lineItems,
    fetchLineItemsInProgress,
    fetchLineItemsError,
  } = formRenderProps;
  const submitInProgress = fetchLineItemsInProgress;
  const submitDisabled = invalid;

  const handleOnChange = formValues => {
    const { quantity: quantityRaw, deliveryMethod } = formValues.values;
    const quantity = Number.parseInt(quantityRaw, 10);
    if (quantity && deliveryMethod && !fetchLineItemsInProgress) {
      onFetchTransactionLineItems({
        orderData: { quantity, deliveryMethod },
        listingId,
        isOwnListing,
      });
    }
  };

  const stockReservationQuantity = values?.stockReservationQuantity;
  const deliveryMethod = values?.deliveryMethod;
  const breakdownData = {};
  const showBreakdown =
    breakdownData && lineItems && !fetchLineItemsInProgress && !fetchLineItemsError;
  const breakdown = showBreakdown ? (
    <div className={css.breakdownWrapper}>
      <h3>
        <FormattedMessage id="ProductOrderForm.breakdownTitle" />
      </h3>
      <EstimatedCustomerBreakdownMaybe
        unitType={config.lineItemUnitType}
        breakdownData={breakdownData}
        lineItems={lineItems}
      />
    </div>
  ) : null;

  const quantityOptions = [...Array(currentStock).keys()].map(i => {
    const quantity = i + 1;
    return {
      value: quantity,
      label: quantity,
    };
  });

  return (
    <Form onSubmit={handleSubmit}>
      <FormSpy subscription={{ values: true }} onChange={handleOnChange} />
      <FieldSelect
        id={`${formId}.quantity`}
        className={css.quantityField}
        name="quantity"
        label={intl.formatMessage({ id: 'ProductOrderForm.quantityLabel' })}
      >
        <option disabled value="">
          {intl.formatMessage({ id: 'ProductOrderForm.selectQuantityOption' })}
        </option>
        {quantityOptions.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </FieldSelect>
      <FieldSelect
        id={`${formId}.deliveryMethod`}
        className={css.deliveryField}
        name="deliveryMethod"
        label={intl.formatMessage({ id: 'ProductOrderForm.deliveryMethodLabel' })}
      >
        <option disabled value="">
          {intl.formatMessage({ id: 'ProductOrderForm.selectDeliveryMethodOption' })}
        </option>
        <option value={'pickup'}>
          {intl.formatMessage({ id: 'ProductOrderForm.pickupOption' })}
        </option>
        <option value={'shipping'}>
          {intl.formatMessage({ id: 'ProductOrderForm.shippingOption' })}
        </option>
      </FieldSelect>
      {breakdown}
      <div className={css.submitButton}>
        <PrimaryButton type="submit" inProgress={submitInProgress} disabled={submitDisabled}>
          <FormattedMessage id="ProductOrderForm.ctaButton" />
        </PrimaryButton>
      </div>
      <p className={css.chargeInfo}>
        <FormattedMessage id="ProductOrderForm.chargeInfo" />
      </p>
    </Form>
  );
};

const ProductOrderForm = props => {
  const intl = useIntl();
  return <FinalForm {...props} intl={intl} render={renderForm} />;
};

ProductOrderForm.defaultProps = {
  rootClassName: null,
  className: null,
  price: null,
  currentStock: null,
  listingId: null,
  isOwnListing: false,
  lineItems: null,
  fetchLineItemsError: null,
};

ProductOrderForm.propTypes = {
  rootClassName: string,
  className: string,

  // form
  formId: string.isRequired,
  onSubmit: func.isRequired,

  // listing
  listingId: propTypes.uuid,
  price: propTypes.money,
  currentStock: number,
  isOwnListing: bool,

  // line items
  lineItems: propTypes.lineItems,
  onFetchTransactionLineItems: func.isRequired,
  fetchLineItemsInProgress: bool.isRequired,
  fetchLineItemsError: propTypes.error,
};

export default ProductOrderForm;
