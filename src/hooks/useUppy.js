import { Uppy } from '@uppy/core';
import Transloadit, { COMPANION_ALLOWED_HOSTS, COMPANION_URL } from '@uppy/transloadit';
import Dropbox from '@uppy/dropbox/lib/Dropbox';
import Box from '@uppy/box/lib/Box';
import GoogleDrive from '@uppy/google-drive/lib/GoogleDrive';
import Url from '@uppy/url/lib/Url';
import OneDrive from '@uppy/onedrive/lib/OneDrive';
import GoldenRetriever from '@uppy/golden-retriever';
import { useEffect, useState } from 'react';
import { createUploadSignature } from '../util/api';

export function useUppy(meta) {
  const uppyInstance = new Uppy({ ...meta });
  const [uppy] = useState(uppyInstance);
  const config = {
    companionUrl: COMPANION_URL,
    companionAllowedHosts: COMPANION_ALLOWED_HOSTS,
  };

  uppyInstance
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
    .use(GoldenRetriever)
    .use(Dropbox, config)
    .use(Box, config)
    .use(GoogleDrive, config)
    .use(Url, config)
    .use(OneDrive, config);

  useEffect(() => {
    if (meta) {
      uppy.setOptions({ ...meta });
    }
  }, [uppy, meta]);

  return uppy;
}
