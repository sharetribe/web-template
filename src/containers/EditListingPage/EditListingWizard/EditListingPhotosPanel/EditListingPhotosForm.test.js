import React from 'react';
import '@testing-library/jest-dom';
import { Form as FinalForm, Field } from 'react-final-form';
import arrayMutators from 'final-form-arrays';

import { fakeIntl } from '../../../../util/testData';
import { renderWithProviders as render, testingLibrary } from '../../../../util/testHelpers';

import EditListingPhotosForm, { FieldAddImage } from './EditListingPhotosForm';

const { screen, userEvent, waitFor, act } = testingLibrary;

const noop = () => null;

describe('EditListingPhotosForm', () => {
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

  it('Check that FieldAddImage works with single file', async () => {
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
                currentImageCount={0}
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

  it('Check that FieldAddImage works with multiple files', async () => {
    const ACCEPT_IMAGES = 'image/*';
    const onImageUploadHandler = jest.fn();
    
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
                onImageUploadHandler={onImageUploadHandler}
                aspectWidth={1}
                aspectHeight={1}
                currentImageCount={0}
              />
            </form>
          );
        }}
      />
    );

    // Create multiple files
    const file1 = new File(['hello1'], 'image1.png', { type: 'image/png' });
    const file2 = new File(['hello2'], 'image2.png', { type: 'image/png' });
    const file3 = new File(['hello3'], 'image3.png', { type: 'image/png' });
    
    const input = screen.getByLabelText(/label/i);

    userEvent.upload(input, [file1, file2, file3]);
    
    expect(input.files).toHaveLength(3);
    expect(input.files[0]).toBe(file1);
    expect(input.files[1]).toBe(file2);
    expect(input.files[2]).toBe(file3);
    
    // Check that onImageUploadHandler was called with the array of files
    expect(onImageUploadHandler).toHaveBeenCalledWith([file1, file2, file3]);
  });

  it('Check that FieldAddImage respects maximum image limit', async () => {
    const ACCEPT_IMAGES = 'image/*';
    const onImageUploadHandler = jest.fn();
    
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
                onImageUploadHandler={onImageUploadHandler}
                aspectWidth={1}
                aspectHeight={1}
                currentImageCount={8} // Already have 8 images
              />
            </form>
          );
        }}
      />
    );

    // Create multiple files that would exceed the limit
    const files = Array.from({ length: 5 }, (_, i) => 
      new File([`hello${i}`], `image${i}.png`, { type: 'image/png' })
    );
    
    const input = screen.getByLabelText(/label/i);

    userEvent.upload(input, files);
    
    // Should only allow 2 more files (10 - 8 = 2)
    expect(onImageUploadHandler).toHaveBeenCalledWith(files.slice(0, 2));
  });

  it('Check that FieldAddImage is disabled when max images reached', async () => {
    const ACCEPT_IMAGES = 'image/*';
    const onImageUploadHandler = jest.fn();
    
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
                onImageUploadHandler={onImageUploadHandler}
                aspectWidth={1}
                aspectHeight={1}
                currentImageCount={10} // Max images reached
              />
            </form>
          );
        }}
      />
    );

    // When max images are reached, the input is not rendered and the label has disabled class
    const label = screen.getByLabelText(/label/i);
    expect(label).toHaveClass('disabled');
  });
});
