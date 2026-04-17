/* eslint-disable no-console */
import React from 'react';
import FileUpload from './FileUpload';

const onRemoveFile = tempId => console.log('remove file', tempId);

export const FileUploadUploading = {
  component: FileUpload,
  props: {
    item: {
      tempId: 'temp-uploading',
      uploadInProgress: true,
      verificationInProgress: false,
      file: null,
      sourceFile: { name: 'document.pdf' },
      progress: 45,
      error: null,
      verificationStatus: null,
    },
    onRemoveFile,
  },
};

export const FileUploadVerifying = {
  component: FileUpload,
  props: {
    item: {
      tempId: 'temp-verifying',
      uploadInProgress: false,
      verificationInProgress: true,
      file: null,
      sourceFile: { name: 'document.pdf' },
      progress: 100,
      error: null,
      verificationStatus: 'pendingVerification',
    },
    onRemoveFile,
  },
};

export const FileUploadErrorWithMessage = {
  component: FileUpload,
  props: {
    item: {
      tempId: 'temp-error-message',
      uploadInProgress: false,
      verificationInProgress: false,
      file: null,
      sourceFile: { name: 'document.pdf' },
      progress: null,
      error: { message: 'File too large.' },
      verificationStatus: null,
    },
    onRemoveFile,
  },
};

export const FileUploadErrorNoMessage = {
  component: FileUpload,
  props: {
    item: {
      tempId: 'temp-error-no-message',
      uploadInProgress: false,
      verificationInProgress: false,
      file: null,
      sourceFile: { name: 'document.pdf' },
      progress: null,
      error: {},
      verificationStatus: null,
    },
    onRemoveFile,
  },
};

export const FileUploadCompleted = {
  component: FileUpload,
  props: {
    item: {
      tempId: 'temp-completed',
      uploadInProgress: false,
      verificationInProgress: false,
      file: { attributes: { name: 'video.mp4', size: 2 * 1024 * 1024 } },
      sourceFile: null,
      progress: 100,
      error: null,
      verificationStatus: 'available',
    },
    onRemoveFile,
  },
};
