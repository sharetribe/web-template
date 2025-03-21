import React from 'react';
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
 * @component
 * @param {Object} props
 * @param {string} [props.rootClassName] - Custom class that overrides the default class for the root element
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} [props.as] - The tag to render the component as
 * @param {ReactNode} props.children - The children to render
 * @param {string} [props.childrenWrapperClassName] - Custom class that extends the default class for the children wrapper element
 * @param {string|propTypes.imageAsset} props.image - The image to render
 * @param {string} [props.alt] - The alt text for the image
 * @param {string} props.sizes - The sizes attribute for the image
 * @param {boolean} [props.useOverlay] - Whether to use an overlay
 * @returns {JSX.Element}
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

export default ResponsiveBackgroundImageContainer;
