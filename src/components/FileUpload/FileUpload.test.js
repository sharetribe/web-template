import React from 'react';
import '@testing-library/jest-dom';

import { renderWithProviders as render, testingLibrary } from '../../util/testHelpers';

import FileUpload from './FileUpload';

const { screen, fireEvent } = testingLibrary;
const noop = () => null;

const createItem = overrides => ({
  file: null,
  tempId: 'test-id',
  inProgress: false,
  progress: null,
  sourceFile: null,
  error: null,
  verificationStatus: null,
  ...overrides,
});

describe('FileUpload', () => {
  it('shows filename and progress percentage while uploading', () => {
    const item = createItem({
      inProgress: true,
      progress: 50,
      sourceFile: { name: 'document.pdf' },
    });
    render(<FileUpload item={item} onRemoveFile={noop} />);
    expect(screen.getByText('document.pdf')).toBeInTheDocument();
    expect(screen.getByText(/Uploading/)).toBeInTheDocument();
    expect(screen.getByText(/50/)).toBeInTheDocument();
  });

  it('shows filename and verifying status when upload is complete but file not yet available', () => {
    const item = createItem({
      inProgress: true,
      progress: 100,
      sourceFile: { name: 'document.pdf' },
      verificationStatus: 'pendingVerification',
    });
    render(<FileUpload item={item} onRemoveFile={noop} />);
    expect(screen.getByText('document.pdf')).toBeInTheDocument();
    expect(screen.getByText(/Verifying/)).toBeInTheDocument();
    expect(screen.queryByText(/Uploading/)).not.toBeInTheDocument();
  });

  it('shows filename and error message when upload fails', () => {
    const item = createItem({
      sourceFile: { name: 'document.pdf' },
      error: { message: 'Upload failed.' },
    });
    render(<FileUpload item={item} onRemoveFile={noop} />);
    expect(screen.getByText('document.pdf')).toBeInTheDocument();
    expect(screen.getByText(/Upload failed/)).toBeInTheDocument();
  });

  it('shows a default error message when the error has no message', () => {
    const item = createItem({
      sourceFile: { name: 'document.pdf' },
      error: {},
    });
    render(<FileUpload item={item} onRemoveFile={noop} />);
    expect(screen.getByText(/Failed to upload/)).toBeInTheDocument();
  });

  it('shows filename and file size when upload and verification are complete', () => {
    const item = createItem({
      file: { attributes: { name: 'document.pdf', size: 512 } },
    });
    render(<FileUpload item={item} onRemoveFile={noop} />);
    expect(screen.getByText('document.pdf')).toBeInTheDocument();
    expect(screen.getByText(/Kb|Mb/)).toBeInTheDocument();
    expect(screen.queryByText(/Uploading/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Verifying/)).not.toBeInTheDocument();
  });

  it('renders nothing for an unknown state', () => {
    const item = createItem();
    const { container } = render(<FileUpload item={item} onRemoveFile={noop} />);
    expect(container.firstChild).toBeNull();
  });

  it('calls onRemoveFile with tempId when the remove button is clicked', () => {
    const onRemoveFile = jest.fn();
    const item = createItem({
      file: { attributes: { name: 'document.pdf', size: 512 } },
    });
    render(<FileUpload item={item} onRemoveFile={onRemoveFile} />);
    fireEvent.click(screen.getByText('X'));
    expect(onRemoveFile).toHaveBeenCalledTimes(1);
    expect(onRemoveFile).toHaveBeenCalledWith('test-id');
  });
});
