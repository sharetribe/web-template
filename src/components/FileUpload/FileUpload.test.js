import React from 'react';
import '@testing-library/jest-dom';

import { renderWithProviders as render } from '../../util/testHelpers';

import FileUpload from './FileUpload';

const createFakeFile = (name, size) => ({ name, size });

describe('FileUpload', () => {
  it('matches snapshot with Kb file size', () => {
    const item = { file: createFakeFile('document.pdf', 512), tempId: 'test-id-1' };
    const tree = render(<FileUpload item={item} onRemoveFile={() => {}} />);
    expect(tree.asFragment().firstChild).toMatchSnapshot();
  });

  it('matches snapshot with Mb file size', () => {
    const item = { file: createFakeFile('video.mp4', 2 * 1024 * 1024), tempId: 'test-id-2' };
    const tree = render(<FileUpload item={item} onRemoveFile={() => {}} />);
    expect(tree.asFragment().firstChild).toMatchSnapshot();
  });
});
