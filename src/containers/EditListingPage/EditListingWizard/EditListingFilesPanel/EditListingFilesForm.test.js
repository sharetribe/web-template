import React from 'react';
import '@testing-library/jest-dom';
import { Form as FinalForm } from 'react-final-form';

import { renderWithProviders as render, testingLibrary } from '../../../../util/testHelpers';

import EditListingFilesForm, { FieldAddFile } from './EditListingFilesForm';

const { screen, userEvent } = testingLibrary;

const noop = () => null;

describe('EditListingFilesForm', () => {
  it('renders the file upload input when showAttachFiles is true', () => {
    const { container } = render(
      <EditListingFilesForm
        onSubmit={noop}
        saveActionMsg="Next"
        updated={false}
        updateInProgress={false}
        disabled={false}
        ready={false}
        showAttachFiles={true}
        files={[]}
        onFileUpload={noop}
      />
    );

    expect(container.querySelector('input[type="file"]')).toBeInTheDocument();
  });

  it('renders with submit button disabled when no files have been uploaded', () => {
    const saveActionMsg = 'Next';

    render(
      <EditListingFilesForm
        onSubmit={noop}
        saveActionMsg={saveActionMsg}
        updated={false}
        updateInProgress={false}
        disabled={false}
        ready={false}
        showAttachFiles={true}
        files={[]}
        isDraft={true}
        onFileUpload={noop}
      />
    );

    expect(screen.getByRole('button', { name: saveActionMsg })).toBeDisabled();
  });

  it('renders with submit button disabled when files are pending upload', () => {
    const saveActionMsg = 'Next';

    render(
      <EditListingFilesForm
        onSubmit={noop}
        saveActionMsg={saveActionMsg}
        updated={false}
        updateInProgress={false}
        disabled={false}
        ready={false}
        showAttachFiles={true}
        files={[{ file: null }]}
        isDraft={true}
        hasPendingFileUploads={true}
        onFileUpload={noop}
      />
    );

    expect(screen.getByRole('button', { name: saveActionMsg })).toBeDisabled();
  });

  it('renders with submit button disabled when published listing has unverified files', () => {
    const saveActionMsg = 'Next';

    const unverifiedFile = {
      file: { id: { uuid: 'file-id-1' } },
      verificationInProgress: false,
      error: null,
      verificationStatus: 'pending',
    };

    render(
      <EditListingFilesForm
        onSubmit={noop}
        saveActionMsg={saveActionMsg}
        updated={false}
        updateInProgress={false}
        disabled={false}
        ready={false}
        showAttachFiles={true}
        files={[unverifiedFile]}
        isDraft={false}
        onFileUpload={noop}
      />
    );

    expect(screen.getByRole('button', { name: saveActionMsg })).toBeDisabled();
  });

  it('renders with submit button enabled when unpublished listing has all files uploaded', () => {
    const saveActionMsg = 'Next';

    const uploadedFile = {
      file: { id: { uuid: 'file-id-1' } },
      verificationInProgress: true,
      error: null,
      verificationStatus: 'pending',
    };

    render(
      <EditListingFilesForm
        onSubmit={noop}
        saveActionMsg={saveActionMsg}
        updated={false}
        updateInProgress={false}
        disabled={false}
        ready={false}
        showAttachFiles={true}
        files={[uploadedFile]}
        isDraft={true}
        onFileUpload={noop}
      />
    );

    expect(screen.getByRole('button', { name: saveActionMsg })).toBeEnabled();
  });

  it('renders with submit button enabled when published listing has all files verified', () => {
    const saveActionMsg = 'Next';

    const verifiedFile = {
      file: { id: { uuid: 'file-id-1' } },
      verificationInProgress: false,
      error: null,
      verificationStatus: 'available',
    };

    render(
      <EditListingFilesForm
        onSubmit={noop}
        saveActionMsg={saveActionMsg}
        updated={false}
        updateInProgress={false}
        disabled={false}
        ready={false}
        showAttachFiles={true}
        files={[verifiedFile]}
        isDraft={false}
        onFileUpload={noop}
      />
    );

    expect(screen.getByRole('button', { name: saveActionMsg })).toBeEnabled();
  });
});
