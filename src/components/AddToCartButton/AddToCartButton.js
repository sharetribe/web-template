import React from 'react';
import css from '../AddToCartButton/AddToCartButton.module.css';
import { Button } from '..';

const AddToCartButton = props => {
  const {
    listing,
    count,
    incrementCart,
    isListingPage,
    buttonLabel,
    cartLabel,
    isBooking = false,
    showProductOrderForm = true,
    isOwnListing = false,
  } = props;

  //if (isBooking || !showProductOrderForm) {
  //  return null;
  //}

  const increaseCount = () => incrementCart(1);
  const decreaseCount = () => incrementCart(-1);

  const currentStock = listing?.currentStock?.attributes.quantity;
  const isMaxItems = currentStock <= count;

  if (!count || (count === 0 && currentStock > 0)) {
    return (
      <Button
        onClick={() => {
          if (!isOwnListing) increaseCount();
        }}
      >
        {buttonLabel}
      </Button>
    );
  } else {
    return (
      <div>
        {isListingPage && (cartLabel)}
        <div className={css.buttonContainer}>
          <Button className={css.smallButton} onClick={decreaseCount}>
            -
          </Button>
          <span className={css.countContainer}>{count}</span>
          <Button className={css.smallButton} disabled={isMaxItems} onClick={increaseCount}>
            +
          </Button>
        </div>
      </div>
    );
  }
};

AddToCartButton.defaultProps = {
  isListingPage: false,
};

export default AddToCartButton;