import React from 'react';
import { number, objectOf, oneOf, shape, string } from 'prop-types';
import classNames from 'classnames';

import { AspectRatioWrapper, ResponsiveImage } from '../../../../components/index.js';
import { Link } from '../Link';

import css from './Image.module.css';

// Images in markdown point to elsewhere (they don't support responsive image variants)
export const MarkdownImage = React.forwardRef((props, ref) => {
  const { className, rootClassName, ...otherProps } = props;
  const classes = classNames(rootClassName || css.markdownImage, className);

  return <img className={classes} {...otherProps} ref={ref} crossOrigin="anonymous" />;
});

MarkdownImage.displayName = 'MarkdownImage';

MarkdownImage.defaultProps = {
  rootClassName: null,
  className: null,
  alt: 'image',
};

MarkdownImage.propTypes = {
  rootClassName: string,
  className: string,
  src: string.isRequired,
  alt: string,
};

// Image as a Field (by default these are only allowed inside a block).
export const FieldImage = React.forwardRef((props, ref) => {
  const { className, rootClassName, alt, image, sizes, link, ...otherProps } = props;

  const { variants } = image?.attributes || {};
  const variantNames = Object.keys(variants);

  // We assume aspect ratio from the first image variant
  const firstImageVariant = variants[variantNames[0]];
  const { width: aspectWidth, height: aspectHeight } = firstImageVariant || {};

  const imageLinkHref = link?.href || null;
  const imageLinkFieldType = link?.fieldType || null;

  const classes = classNames(
    rootClassName || css.fieldImage,
    className,
    { [css.imageHoverEffect]: imageLinkHref } // Add a hover effect for the image if it is wrapped in a link
  );

  const responsiveImage = (
    <ResponsiveImage
      className={css.fieldImage}
      ref={ref}
      alt={alt}
      image={image}
      variants={variantNames}
      sizes={sizes}
      {...otherProps}
    />
  );
  return (
    <AspectRatioWrapper className={classes} width={aspectWidth || 1} height={aspectHeight || 1}>
      {imageLinkHref ? (
        <Link href={imageLinkHref} title={alt} fieldType={imageLinkFieldType}>
          {responsiveImage}
        </Link>
      ) : (
        responsiveImage
      )}
    </AspectRatioWrapper>
  );
});

FieldImage.displayName = 'FieldImage';

FieldImage.defaultProps = {
  rootClassName: null,
  className: null,
  alt: 'image',
  sizes: null,
};

FieldImage.propTypes = {
  rootClassName: string,
  className: string,
  alt: string,
  image: shape({
    id: string.isRequired,
    type: oneOf(['imageAsset']).isRequired,
    attributes: shape({
      variants: objectOf(
        shape({
          width: number.isRequired,
          height: number.isRequired,
          url: string.isRequired,
        })
      ).isRequired,
    }).isRequired,
  }).isRequired,
  sizes: string,
};
