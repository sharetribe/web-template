import React, { useState } from 'react';
import { Form as FinalForm, Field } from 'react-final-form';
import arrayMutators from 'final-form-arrays';

// Import configs and util modules
import { FormattedMessage, useIntl } from '../../../../util/reactIntl';

// Import shared components
import { Button, Form, ListingCardThumbnail, H5 } from '../../../../components';

import { colorSchemes } from '../../../../util/types';

// Import modules from this directory
import css from './EditListingStyleForm.module.css';

const FieldCardStyle = props => {
  const { className, id, value, name } = props;

  // A `cardStyle` attribute is stored in the listing extended data. This value is used to select the correct background
  // style when rendering the listing card. The colorSchemeMap object maps the value stored in extended data (cardStyle)
  // to a color value. This color is used to fill the radio button on the StyleForm page. See also types.js and ListingCardThumbnail.module.css
  // if you are modifying this map.
  const colorSchemeMap = {
    white: '--colorWhite',
    grey: '--colorGrey50',
    black: '--colorBlack',
    'main-brand': '--marketplaceColor',
    'primary-button': '--colorPrimaryButton',
  };

  return (
    <span className={css.fieldCardStyle}>
      <Field
        id={id}
        name={name}
        type="radio"
        value={value}
        className={css.radioButtonInput}
        component="input"
      />
      <label htmlFor={id} className={css.radioButtonLabel}>
        <div className={css.radioButtonIcon}>
          <div
            className={css.radioButtonBaseStyle}
            style={{ backgroundColor: `var(${colorSchemeMap[value]})` }}
          ></div>
        </div>
      </label>
    </span>
  );
};

export const EditListingStyleForm = props => {
  const { listingTitle } = props;

  return (
    <FinalForm
      {...props}
      mutators={{ ...arrayMutators }}
      render={formRenderProps => {
        const {
          formId = 'EditListingStyleForm',
          form,
          handleSubmit,
          ready,
          saveActionMsg,
          updated,
          updateInProgress,
          values,
        } = formRenderProps;
        const intl = useIntl();

        const submitInProgress = updateInProgress;
        const submitReady = updated || ready;
        const submitDisabled = submitInProgress;

        const fieldOptions = colorSchemes.map(colorScheme => {
          return (
            <FieldCardStyle
              id={`${formId}.Option.${colorScheme}`}
              key={`${formId}.Option.${colorScheme}`}
              value={colorScheme}
              name="cardStyle"
            />
          );
        });

        return (
          <Form className={css.root} onSubmit={handleSubmit}>
            <div className={css.radioButtonsContainer}>{fieldOptions}</div>
            <H5 as="h2" className={css.previewText}>
              <FormattedMessage id="EditListingStyleForm.preview" />
            </H5>
            <ListingCardThumbnail
              width={366}
              height={275}
              style={values.cardStyle}
              listingTitle={listingTitle}
              className={css.aspectRatioWrapper}
            ></ListingCardThumbnail>
            <Button
              className={css.submitButton}
              inProgress={submitInProgress}
              ready={submitReady}
              disabled={submitDisabled}
              type="submit"
            >
              {saveActionMsg}
            </Button>
          </Form>
        );
      }}
    />
  );
};

export default EditListingStyleForm;
