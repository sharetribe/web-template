import React from 'react';
import '@testing-library/jest-dom';
import { Form as FinalForm, Field } from 'react-final-form';
import arrayMutators from 'final-form-arrays';

import { fakeIntl } from '../../../../util/testData';
import { renderWithProviders as render, testingLibrary } from '../../../../util/testHelpers';

import EditListingPhotosForm, { FieldAddImage } from './EditListingPhotosForm';

const { screen, userEvent, waitFor, act } = testingLibrary;

const noop = () => null;

describe('EditListingDeliveryForm', () => {
  it('matches snapshot', () => {
    const saveActionMsg = 'Save photos';
    const tree = render(
      <EditListingPhotosForm
        initialValues={{ country: 'US', images: [] }}
        intl={fakeIntl}
        dispatch={noop}
        onImageUpload={v => Promise.reject(v)}
        onSubmit={v => v}
        saveActionMsg={saveActionMsg}
        stripeConnected={false}
        updated={false}
        ready={false}
        updateInProgress={false}
        disabled={false}
        onRemoveImage={noop}
        listingImageConfig={{ aspectWidth: 1, aspectHeight: 1, variantPrefix: 'listing-card' }}
      />
    );
    expect(tree.asFragment()).toMatchSnapshot();
  });

  // TODO to test this fully, we would need to check that store's state changes correctly.

  it('Check that FieldAddImage works', async () => {
    const ACCEPT_IMAGES = 'image/*';
    const tree = render(
      <FinalForm
        onSubmit={noop}
        mutators={{ ...arrayMutators }}
        render={formRenderProps => {
          return (
            <form onSubmit={noop}>
              <FieldAddImage
                id="addImage"
                name="addImage"
                accept={ACCEPT_IMAGES}
                label={<div>label</div>}
                type="file"
                disabled={false}
                formApi={{
                  change: noop,
                  blur: noop,
                }}
                onImageUploadHandler={noop}
                aspectWidth={1}
                aspectHeight={1}
              />
            </form>
          );
        }}
      />
    );

    // Fill mandatory attributes
    const file = new File(['hello'], './public/static/icons/favicon-16x16.png', {
      type: 'image/png',
    });
    const input = screen.getByLabelText(/label/i);

    userEvent.upload(input, file);
    expect(input.files[0]).toBe(file);
    expect(input.files.item(0)).toBe(file);
    expect(input.files).toHaveLength(1);
  });
});
