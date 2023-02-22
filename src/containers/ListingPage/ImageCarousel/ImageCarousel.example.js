import React from 'react';
import { types as sdkTypes } from '../../../util/sdkLoader';
import ImageCarousel from './ImageCarousel';

const { UUID } = sdkTypes;

const imageName = 'scaled-small';
const imageName2x = 'scaled-medium';
const imageName4x = 'scaled-large';
const imageName6x = 'scaled-xlarge';

const imageSquare = {
  id: new UUID('image-square'),
  type: 'image',
  attributes: {
    variants: {
      [imageName]: {
        name: imageName,
        width: 400,
        height: 400,
        url: 'https://picsum.photos/400/400/',
      },
      [imageName2x]: {
        name: imageName2x,
        width: 800,
        height: 800,
        url: 'https://picsum.photos/800/800/',
      },
      [imageName4x]: {
        name: imageName4x,
        width: 1600,
        height: 1600,
        url: 'https://picsum.photos/1600/1600/',
      },
      [imageName6x]: {
        name: imageName6x,
        width: 2400,
        height: 2400,
        url: 'https://picsum.photos/2400/2400/',
      },
    },
  },
};

const imagePortrait = {
  id: new UUID('image-portrait'),
  type: 'image',
  attributes: {
    variants: {
      [imageName]: {
        name: imageName,
        width: 400,
        height: 800,
        url: 'https://picsum.photos/400/800/',
      },
      [imageName2x]: {
        name: imageName2x,
        width: 800,
        height: 1600,
        url: 'https://picsum.photos/800/1600/',
      },
      [imageName4x]: {
        name: imageName4x,
        width: 800,
        height: 1600,
        url: 'https://picsum.photos/800/1600/',
      },
      [imageName6x]: {
        name: imageName6x,
        width: 1200,
        height: 2400,
        url: 'https://picsum.photos/1200/2400/',
      },
    },
  },
};
const imageLandscape = {
  id: new UUID('image-landscape'),
  type: 'image',
  attributes: {
    variants: {
      [imageName]: {
        name: imageName,
        width: 400,
        height: 200,
        url: 'https://picsum.photos/400/200/',
      },
      [imageName2x]: {
        name: imageName2x,
        width: 800,
        height: 400,
        url: 'https://picsum.photos/800/400/',
      },
      [imageName4x]: {
        name: imageName4x,
        width: 1600,
        height: 800,
        url: 'https://picsum.photos/1600/800/',
      },
      [imageName6x]: {
        name: imageName6x,
        width: 2400,
        height: 1200,
        url: 'https://picsum.photos/2400/1200/',
      },
    },
  },
};

const ImageCarouselWrapper = props => {
  const wrapperStyles = {
    backgroundColor: '#000',
  };
  return (
    <div style={wrapperStyles}>
      <ImageCarousel {...props} />
    </div>
  );
};

export const NoImages = {
  component: ImageCarouselWrapper,
  props: { images: [], imageVariants: [imageName, imageName2x, imageName4x, imageName6x] },
  group: 'images',
  rawOnly: true,
};

export const SingleImage = {
  component: ImageCarouselWrapper,
  props: {
    images: [imageSquare],
    imageVariants: [imageName, imageName2x, imageName4x, imageName6x],
  },
  group: 'images',
  rawOnly: true,
};

export const MultipleImages = {
  component: ImageCarouselWrapper,
  props: {
    images: [imageLandscape, imagePortrait, imageSquare],
    imageVariants: [imageName, imageName2x, imageName4x, imageName6x],
  },
  group: 'images',
  rawOnly: true,
};
