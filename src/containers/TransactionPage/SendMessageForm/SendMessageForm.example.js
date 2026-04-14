import SendMessageForm from './SendMessageForm';

export const Empty = {
  component: SendMessageForm,
  props: {
    formId: 'SendMessageForm.Empty.Form',
    messagePlaceholder: 'Send message to Juho…',
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
        tempId: 'example-in-progress',
        inProgress: true,
        file: null,
        sourceFile: { name: 'presentation.pdf' },
        progress: 60,
        error: null,
        verificationStatus: null,
      },
      {
        tempId: 'example-completed',
        inProgress: false,
        file: { attributes: { name: 'photo.jpg', size: 320 * 1024 } },
        sourceFile: null,
        progress: 100,
        error: null,
        verificationStatus: 'available',
      },
      {
        tempId: 'example-error',
        inProgress: false,
        file: null,
        sourceFile: { name: 'video.mov' },
        progress: null,
        error: { message: 'File too large.' },
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
