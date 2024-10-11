import React from 'react';

import css from './ProfilePage.module.css';
import classNames from 'classnames';

import { lazyLoadWithDimensions } from '../../util/uiHelpers.js';
import { extractYouTubeID } from '../../util/string.js';

import { AspectRatioWrapper } from '../../components/index.js';
import { Heading } from '../../components';

const RADIX = 10;
const BLACK_BG = '#000000';

const IFrame = props => {
  const { dimensions, ...rest } = props;
  return <iframe {...dimensions} {...rest} />;
};
const LazyIFrame = lazyLoadWithDimensions(IFrame);

const YoutubeEmbed = props => {
  const { className, rootClassName, youtubeVideoId, aspectRatio } = props;
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

const SectionYoutubeVideoMaybe = props => {
  const { videoUrl, heading } = props;
  if (!videoUrl || !heading) {
    return null;
  }

  const extractedVideoID = extractYouTubeID(videoUrl);

  return extractedVideoID ? (
    <section className={css.sectionEmbeddedYoutubeVideo}>
      {heading ? (
        <Heading as="h2" rootClassName={css.sectionHeading}>
          {heading}
        </Heading>
      ) : null}
      <YoutubeEmbed youtubeVideoId={extractedVideoID} aspectRatio="16/9" />
    </section>
  ) : null;
};

export default SectionYoutubeVideoMaybe;
