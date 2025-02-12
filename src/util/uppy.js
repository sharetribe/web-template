import { createUploadSignature } from './api';

const MAX_FILE_SIZE_GB = 2; // Value in GB
const MAX_TOTAL_FILE_SIZE_GB = 2; // Value in GB
const MAX_NUMBER_OF_FILES = 50;

export async function createUppyInstance(meta, onBeforeUpload) {
  try {
    // Dynamically import Uppy modules, so they don't break server bundle
    const { default: Uppy } = await import('@uppy/core');
    const { default: Transloadit, COMPANION_ALLOWED_HOSTS, COMPANION_URL } = await import(
      '@uppy/transloadit'
    );
    const { default: Dropbox } = await import('@uppy/dropbox/lib/Dropbox');
    const { default: Box } = await import('@uppy/box/lib/Box');
    const { default: GoogleDrive } = await import('@uppy/google-drive/lib/GoogleDrive');
    const { default: Url } = await import('@uppy/url/lib/Url');
    const { default: OneDrive } = await import('@uppy/onedrive/lib/OneDrive');
    const { default: GoldenRetriever } = await import('@uppy/golden-retriever');
    const uppy = new Uppy({
      onBeforeUpload,
      restrictions: {
        allowedFileTypes: ['image/*', 'video/*'],
        maxNumberOfFiles: MAX_NUMBER_OF_FILES,
        maxFileSize: MAX_FILE_SIZE_GB * 1024 * 1024 * 1024, // byte to GB
        maxTotalFileSize: MAX_TOTAL_FILE_SIZE_GB * 1024 * 1024 * 1024, // byte to GB
      },
    });

    const config = {
      companionUrl: COMPANION_URL,
      companionAllowedHosts: COMPANION_ALLOWED_HOSTS,
    };

    uppy
      .use(Transloadit, {
        assemblyOptions: async file => {
          const { params, signature } = await createUploadSignature({ ...meta });
          return {
            service: process.env.REACT_APP_TRANSLOADIT_SERVICE_URL,
            params: JSON.parse(params),
            signature,
          };
        },
        waitForEncoding: true,
        waitForMetadata: true,
        limit: 5,
      })
      .use(GoldenRetriever, { serviceWorker: true })
      .use(Dropbox, config)
      .use(Box, config)
      .use(GoogleDrive, config)
      .use(Url, config)
      .use(OneDrive, config);

    // Register Service Worker if available
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(registration =>
          console.log('ServiceWorker registered with scope:', registration.scope)
        )
        .catch(error => console.error('ServiceWorker registration failed:', error));
    }

    return uppy;
  } catch (error) {
    console.error('Failed to initialize Uppy with Redux middleware:', error);
    return null;
  }
}
