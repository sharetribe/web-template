import { Uppy } from '@uppy/core';
import Transloadit, { COMPANION_ALLOWED_HOSTS, COMPANION_URL } from '@uppy/transloadit';
import Dropbox from '@uppy/dropbox/lib/Dropbox';
import Box from '@uppy/box/lib/Box';
import GoogleDrive from '@uppy/google-drive/lib/GoogleDrive';
import Url from '@uppy/url/lib/Url';
import OneDrive from '@uppy/onedrive/lib/OneDrive';
import GoldenRetriever from '@uppy/golden-retriever';
import { createUploadSignature } from './api';
import ThumbnailGenerator from '@uppy/thumbnail-generator';

export function createUppyInstance(meta) {
  const uppy = new Uppy({ ...meta });
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
      autoProceed: false,
    })
    .use(GoldenRetriever, { serviceWorker: true })
    .use(Dropbox, config)
    .use(Box, config)
    .use(GoogleDrive, config)
    .use(Url, config)
    .use(OneDrive, config);

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('/sw.js') // Adjust the path if needed
      .then(registration => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      })
      .catch(error => {
        console.error('ServiceWorker registration failed: ', error);
      });
  }

  return uppy;
}
