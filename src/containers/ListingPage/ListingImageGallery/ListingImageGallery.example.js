import React from 'react';
import { types as sdkTypes } from '../../../util/sdkLoader';
import ListingImageGallery from './ListingImageGallery';

import exampleImageData from './example-image-data.json';

const { reviver, UUID } = sdkTypes;
const exampleImages = JSON.parse(JSON.stringify(exampleImageData), reviver);

const squareSmall = 'square-small';

const imageName = 'scaled-small';
const imageName2x = 'scaled-medium';
const imageName4x = 'scaled-large';
const imageName6x = 'scaled-xlarge';

const variant = (name, width, height) => {
  return {
    name,
    width,
    height,
    url: `https://via.placeholder.com/${width}x${height}`,
  };
};

const squareCropVariants = {
  'square-small': variant('square-small', 240, 240),
  'square-small2x': variant('square-small2x', 480, 480),
};

const imageSquare = {
  id: new UUID('image-square'),
  type: 'image',
  attributes: {
    variants: {
      [imageName]: variant(imageName, 400, 400),
      [imageName2x]: variant(imageName2x, 800, 800),
      [imageName4x]: variant(imageName4x, 1600, 1600),
      [imageName6x]: variant(imageName6x, 2400, 2400),
      ...squareCropVariants,
    },
  },
};

const imagePortrait = {
  id: new UUID('image-portrait'),
  type: 'image',
  attributes: {
    variants: {
      [imageName]: variant(imageName, 400, 800),
      [imageName2x]: variant(imageName2x, 800, 1600),
      [imageName4x]: variant(imageName4x, 1600, 3200),
      [imageName6x]: variant(imageName6x, 2400, 4800),
      ...squareCropVariants,
    },
  },
};
const imageLandscape = {
  id: new UUID('image-landscape'),
  type: 'image',
  attributes: {
    variants: {
      [imageName]: variant(imageName, 800, 400),
      [imageName2x]: variant(imageName2x, 1600, 800),
      [imageName4x]: variant(imageName4x, 3200, 1600),
      [imageName6x]: variant(imageName6x, 4800, 2400),
      ...squareCropVariants,
    },
  },
};

export const NoImages = {
  component: ListingImageGallery,
  props: { images: [] },
  group: 'images',
};

export const SingleImage = {
  component: ListingImageGallery,
  props: { images: [imageSquare] },
  group: 'images',
};

export const MultipleImages = {
  component: ListingImageGallery,
  props: { images: [imageLandscape, imagePortrait, imageSquare] },
  group: 'images',
};

export const ListingImages = {
  component: ListingImageGallery,
  props: { images: exampleImages },
  group: 'images',
};

export const ListingImagesSquareThumbnails = {
  component: ListingImageGallery,
  props: { images: exampleImages, thumbnailVariants: ['square-small', 'square-small2x'] },
  group: 'images',
};
