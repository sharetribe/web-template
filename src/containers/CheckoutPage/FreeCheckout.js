import React from 'react';
import { connect } from 'react-redux';
import { initiateOrder } from './CheckoutPage.duck'; 
import { useHistory } from 'react-router-dom';
import CustomTopbar from './CustomTopbar';
import {updateTransaction} from '../../util/api';

const FreeCheckout = ({
  intl,
  pageData,
  title,
  onInitiateOrder,
  currentUser,
}) => {
  const history = useHistory(); 

  const handleConfirmBooking = () => {
   
    const customerEmail = currentUser?.attributes?.email;
    const seats = pageData.orderData?.seats ? Number(pageData.orderData.seats) : null;
    const seatNames = pageData.orderData?.guestNames;
    const seatsMaybe = seats ? { seats } : {};
    const guestsNameMaybe = seatNames ? { seatNames } : {};
    const fee = pageData.orderData?.fee || [''];
    const voucherFee = pageData.orderData?.voucherFee || 0;
    const languageMaybe = pageData.orderData.Language  
      ? { Language: pageData.orderData.Language }
      : {};
    const locationMaybe = pageData.orderData.Location
      ? { Location: pageData.orderData.Location }
      : {};

    const protectedDataMaybe = {
      protectedData: {
        ...guestsNameMaybe,
        ...languageMaybe,
        ...locationMaybe,
        fee: fee,
        email: customerEmail,
      },
    };

    const orderParams = {
      listingId: pageData?.listing?.id.uuid,
      bookingStart: pageData?.orderData?.bookingDates?.bookingStart,
      bookingEnd: pageData?.orderData?.bookingDates?.bookingEnd,
      seats: pageData?.orderData?.seats || 1,
      ...protectedDataMaybe,
    };

    const processAlias = 'default-booking/release-1';
    const transitionName = 'transition/request-payment-gift';
    const isPrivileged = true;

    onInitiateOrder(orderParams, processAlias, null, transitionName, isPrivileged)
      .then((order) => {
        const updatePayload = {
          transactionId: order.id.uuid,
          pageData: pageData,
          total: order.attributes.payinTotal.amount,
        };
        return updateTransaction(updatePayload)
        .then(() => {
          // Navigate to /order/{transactionId} after successful update
          history.push(`/order/${order.id.uuid}`);
        })
        .catch((error) => {
          console.error('Failed to update transaction:', error);
          // Optional: Handle update transaction error
        });
    })
    .catch((error) => {
      console.error('Failed to initiate order:', error);
    });
  };

  return (
    <>
      <CustomTopbar intl={intl} />
      <div className="free-checkout-container">
        <h1>{title}</h1>
        <p>Your booking with a gift voucher has been applied!</p>
        <button onClick={handleConfirmBooking}>Confirm Booking</button>
      </div>
    </>
  );
};

const mapDispatchToProps = { initiateOrder };

export default connect(null, mapDispatchToProps)(FreeCheckout);
