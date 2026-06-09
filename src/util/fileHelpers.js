import { file as sdkFile } from './sdkLoader';
import { denormalisedResponseEntities } from './data';
import { storableError } from './errors';

const KILO = 1000;
const GIGA = KILO * KILO * KILO;

export const MAX_FILE_SIZE = GIGA;
export const MAX_FILE_UPLOAD_COUNT = 10;

export const calculateFileSize = (size, locale) => {
  const kbSize = Math.ceil(size / KILO);
  const mbSize = kbSize / KILO;
  const useMb = mbSize >= 1;

  return useMb
    ? new Intl.NumberFormat(locale, {
        style: 'unit',
        unit: 'megabyte',
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }).format(mbSize)
    : new Intl.NumberFormat(locale, {
        style: 'unit',
        unit: 'kilobyte',
        maximumFractionDigits: 0,
      }).format(kbSize);
};

export const messageHasPendingFiles = message =>
  message.publicFileAttachments?.some(f => f.file.attributes.state === 'pendingVerification');
export const messageHasFailedFiles = message =>
  message.publicFileAttachments?.some(f => f.file.attributes.state === 'verificationFailed');

export const analyseFileName = name => {
  const lastDot = name ? name.lastIndexOf('.') : -1;
  const baseName = lastDot > 0 ? name.slice(0, lastDot) : name;
  const extension = lastDot > 0 ? name.slice(lastDot) : '';
  return { baseName, extension };
};

////////////////////
// Upload File    //
////////////////////

// Executes the multi-step file upload flow. Returns { fileUpload, tempId, fileId }.
export const executeFileUpload = ({ file, tempId, sdk, fileUploadCount, onProgress }) => {
  let fileId;

  ///////////////////////////////////
  /// Step 1. Check file metadata ///
  ///////////////////////////////////
  const checkMetadataFn = () => {
    if (!file) {
      throw new Error('Missing file, cannot initiate upload.');
    }
    if (fileUploadCount >= MAX_FILE_UPLOAD_COUNT) {
      throw new Error('Upload file count exceeded, cannot initiate upload.');
    }

    // Currently the MAX_FILE_SIZE value corresponds to the max file size permitted
    // by the API. If you want to reduce the permitted file size further, you can modify
    // the size parameter, and if you want to get the size validation from the
    // sdk.ownFiles.create() endpoint, you can remove this condition completely.
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('maxFileSizeExceeded');
    }
    return sdkFile.metadata(file);
  };

  ////////////////////////////////////
  /// Step 2. Create file resource ///
  ////////////////////////////////////
  const createFileResourceFn = metadataResp => {
    return sdk.ownFiles.create({ ...metadataResp }).catch(e => {
      const isMimeTypeError = e.data.errors.some(
        e => e.status === 400 && e.source.path.some(p => p === 'mimeType')
      );
      if (isMimeTypeError) {
        throw new Error('mimeTypeError');
      } else {
        throw e;
      }
    });
  };

  //////////////////////////////////////////
  /// Step 3. Create URL for file upload ///
  //////////////////////////////////////////
  const createFileUploadUrlFn = ownFileResp => {
    const createdFileId = ownFileResp?.data?.data?.id;
    if (!createdFileId) {
      throw new Error('Missing fileId, cannot get upload URL');
    }

    fileId = createdFileId;
    return sdk.fileUploads.create({ fileId: createdFileId });
  };

  ///////////////////////////////////////////////
  /// Step 4. Upload file directly to storage ///
  ///////////////////////////////////////////////
  const uploadFileToStorageFn = fileUploadResp => {
    const { method = 'PUT', url, headers = {} } = fileUploadResp?.data?.data?.attributes;

    if (!url) {
      throw new Error('Missing upload URL, cannot upload file.');
    }

    const onUploadProgress = progressEvent => {
      const loaded = progressEvent?.loaded || 0;
      const total = progressEvent?.total || file.size;
      const progress = total ? Math.min(100, Math.round((loaded / total) * 100)) : null;
      onProgress(progress);
    };

    return sdkFile.upload({
      method,
      url,
      headers,
      file,
      onUploadProgress,
    });
  };

  //////////////////////////////////////////////
  /// Step 5. Return ids for future handling ///
  //////////////////////////////////////////////
  const handleFileUploadSuccessFn = () => {
    return sdk.ownFiles.show({ id: fileId }).then(resp => {
      const denormalisedResponse = denormalisedResponseEntities(resp);
      const fileUpload = denormalisedResponse[0];
      return { fileUpload, tempId, fileId };
    });
  };

  const applyAsync = (acc, val) => acc.then(val);
  const composeAsync = (...funcs) => x => funcs.reduce(applyAsync, Promise.resolve(x));

  return composeAsync(
    checkMetadataFn,
    createFileResourceFn,
    createFileUploadUrlFn,
    uploadFileToStorageFn,
    handleFileUploadSuccessFn
  )();
};
