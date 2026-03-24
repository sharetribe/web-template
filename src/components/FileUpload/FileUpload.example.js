/* eslint-disable no-console */
import React from 'react';
import FileUpload from './FileUpload';

const createMockFile = (name, size) => ({ name, size });

export const FileUploadExample = {
  component: FileUpload,
  props: {
    item: { file: createMockFile('video.mp4', 2 * 1024 * 1024), tempId: 'example-id-1' },
    onRemoveFile: tempId => console.log('remove file', tempId),
  },
};
