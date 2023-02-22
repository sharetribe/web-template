import React from 'react';
import { types as sdkTypes } from '../../../util/sdkLoader';
import ListingImageGallery from './ListingImageGallery';

const { UUID } = sdkTypes;

const imageName = 'example-variant';
const imageName2x = 'example-variant-2x';
const imageName4x = 'example-variant-4x';
const imageName6x = 'example-variant-6x';
const imageVariants = [imageName, imageName2x, imageName4x, imageName6x];

const variant = (name, width, height) => {
  return {
    name,
    width,
    height,
    url: `https://picsum.photos/${width}/${height}/`,
  };
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
    },
  },
};

const repeat = (x, n) => {
  return Array.from(new Array(n)).map(() => x);
};

const Gallery = props => {
  const styles = {
    width: '100%',
    maxWidth: 600,
  };
  return (
    <div style={styles}>
      <ListingImageGallery {...props} />
    </div>
  );
};

export const NoImages = {
  component: Gallery,
  props: { images: [], imageVariants },
  group: 'images',
};

export const SingleImage = {
  component: Gallery,
  props: { images: [imageSquare], imageVariants },
  group: 'images',
};

export const VariousImages = {
  component: Gallery,
  props: {
    images: [
      imageLandscape,
      imagePortrait,
      imageSquare,
      imageLandscape,
      imagePortrait,
      imageSquare,
    ],
    imageVariants,
  },
  group: 'images',
};

export const SquareImages = {
  component: Gallery,
  props: {
    images: repeat(imageSquare, 20),
    imageVariants,
  },
  group: 'images',
};

export const PortraitImages = {
  component: Gallery,
  props: {
    images: repeat(imagePortrait, 20),
    imageVariants,
  },
  group: 'images',
};

export const LandscapeImages = {
  component: Gallery,
  props: {
    images: repeat(imageLandscape, 20),
    imageVariants,
  },
  group: 'images',
};
