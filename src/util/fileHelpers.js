const KILO = 1024;

export const MAX_FILE_SIZE = KILO * KILO * KILO;

export const calculateFileSize = size => {
  const kbSize = Math.ceil(size / KILO);
  const mbSize = (kbSize / KILO).toFixed(1);

  const useMb = mbSize > 1;

  return useMb ? { size: mbSize, unit: 'MB' } : { size: kbSize, unit: 'KB' };
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
