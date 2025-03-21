import React from 'react';
import classNames from 'classnames';

import { AspectRatioWrapper, ResponsiveImage } from '../../../../components/index.js';
import { Link } from '../Link';

import css from './Image.module.css';

/**
 * Images in markdown point to elsewhere (they don't support responsive image variants)
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @param {string} props.src image source
 * @param {string?} props.alt alt text for the image
 * @returns {JSX.Element} image element for markdown processor
 */
export const MarkdownImage = React.forwardRef((props, ref) => {
  const { className, rootClassName, alt = 'image', ...otherProps } = props;
  const classes = classNames(rootClassName || css.markdownImage, className);

  return <img className={classes} alt={alt} {...otherProps} ref={ref} crossOrigin="anonymous" />;
});

MarkdownImage.displayName = 'MarkdownImage';

/**
 * @typedef {Object} ImageVariant
 * @property {number} width
 * @property {number} height
 * @property {string} url image source
 */

/**
 * Image as a Field (by default these are only allowed inside a block).
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @param {string?} props.alt alt text for the image
 * @param {Object} props.image
 * @param {Object} props.image.id
 * @param {'imageAsset'} props.image.type
 * @param {Object} props.image.attributes
 * @param {Object.<key,ImageVariant>} props.image.attributes.variants
 * @param {string?} props.sizes responsive sizes string to be used with srcset
 * @returns {JSX.Element} image element
 */
export const FieldImage = React.forwardRef((props, ref) => {
  const { className, rootClassName, alt = 'image', image, sizes, link, ...otherProps } = props;

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
