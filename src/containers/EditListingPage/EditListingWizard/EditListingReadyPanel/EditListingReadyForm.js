import React from 'react';
import { Form as FinalForm } from 'react-final-form';
import classNames from 'classnames';

// Import configs and util modules
import { FormattedMessage, useIntl } from '../../../../util/reactIntl';

// Import shared components
import { Button, FieldCheckbox, Form, NamedLink } from '../../../../components';

// Import modules from this directory
import css from './EditListingReadyForm.module.css';

const validateChecked = value =>
  Array.isArray(value) && value.length > 0 ? undefined : 'required';

const PublishListingError = props =>
  props.error ? (
    <p className={css.error}>
      <FormattedMessage id="EditListingReadyForm.publishListingFailed" />
    </p>
  ) : null;

const UpdateListingError = props =>
  props.error ? (
    <p className={css.error}>
      <FormattedMessage id="EditListingReadyForm.updateFailed" />
    </p>
  ) : null;

/**
 * The EditListingReadyForm component.
 * Final step — submitting this form publishes the listing.
 *
 * @component
 * @param {Object} props
 * @returns {JSX.Element}
 */
export const EditListingReadyForm = props => {
  const intl = useIntl();

  return (
    <FinalForm
      {...props}
      render={formRenderProps => {
        const {
          className,
          fetchErrors,
          handleSubmit,
          invalid,
          listingId,
          listingSlug,
          previewVariant,
          ready,
          saveActionMsg,
          updated,
          updateInProgress,
        } = formRenderProps;

        const { publishListingError, updateListingError } = fetchErrors || {};

        const submitReady = updated || ready;
        const submitInProgress = updateInProgress;
        const submitDisabled = submitInProgress || invalid;
        const classes = classNames(css.root, className);

        return (
          <Form className={classes} onSubmit={handleSubmit}>
            <div className={css.checkboxList}>
              <FieldCheckbox
                id="agreedToTerms"
                name="agreedToTerms"
                value="agreed"
                validate={validateChecked}
                label={
                  <FormattedMessage
                    id="EditListingReadyForm.agreedToTerms"
                    values={{
                      termsLink: (
                        <NamedLink name="TermsOfServicePage" className={css.termsLink}>
                          <FormattedMessage id="EditListingReadyForm.sellerTerms" />
                        </NamedLink>
                      ),
                    }}
                  />
                }
              />
              <FieldCheckbox
                id="confirmedOriginalContent"
                name="confirmedOriginalContent"
                value="confirmed"
                validate={validateChecked}
                label={intl.formatMessage({ id: 'EditListingReadyForm.confirmedOriginalContent' })}
              />
              <FieldCheckbox
                id="confirmedNoAi"
                name="confirmedNoAi"
                value="confirmed"
                validate={validateChecked}
                label={intl.formatMessage({ id: 'EditListingReadyForm.confirmedNoAi' })}
              />
            </div>

            <PublishListingError error={publishListingError} />
            <UpdateListingError error={updateListingError} />

            <div className={css.bottomActions}>
              <NamedLink
                className={css.previewButton}
                name={previewVariant ? 'ListingPageVariant' : 'ListingPage'}
                params={
                  previewVariant
                    ? { slug: listingSlug, id: listingId, variant: previewVariant }
                    : { slug: listingSlug, id: listingId }
                }
              >
                <FormattedMessage id="EditListingReadyForm.previewListing" />
              </NamedLink>

              <Button
                className={css.submitButton}
                type="submit"
                inProgress={submitInProgress}
                ready={submitReady}
                disabled={submitDisabled}
              >
                {saveActionMsg}
              </Button>
            </div>
          </Form>
        );
      }}
    />
  );
};

export default EditListingReadyForm;
