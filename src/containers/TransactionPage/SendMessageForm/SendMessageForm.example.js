import SendMessageForm from './SendMessageForm';

export const Empty = {
  component: SendMessageForm,
  props: {
    formId: 'SendMessageForm.Empty.Form',
    messagePlaceholder: 'Send message to Juho…',
    showAttachFiles: true,
    onChange: values => {
      console.log('values changed to:', values);
    },
    onSubmit: values => {
      console.log('submit values:', values);
    },
    onFocus: () => {
      console.log('focus on message form');
    },
    onBlur: () => {
      console.log('blur on message form');
    },
    onFileUpload: file => {
      console.log('upload file:', file);
    },
    onRemoveFile: tempId => {
      console.log('remove file:', tempId);
    },
  },
  group: 'page:TransactionPage',
};

export const InProgress = {
  component: SendMessageForm,
  props: {
    formId: 'SendMessageForm.InProgress.Form',
    messagePlaceholder: 'Send message to Juho…',
    showAttachFiles: true,
    inProgress: true,
    onSubmit: values => {
      console.log('submit values:', values);
    },
    onFileUpload: file => {
      console.log('upload file:', file);
    },
    onRemoveFile: tempId => {
      console.log('remove file:', tempId);
    },
  },
  group: 'page:TransactionPage',
};

export const WithFiles = {
  component: SendMessageForm,
  props: {
    formId: 'SendMessageForm.WithFiles.Form',
    messagePlaceholder: 'Send message to Juho…',
    showAttachFiles: true,
    onSubmit: values => {
      console.log('submit values:', values);
    },
    onFileUpload: file => {
      console.log('upload file:', file);
    },
    onRemoveFile: tempId => {
      console.log('remove file:', tempId);
    },
    files: [
      {
        tempId: 'example-uploading',
        uploadInProgress: true,
        verificationInProgress: false,
        file: null,
        sourceFile: { name: 'presentation.pdf' },
        progress: 60,
        error: null,
        verificationStatus: null,
      },
      {
        tempId: 'example-verifying',
        uploadInProgress: false,
        verificationInProgress: true,
        file: { attributes: { name: 'contract.pdf', size: 150 * 1024 } },
        sourceFile: null,
        progress: 100,
        error: null,
        verificationStatus: 'pendingVerification',
      },
      {
        tempId: 'example-completed',
        uploadInProgress: false,
        verificationInProgress: false,
        file: { attributes: { name: 'photo.jpg', size: 320 * 1024 } },
        sourceFile: null,
        progress: 100,
        error: null,
        verificationStatus: 'available',
      },
      {
        tempId: 'example-mime-type-error',
        uploadInProgress: false,
        verificationInProgress: false,
        file: null,
        sourceFile: { name: 'script.exe' },
        progress: null,
        error: { message: 'mimeTypeError' },
        verificationStatus: null,
      },
      {
        tempId: 'example-verification-failed',
        uploadInProgress: false,
        verificationInProgress: false,
        file: { attributes: { name: 'suspicious.zip', size: 50 * 1024 } },
        sourceFile: null,
        progress: 100,
        error: { message: 'verificationFailed' },
        verificationStatus: 'verificationFailed',
      },
      {
        tempId: 'example-timeout',
        uploadInProgress: false,
        verificationInProgress: false,
        file: null,
        sourceFile: { name: 'video.mov' },
        progress: null,
        error: { message: 'timeout' },
        verificationStatus: null,
      },
      {
        tempId: 'example-upload-error',
        uploadInProgress: false,
        verificationInProgress: false,
        file: null,
        sourceFile: { name: 'archive.zip' },
        progress: null,
        error: { message: 'File too large (max 1 GB).' },
        verificationStatus: null,
      },
    ],
  },
  group: 'page:TransactionPage',
};

export const Error = {
  component: SendMessageForm,
  props: {
    formId: 'SendMessageForm.Error.Form',
    messagePlaceholder: 'Send message to Juho…',
    showAttachFiles: true,
    sendMessageError: { type: 'error', name: 'ExampleError' },
    onSubmit: values => {
      console.log('submit values:', values);
    },
    onFileUpload: file => {
      console.log('upload file:', file);
    },
    onRemoveFile: tempId => {
      console.log('remove file:', tempId);
    },
  },
  group: 'page:TransactionPage',
};

// showAttachFiles: false — listing type does not have file attachments enabled.
export const WithAttachFilesDisabled = {
  component: SendMessageForm,
  props: {
    formId: 'SendMessageForm.WithAttachFilesDisabled.Form',
    messagePlaceholder: 'Send message to Juho…',
    showAttachFiles: false,
    onSubmit: values => {
      console.log('submit values:', values);
    },
    onFocus: () => {
      console.log('focus on message form');
    },
    onBlur: () => {
      console.log('blur on message form');
    },
    onFileUpload: file => {
      console.log('upload file:', file);
    },
    onRemoveFile: tempId => {
      console.log('remove file:', tempId);
    },
  },
  group: 'page:TransactionPage',
};

// showDisabledFilesError: true — listing type has file attachments but marketplace has disabled them.
export const WithFilesDisabledByMarketplace = {
  component: SendMessageForm,
  props: {
    formId: 'SendMessageForm.WithFilesDisabledByMarketplace.Form',
    messagePlaceholder: 'Send message to Juho…',
    showAttachFiles: false,
    showDisabledFilesError: true,
    marketplaceName: 'MarketplaceX',
    onSubmit: values => {
      console.log('submit values:', values);
    },
    onFocus: () => {
      console.log('focus on message form');
    },
    onBlur: () => {
      console.log('blur on message form');
    },
    onFileUpload: file => {
      console.log('upload file:', file);
    },
    onRemoveFile: tempId => {
      console.log('remove file:', tempId);
    },
  },
  group: 'page:TransactionPage',
};
