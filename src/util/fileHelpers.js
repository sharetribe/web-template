const KILO = 1024;

export const MAX_FILE_SIZE = KILO * KILO * KILO; // real max size

export const calculateFileSize = size => {
  const kbSize = Math.ceil(size / KILO);
  const mbSize = (kbSize / KILO).toFixed(1);

  const useMb = mbSize > 1;

  return useMb ? { size: mbSize, unit: 'Mb' } : { size: kbSize, unit: 'Kb' };
};
