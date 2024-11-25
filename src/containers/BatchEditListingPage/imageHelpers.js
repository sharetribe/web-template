import { LARGE_IMAGE, MEDIUM_IMAGE, SMALL_IMAGE, UNAVAILABLE_IMAGE_RESOLUTION } from './constants';

const IMAGE_DIMENSIONS_MAP = {
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

export const getImageDimensionLabel = dimensionsKey => IMAGE_DIMENSIONS_MAP[dimensionsKey].label;

export const getDimensions = (width, height) => {
  if (!width && !height) {
    return UNAVAILABLE_IMAGE_RESOLUTION;
  }
  const largestDimension = Math.max(width, height);
  if (largestDimension <= IMAGE_DIMENSIONS_MAP[SMALL_IMAGE].maxDimension) {
    return SMALL_IMAGE;
  }
  if (largestDimension <= IMAGE_DIMENSIONS_MAP[MEDIUM_IMAGE].maxDimension) {
    return MEDIUM_IMAGE;
  }
  return LARGE_IMAGE;
};
