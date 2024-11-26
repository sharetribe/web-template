import React from 'react';
import { connect } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { initiateOrder } from './CheckoutPage.duck';
import CustomTopbar from './CustomTopbar';
import { updateTransaction } from '../../util/api';
import DetailsSideCard from './DetailsSideCard';
import { H3, H4, NamedLink, OrderBreakdown, Page, PrimaryButton } from '../../components';
import css from './CheckoutPage.module.css';
import MobileListingImage from './MobileListingImage';
import MobileOrderBreakdown from './MobileOrderBreakdown';
import { FormattedMessage, intlShape } from '../../util/reactIntl';

function FreeCheckout({
  intl,
  pageData,
  title,
  onInitiateOrder,
  currentUser,
  listing,
  listingTitle,
  errorMessages,
  processName,
  breakdown,
  scrollingDisabled,
}) {
  const history = useHistory();
  const firstImage = listing?.images?.[0];
  const customImageConfig = {
    variantType: 'cropImage',
    aspectRatio: '1/1',
    aspectWidth: 1,
    aspectHeight: 1,
    variantPrefix: 'listing-card',
  };

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
        fee,
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
          pageData,
          total: order.attributes.payinTotal.amount,
          isPending: true,
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
    <Page title={title} scrollingDisabled={scrollingDisabled}>
      <CustomTopbar intl={intl} />
      <div className={css.contentContainer}>
        <MobileListingImage
          listingTitle={listingTitle}
          author={listing?.author}
          firstImage={firstImage}
          layoutListingImageConfig={customImageConfig}
        />
        <div className={css.orderFormContainer}>
          <div className={css.headingContainer}>
            <H3 as="h1" className={css.heading}>
              {title}
            </H3>
            <H4 as="h2" className={css.detailsHeadingMobile}>
              <FormattedMessage id="CheckoutPage.listingTitle" values={{ listingTitle }} />
            </H4>
            <p>La tua prenotazione con un buono regalo è stata applicata!</p>
            <p>Procedi per completare la prenotazione.</p>
          </div>

          <MobileOrderBreakdown speculateTransactionErrorMessage={null} breakdown={breakdown} />

          <div className={css.submitContainer}>
            <PrimaryButton onClick={handleConfirmBooking}> Completa l'operazione</PrimaryButton>
          </div>
        </div>
        <DetailsSideCard
          listing={listing}
          listingTitle={listingTitle}
          author={listing?.author}
          firstImage={firstImage}
          layoutListingImageConfig={customImageConfig}
          speculateTransactionErrorMessage={null}
          isInquiryProcess={false}
          processName={processName}
          breakdown={breakdown}
          intl={intl}
        />
      </div>
    </Page>
  );
}

const mapDispatchToProps = { initiateOrder };

export default connect(null, mapDispatchToProps)(FreeCheckout);