import React from 'react';
import { number, objectOf, oneOf, shape, string } from 'prop-types';
import classNames from 'classnames';

import { ResponsiveImage } from '../../../../components/index.js';

import css from './CustomAppearance.module.css';

/**
 * @typedef {Object} ImageVariant
 * @property {number} width
 * @property {number} height
 * @property {string} url image source
 */

/**
 * Render a custom appearance for a section component.
 * E.g. change the background color or image of the SectionContainer
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @param {string?} props.backgroundColor hexadecimal color string ('#ffaa00')
 * @param {Object} props.backgroundImage
 * @param {string} props.backgroundImage.id
 * @param {'imageAsset'} props.backgroundImage.type
 * @param {Object} props.backgroundImage.attributes
 * @param {Object<key,ImageVariant>} props.backgroundImage.attributes.variants
 * @param {Object} props.backgroundImageOverlay
 * @param {string} props.backgroundImageOverlay.preset
 * @param {string} props.backgroundImageOverlay.color
 * @param {number} props.backgroundImageOverlay.opacity
 * @param {string?} props.alt
 * @param {string?} props.sizes
 * @returns {JSX.Element} custom appearance for the container of a section component
 */
export const CustomAppearance = React.forwardRef((props, ref) => {
  const {
    className,
    rootClassName,
    backgroundColor,
    backgroundImage,
    backgroundImageOverlay,
    alt = 'background image',
    sizes,
  } = props;

  const getVariantNames = img => {
    const { variants } = img?.attributes || {};
    return variants ? Object.keys(variants) : [];
  };

  const backgroundColorMaybe = backgroundColor ? { backgroundColor } : {};
  // On top of the background image there could be an overlay that mixes in some color (e.g. black)
  // with the given opacity. Currently, there are 2 presets: "dark" and "darker".
  // At this point this is used as a shader to add contrast between foreground text and background.
  const { preset, color: overlayColor, opacity: overlayOpacity } = backgroundImageOverlay || {};
  const hasBackgroundOverlay = typeof preset === 'string' && preset !== 'none';
  const overlayStyle = hasBackgroundOverlay
    ? { backgroundColor: overlayColor, opacity: overlayOpacity }
    : {};

  const classes = classNames(rootClassName || css.backgroundImageWrapper, className);
  return (
    <div className={classes} style={backgroundColorMaybe}>
      {backgroundImage ? (
        <ResponsiveImage
          className={css.backgroundImage}
          ref={ref}
          alt={alt}
          image={backgroundImage}
          variants={getVariantNames(backgroundImage)}
          sizes={sizes}
        />
      ) : null}
      {hasBackgroundOverlay ? <div className={css.backgroundOverlay} style={overlayStyle} /> : null}
    </div>
  );
});

CustomAppearance.displayName = 'CustomAppearance';
