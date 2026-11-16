import React from 'react';
import '@testing-library/jest-dom';
import { Form as FinalForm } from 'react-final-form';
import arrayMutators from 'final-form-arrays';

import { createImage, fakeIntl } from '../../../../util/testData';
import { renderWithProviders as render, testingLibrary } from '../../../../util/testHelpers';

import EditListingPhotosForm, { FieldAddImage } from './EditListingPhotosForm';

const { screen, userEvent, act } = testingLibrary;

const noop = () => null;

const listingImageConfig = { aspectWidth: 1, aspectHeight: 1, variantPrefix: 'listing-card' };

const createListingCardImage = id => {
  const image = createImage(id);
  return {
    ...image,
    attributes: {
      ...image.attributes,
      variants: {
        ...image.attributes.variants,
        'listing-card': {
          name: 'listing-card',
          width: 400,
          height: 400,
          url: 'https://picsum.photos/400/400/',
        },
        'listing-card-2x': {
          name: 'listing-card-2x',
          width: 800,
          height: 800,
          url: 'https://picsum.photos/800/800/',
        },
      },
    },
  };
};

const defaultFormProps = {
  intl: fakeIntl,
  dispatch: noop,
  onImageUpload: v => Promise.reject(v),
  onSubmit: v => v,
  saveActionMsg: 'Save photos',
  stripeConnected: false,
  updated: false,
  ready: false,
  updateInProgress: false,
  disabled: false,
  onRemoveImage: noop,
  listingImageConfig,
  allFilesUploadedAndVerified: true,
};

describe('EditListingPhotosForm', () => {
  it('matches snapshot', () => {
    const tree = render(
      <EditListingPhotosForm initialValues={{ country: 'US', images: [] }} {...defaultFormProps} />
    );
    expect(tree.asFragment()).toMatchSnapshot();
  });

  // TODO to test this fully, we would need to check that store's state changes correctly.

  it('Check that FieldAddImage works', async () => {
    const user = userEvent.setup();
    const ACCEPT_IMAGES = 'image/*';
    render(
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

    await user.upload(input, file);
    expect(input.files[0]).toBe(file);
    expect(input.files.item(0)).toBe(file);
    expect(input.files).toHaveLength(1);
  });

  it('hides add image control when at maxImages limit', async () => {
    // Sortable is loaded via @loadable when there is more than one image.
    // Wrap render in act so that async loadable update does not warn.
    const images = [createListingCardImage('img1'), createListingCardImage('img2')];
    await act(async () => {
      render(
        <EditListingPhotosForm {...defaultFormProps} initialValues={{ images }} maxImages={2} />
      );
    });

    expect(screen.queryByText('EditListingPhotosForm.chooseImage')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save photos' })).toBeEnabled();
  });

  it('disables save and shows error when over maxImages limit', async () => {
    // Sortable is loaded via @loadable when there is more than one image.
    // Wrap render in act so that async loadable update does not warn.
    const images = [
      createListingCardImage('img1'),
      createListingCardImage('img2'),
      createListingCardImage('img3'),
    ];
    await act(async () => {
      render(
        <EditListingPhotosForm {...defaultFormProps} initialValues={{ images }} maxImages={2} />
      );
    });

    expect(screen.queryByText('EditListingPhotosForm.chooseImage')).not.toBeInTheDocument();
    expect(screen.getByText('EditListingPhotosForm.maxImagesExceeded')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save photos' })).toBeDisabled();
  });
});
