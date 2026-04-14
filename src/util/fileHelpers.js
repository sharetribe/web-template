const KILO = 1000;
const GIGA = KILO * KILO * KILO;

export const MAX_FILE_SIZE = GIGA;

export const calculateFileSize = size => {
  const kbSize = Math.ceil(size / KILO);
  const mbSize = (kbSize / KILO).toFixed(1);

  const useMb = mbSize > 1;

  return useMb ? { size: mbSize, unit: 'MB' } : { size: kbSize, unit: 'KB' };
};
