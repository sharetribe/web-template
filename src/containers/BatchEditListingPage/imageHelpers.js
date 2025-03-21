import { LARGE_IMAGE, MEDIUM_IMAGE, SMALL_IMAGE, UNAVAILABLE_IMAGE_RESOLUTION } from './constants';

const IMAGE_SIZE_MAP = {
  [SMALL_IMAGE]: {
    maxDimension: 1000,
    label: 'Small (< 1,000px)',
  },
  [MEDIUM_IMAGE]: {
    maxDimension: 2000,
    label: 'Medium (1,000px-2,000px)',
  },
  [LARGE_IMAGE]: {
    maxDimension: 2001,
    label: 'Large (>2,000px)',
  },
  [UNAVAILABLE_IMAGE_RESOLUTION]: {
    label: 'Unavailable',
  },
};

export const getImageSizeLabel = dimensionsKey =>
  IMAGE_SIZE_MAP[dimensionsKey || UNAVAILABLE_IMAGE_RESOLUTION].label;

export const getImageSize = (width, height) => {
  if (!width && !height) {
    return UNAVAILABLE_IMAGE_RESOLUTION;
  }
  const largestDimension = Math.max(width, height);
  if (largestDimension <= IMAGE_SIZE_MAP[SMALL_IMAGE].maxDimension) {
    return SMALL_IMAGE;
  }
  if (largestDimension <= IMAGE_SIZE_MAP[MEDIUM_IMAGE].maxDimension) {
    return MEDIUM_IMAGE;
  }
  return LARGE_IMAGE;
};
