import React, { useState } from 'react';
import { bool, node, object, shape, string } from 'prop-types';
import { Form as FinalForm } from 'react-final-form';
import classNames from 'classnames';

// Import contexts and util modules
import { FormattedMessage, intlShape } from '../../util/reactIntl';
import { displayPrice } from '../../util/configHelpers';
import { pathByRouteName } from '../../util/routes';
import { propTypes } from '../../util/types';
import { formatMoney } from '../../util/currency';
import { createSlug } from '../../util/urlHelpers';
import { isTransactionInitiateListingNotFoundError } from '../../util/errors';
import * as validators from '../../util/validators';
import { getProcess } from '../../transactions/transaction';

// Import shared components
import {
  FieldTextInput,
  Form,
  H3,
  H4,
  Heading,
  NamedLink,
  Page,
  PrimaryButton,
} from '../../components';

import { getTransactionTypeData } from './CheckoutPageTransactionHelpers.js';

import CustomTopbar from './CustomTopbar';
import DetailsSideCard from './DetailsSideCard';
import MobileListingImage from './MobileListingImage';

import css from './CheckoutPage.module.css';

const ErrorMessage = props => {
  const { error } = props;

  // Since the listing data is already given from the ListingPage
  // and stored to handle refreshes, it might not have the possible
  // deleted or closed information in it. If the transaction
  // initiate or the speculative initiate fail due to the listing
  // being deleted or closed, we should dig the information from the
  // errors and not the listing data.
  const listingNotFound = isTransactionInitiateListingNotFoundError(error);

  // No transaction process attached to listing
  const noTransactionProcessAlias = error?.message === 'No transaction process attached to listing';

  return error ? (
    <p className={css.error}>
      {listingNotFound ? (
        <FormattedMessage id="CheckoutPage.listingNotFoundError" />
      ) : noTransactionProcessAlias ? (
        <FormattedMessage id="CheckoutPageWithInquiryProcess.initiateInquiryErrorNoProcess" />
      ) : (
        <FormattedMessage id="CheckoutPageWithInquiryProcess.initiateInquiryError" />
      )}
    </p>
  ) : null;
};

const handleSubmit = (submitting, setSubmitting, props) => values => {
  if (submitting) {
    return;
  }
  setSubmitting(true);

  const {
    history,
    config,
    routeConfiguration,
    pageData,
    processName,
    onInquiryWithoutPayment,
    onSubmitCallback,
  } = props;

  const { inquiryMessage } = values;

  const { listingType, transactionProcessAlias, unitType } =
    pageData?.listing?.attributes?.publicData || {};

  const process = processName ? getProcess(processName) : null;
  const transitions = process.transitions;
  const transition = transitions.INQUIRE_WITHOUT_PAYMENT;

  // These are the inquiry parameters for the (one and only) transition
  const inquiryParams = {
    listingId: pageData?.listing?.id,
    protectedData: {
      inquiryMessage,
      ...getTransactionTypeData(listingType, unitType, config),
    },
  };

  // This makes a single transition directly to the API endpoint
  // (unlike in the payment-related processes, where call is proxied through the server to make privileged transition)
  onInquiryWithoutPayment(inquiryParams, transactionProcessAlias, transition)
    .then(transactionId => {
      setSubmitting(false);
      onSubmitCallback();

      const orderDetailsPath = pathByRouteName('OrderDetailsPage', routeConfiguration, {
        id: transactionId.uuid,
      });
      history.push(orderDetailsPath);
    })
    .catch(err => {
      console.error(err);
      setSubmitting(false);
    });
};

export const CheckoutPageWithInquiryProcess = props => {
  const [submitting, setSubmitting] = useState(false);

  const {
    scrollingDisabled,
    intl,
    config,
    processName,
    pageData,
    listingTitle,
    title,
    initiateInquiryError,
  } = props;

  const onSubmit = handleSubmit(submitting, setSubmitting, props);

  const { listing } = pageData;
  const { price, publicData } = listing?.attributes || {};
  const firstImage = listing?.images?.length > 0 ? listing.images[0] : null;
  const listingTitleLink = (
    <NamedLink
      name="ListingPage"
      params={{ id: listing?.id?.uuid, slug: createSlug(listingTitle) }}
    >
      {listingTitle}
    </NamedLink>
  );

  const listingType = publicData?.listingType;
  const listingTypeConfigs = config.listing.listingTypes;
  const listingTypeConfig = listingTypeConfigs.find(conf => conf.listingType === listingType);
  const showPrice = displayPrice(listingTypeConfig);

  return (
    <Page title={title} scrollingDisabled={scrollingDisabled}>
      <CustomTopbar intl={intl} linkToExternalSite={config?.topbar?.logoLink} />
      <div className={css.contentContainer}>
        <MobileListingImage
          listingTitle={listingTitle}
          author={listing?.author}
          firstImage={firstImage}
          layoutListingImageConfig={config.layout.listingImage}
        />
        <div className={css.orderFormContainer}>
          <div className={css.headingContainer}>
            <H3 as="h1" className={css.heading}>
              {title}
            </H3>
            <H4 as="h2" className={css.detailsHeadingMobile}>
              <FormattedMessage
                id="CheckoutPage.listingTitle"
                values={{ listingTitle: listingTitleLink }}
              />

              {showPrice && price ? (
                <>
                  <br />
                  <span className={css.inquiryPrice}>{formatMoney(intl, price)}</span>
                </>
              ) : null}
            </H4>
          </div>

          <section className={css.paymentContainer}>
            <FinalForm
              onSubmit={onSubmit}
              render={formRenderProps => {
                const {
                  rootClassName,
                  className,
                  submitButtonWrapperClassName,
                  formId,
                  handleSubmit,
                  inProgress,
                  authorDisplayName,
                } = formRenderProps;

                const classes = classNames(rootClassName || css.root, className);
                const submitInProgress = inProgress;
                const submitDisabled = submitInProgress;

                return (
                  <Form
                    className={classes}
                    onSubmit={handleSubmit}
                    enforcePagePreloadFor="OrderDetailsPage"
                  >
                    <div className={css.section}>
                      <Heading as="h4" rootClassName={css.sectionHeading}>
                        <FormattedMessage
                          id="CheckoutPageWithInquiryProcess.messageLabel"
                          values={{ authorDisplayName }}
                        />
                      </Heading>

                      <FieldTextInput
                        className={css.fieldInquiryMessage}
                        type="textarea"
                        name="inquiryMessage"
                        id={formId ? `${formId}.message` : 'message'}
                        placeholder={intl.formatMessage(
                          {
                            id: 'CheckoutPageWithInquiryProcess.messagePlaceholder',
                          },
                          { authorDisplayName }
                        )}
                        validate={validators.requiredAndNonEmptyString(
                          intl.formatMessage({
                            id: 'CheckoutPageWithInquiryProcess.messageRequired',
                          })
                        )}
                      />
                    </div>

                    <div className={submitButtonWrapperClassName}>
                      <ErrorMessage error={initiateInquiryError} />
                      <PrimaryButton
                        type="submit"
                        inProgress={submitInProgress}
                        disabled={submitDisabled}
                      >
                        <FormattedMessage id="CheckoutPageWithInquiryProcess.submitButtonText" />
                      </PrimaryButton>
                    </div>
                  </Form>
                );
              }}
            />
          </section>
        </div>

        <DetailsSideCard
          listing={listing}
          listingTitle={listingTitle}
          author={listing?.author}
          firstImage={firstImage}
          layoutListingImageConfig={config.layout.listingImage}
          processName={processName}
          showPrice={showPrice && !!price}
          intl={intl}
        />
      </div>
    </Page>
  );
};

CheckoutPageWithInquiryProcess.propTypes = {
  showPrice: true,
};

CheckoutPageWithInquiryProcess.propTypes = {
  scrollingDisabled: bool.isRequired,
  pageData: shape({
    listing: propTypes.listing.isRequired,
    transaction: propTypes.transaction,
    orderData: object,
  }).isRequired,
  processName: string.isRequired,
  listingTitle: node.isRequired,
  title: node.isRequired,
  showPrice: bool,

  // from useIntl
  intl: intlShape.isRequired,

  // from useConfiguration
  config: object.isRequired,
};

export default CheckoutPageWithInquiryProcess;
