import React from 'react';
import { bool, func, number, string } from 'prop-types';
import { Form as FinalForm, FormSpy } from 'react-final-form';

import config from '../../../config';
import { FormattedMessage, intlShape, useIntl } from '../../../util/reactIntl';
import { propTypes } from '../../../util/types';
import { Form, FieldSelect, PrimaryButton } from '../../../components';

import EstimatedCustomerBreakdownMaybe from '../EstimatedCustomerBreakdownMaybe';

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
    <div>
      <h3>Order breakdown</h3>
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
      <FieldSelect id={`${formId}.quantity`} name="quantity" label={'Quantity'}>
        <option disabled value="">
          Select quantity
        </option>
        {quantityOptions.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </FieldSelect>
      <FieldSelect id={`${formId}.deliveryMethod`} name="deliveryMethod" label={'Delivery method'}>
        <option disabled value="">
          Select delivery method
        </option>
        <option value={'pickup'}>Pickup</option>
        <option value={'shipping'}>Shipping</option>
      </FieldSelect>
      {breakdown}
      <PrimaryButton type="submit" inProgress={submitInProgress} disabled={submitDisabled}>
        Buy now
      </PrimaryButton>
      <p>You won't be charged yet.</p>
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
