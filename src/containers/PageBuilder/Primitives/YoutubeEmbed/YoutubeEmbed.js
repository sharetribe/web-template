import React from 'react';
import classNames from 'classnames';

import { lazyLoadWithDimensions } from '../../../../util/uiHelpers.js';

import { AspectRatioWrapper } from '../../../../components/index.js';

import css from './YoutubeEmbed.module.css';

const RADIX = 10;
const BLACK_BG = '#000000';

const IFrame = props => {
  const { dimensions, ...rest } = props;
  return <iframe {...dimensions} {...rest} />;
};
const LazyIFrame = lazyLoadWithDimensions(IFrame);

/**
 * Embeds a YouTube video inside an iframe that has given aspect ratio.
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @param {string} props.youtubeVideoId video id of a youtube video
 * @param {string?} props.aspectRatio e.g. '16/9'
 * @returns {JSX.Element} an element with given aspect ratio that contains iframe showing youtube video
 */
export const YoutubeEmbed = props => {
  const { className, rootClassName, youtubeVideoId, aspectRatio = '16/9' } = props;
  const hasSlash = aspectRatio.indexOf('/') > 0;
  const [aspectWidth, aspectHeight] = hasSlash ? aspectRatio.split('/') : [16, 9];
  const width = Number.parseInt(aspectWidth, RADIX);
  const height = Number.parseInt(aspectHeight, RADIX);
  const classes = classNames(rootClassName || css.video, className);

  return (
    <AspectRatioWrapper className={classes} width={width} height={height}>
      <LazyIFrame
        src={`https://www.youtube-nocookie.com/embed/${youtubeVideoId}?rel=0`}
        className={css.iframe}
        style={{ background: BLACK_BG }}
        frameBorder="0"
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="Embedded youtube"
      />
    </AspectRatioWrapper>
  );
};

YoutubeEmbed.displayName = 'YoutubeEmbed';
