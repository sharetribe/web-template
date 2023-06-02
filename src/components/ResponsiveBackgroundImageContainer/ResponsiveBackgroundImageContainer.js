import React from 'react';
import { bool, node, oneOfType, string } from 'prop-types';
import { useIntl } from 'react-intl';
import classNames from 'classnames';

import { types as sdkTypes } from '../../util/sdkLoader';
import { propTypes } from '../../util/types';

import { ResponsiveImage } from '../../components';

import css from './ResponsiveBackgroundImageContainer.module.css';

const { UUID } = sdkTypes;

/**
 * ResponsiveImage works with image entities, but we also want to support
 * simple configuration for this component. Therefore, we need to create image entity object if only URL is given.
 *
 * @param {string} url to the image.
 * @returns image entity (contains: id, type, attributes.variants)
 */
const createFakeImageEntity = url => {
  return {
    id: new UUID('empty'),
    type: 'image',
    attributes: {
      variants: {
        scaled: {
          name: 'scaled',
          // width and height don't matter since we use the image with object-fit
          width: 1200,
          height: 800,
          url,
        },
      },
    },
  };
};

/**
 * Container component that places ResponsiveImage component into the background
 * of actual children given to it.
 *
 * @param {object} props
 */
const ResponsiveBackgroundImageContainer = props => {
  const intl = useIntl();
  const {
    className,
    rootClassName,
    as,
    children,
    childrenWrapperClassName,
    image,
    alt,
    sizes,
    useOverlay,
    ...otherProps
  } = props;
  const Tag = as || 'div';

  const imageEntity = typeof image === 'string' ? createFakeImageEntity(image) : image;
  const variants = imageEntity?.attributes?.variants || {};
  const variantNames = Object.keys(variants);

  const classes = classNames(rootClassName || css.root, className);
  const overlayMaybe = useOverlay ? <div className={css.overlay}></div> : null;
  const childrenWrapperClassNameMaybe = childrenWrapperClassName
    ? { className: childrenWrapperClassName }
    : {};

  return (
    <Tag className={classes} {...otherProps}>
      <div className={css.backgroundImageWrapper}>
        {imageEntity ? (
          <ResponsiveImage
            className={css.backgroundImage}
            image={imageEntity}
            alt={
              alt ||
              intl.formatMessage({ id: 'ResponsiveBackgroundImageContainer.backgroundImageAlt' })
            }
            variants={variantNames}
            sizes={sizes}
          />
        ) : null}
        {overlayMaybe}
      </div>
      <div {...childrenWrapperClassNameMaybe}>{children}</div>
    </Tag>
  );
};

ResponsiveBackgroundImageContainer.defaultProps = {
  className: null,
  rootClassName: null,
  as: 'div',
  children: null,
  image: null,
  alt: null,
  sizes: null,
  useOverlay: true,
};

ResponsiveBackgroundImageContainer.propTypes = {
  className: string,
  rootClassName: string,
  as: string,
  children: node,
  childrenWrapperClassName: string,
  image: oneOfType([string, propTypes.imageAsset]),
  alt: string,
  sizes: string.isRequired,
  useOverlay: bool,
};

export default ResponsiveBackgroundImageContainer;
