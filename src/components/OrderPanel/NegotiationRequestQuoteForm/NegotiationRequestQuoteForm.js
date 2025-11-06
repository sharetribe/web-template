import React from 'react';
import { Form as FinalForm } from 'react-final-form';
import classNames from 'classnames';

import { FormattedMessage, useIntl } from '../../../util/reactIntl';

import { Form, PrimaryButton } from '../..';

import css from './NegotiationRequestQuoteForm.module.css';

const renderForm = formRenderProps => {
  // FormRenderProps from final-form
  const {
    formId,
    className,
    rootClassName,
    handleSubmit,
    payoutDetailsWarning,
    isOwnListing,
    finePrintComponent: FinePrint,
  } = formRenderProps;
  const classes = classNames(rootClassName || css.root, className);

  return (
    <Form id={formId} onSubmit={handleSubmit} className={classes}>
      <div className={css.submitButton}>
        <PrimaryButton type="submit">
          <FormattedMessage id="NegotiationRequestQuoteForm.ctaButton" />
        </PrimaryButton>
        <FinePrint
          payoutDetailsWarning={payoutDetailsWarning}
          isOwnListing={isOwnListing}
          omitYouWontBeChargedMessage={true}
        />
      </div>
    </Form>
  );
};

/**
 * A form to redirect user to the MakeOfferPage. It can be used to initialize the page if needed.
 * Note: by default, the form just shows a submit button.
 *
 * @component
 * @param {Object} props
 * @param {string} [props.rootClassName] - Custom class that overrides the default class for the root element
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} props.formId - The ID of the form
 * @param {Function} props.onSubmit - The function to handle the form submission
 * @returns {JSX.Element}
 */
const NegotiationRequestQuoteForm = props => {
  const intl = useIntl();
  const initialValues = {};

  return <FinalForm initialValues={initialValues} {...props} intl={intl} render={renderForm} />;
};

export default NegotiationRequestQuoteForm;
