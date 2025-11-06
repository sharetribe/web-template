import React from 'react';
import { Form as FinalForm } from 'react-final-form';
import classNames from 'classnames';

// Import contexts and util modules
import { FormattedMessage, intlShape } from '../../../util/reactIntl.js';
import { propTypes } from '../../../util/types.js';
import * as validators from '../../../util/validators.js';

// Import shared components
import { FieldTextInput, Form, PrimaryButton } from '../../../components/index.js';

import css from './RequestQuoteForm.module.css';

/**
 * Request a quote step in the default-negotiation process.
 * It's provider's job to make offer for "request" type of listings.
 *
 * @param {Object} props - The component props.
 * @param {boolean} props.scrollingDisabled - Whether scrolling is disabled.
 * @param {string} props.processName - The process name.
 * @param {propTypes.listing} props.listing - The listing.
 * @param {string} props.listingTitle - The listing title.
 * @param {string} props.title - The title.
 * @param {intlShape} props.intl - The intl object.
 * @param {Object} props.config - The config object.
 * @param {propTypes.error} props.initiateInquiryError - The error message.
 */
export const RequestQuoteForm = props => {
  const {
    intl,
    config,
    errorMessageComponent: ErrorMessage,
    requestQuoteError,
    onSubmit,
    ...restProps
  } = props;

  return (
    <FinalForm
      initialValues={{}}
      onSubmit={onSubmit}
      {...restProps}
      render={formRenderProps => {
        const {
          rootClassName,
          className,
          submitButtonWrapperClassName,
          formId,
          handleSubmit,
          inProgress,
          invalid,
          authorDisplayName,
        } = formRenderProps;

        const classes = classNames(rootClassName || css.root, className);
        const submitInProgress = inProgress;
        const submitDisabled = invalid || submitInProgress;

        return (
          <Form className={classes} onSubmit={handleSubmit} enforcePagePreloadFor="SaleDetailsPage">
            <div className={css.section}>
              <FieldTextInput
                className={css.fieldDefaultMessage}
                type="textarea"
                name="customerDefaultMessage"
                id={formId ? `${formId}.message` : 'message'}
                labelClassName={css.sectionHeading}
                label={intl.formatMessage({
                  id: 'RequestQuotePage.defaultMessageLabel',
                })}
                placeholder={intl.formatMessage(
                  {
                    id: 'RequestQuotePage.defaultMessagePlaceholder',
                  },
                  { authorDisplayName }
                )}
                validate={validators.required(
                  intl.formatMessage({ id: 'RequestQuotePage.defaultMessageRequired' })
                )}
              />
            </div>

            <div className={submitButtonWrapperClassName}>
              <ErrorMessage error={requestQuoteError} />
              <PrimaryButton type="submit" inProgress={submitInProgress} disabled={submitDisabled}>
                <FormattedMessage id="RequestQuotePage.submitButtonText" />
              </PrimaryButton>
              <div className={css.finePrint}>
                <FormattedMessage
                  id="RequestQuotePage.finePrint"
                  values={{ providerName: authorDisplayName }}
                />
              </div>
            </div>
          </Form>
        );
      }}
    />
  );
};

export default RequestQuoteForm;
