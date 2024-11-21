import React from 'react';
import classNames from 'classnames';
import { createClient } from '@supabase/supabase-js';
import { updateGiftCard } from '../../../util/supabase';
import { PrimaryButton, SecondaryButton } from '../../../components';
import css from './TransactionPanel.module.css';
import { updateTransaction } from '../../../util/api';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY; // Ensure this is correctly set in your .env file
const supabase = createClient(supabaseUrl, supabaseKey);

function ActionButtonsMaybe(props) {
  const {
    className,
    rootClassName,
    showButtons,
    primaryButtonProps,
    secondaryButtonProps,
    isListingDeleted,
    isProvider,
    customerObj,
    giftCardProps,
    transactionId,
  } = props;
  // In default processes default processes need special handling
  // Booking: provider should not be able to accept on-going transactions
  // Product: customer should be able to dispute etc. on-going transactions
  if (isListingDeleted && isProvider) {
    return null;
  }

  const buttonsDisabled = primaryButtonProps?.inProgress || secondaryButtonProps?.inProgress;

  const insertBooking = async (obj) => {
    const { eventgeoLocation = { lat: null, lng: null }, ...rest } = obj;
    const { lat, lng } = eventgeoLocation;

    const newObj = {
      ...rest,
      latitude: lat,
      longitude: lng,
    };

    try {
      const { data, error } = await supabase.from('bookings').insert([newObj]);
    } catch (err) {
      console.error('Unexpected error inserting booking:', err);
    }
  };

  const handlePrimaryButtonClick = async () => {
    try {
      if (isProvider) {
        // Step 1: Insert the booking
        await insertBooking(customerObj);

        // Step 2: Check if there are gift card properties to update
        if (giftCardProps && giftCardProps.giftCardCode) {
          const dataArray = await updateGiftCard({ ...giftCardProps, isPending: false });

          // Ensure the response is an array and has data
          if (Array.isArray(dataArray) && dataArray.length > 0) {
            const data = dataArray[0]; // Extract the first object from the array

            const cardUpdatePayload = {
              transactionId,
              cardAmount: data.amount,
              cardType: data.isWellfare ? 'welfareCard' : 'giftCard',
              isPending: false,
            };

            await updateTransaction(cardUpdatePayload);
          } else {
            console.error('Unexpected data format from updateGiftCard:', dataArray);
          }
        }
      }

      // Step 4: Call primary button action if it exists
      if (primaryButtonProps?.onAction) {
        primaryButtonProps.onAction();
      }
    } catch (err) {
      // Log any errors that occur in the process
      console.error('Error handling primary button click:', err);
    }
  };

  const primaryButton = primaryButtonProps ? (
    <PrimaryButton
      inProgress={primaryButtonProps.inProgress}
      disabled={buttonsDisabled}
      onClick={handlePrimaryButtonClick}
    >
      {primaryButtonProps.buttonText}
    </PrimaryButton>
  ) : null;
  const primaryErrorMessage = primaryButtonProps?.error ? (
    <p className={css.actionError}>{primaryButtonProps?.errorText}</p>
  ) : null;

  const secondaryButton = secondaryButtonProps ? (
    <SecondaryButton
      inProgress={secondaryButtonProps?.inProgress}
      disabled={buttonsDisabled}
      onClick={secondaryButtonProps.onAction}
    >
      {secondaryButtonProps.buttonText}
    </SecondaryButton>
  ) : null;
  const secondaryErrorMessage = secondaryButtonProps?.error ? (
    <p className={css.actionError}>{secondaryButtonProps?.errorText}</p>
  ) : null;

  const classes = classNames(rootClassName || css.actionButtons, className);

  return showButtons ? (
    <div className={classes}>
      <div className={css.actionErrors}>
        {primaryErrorMessage}
        {secondaryErrorMessage}
      </div>
      <div className={css.actionButtonWrapper}>
        {secondaryButton}
        {primaryButton}
      </div>
    </div>
  ) : null;
}

export default ActionButtonsMaybe;
