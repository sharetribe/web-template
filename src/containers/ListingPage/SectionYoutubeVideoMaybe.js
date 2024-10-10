import React from 'react';

import css from './ListingPage.module.css';
import classNames from 'classnames';

import { lazyLoadWithDimensions } from '../../util/uiHelpers.js';

import { AspectRatioWrapper } from '../../components/index.js';
import { Heading } from '../../components';

const SectionYoutubeVideoMaybe = props => {
  const { videoUrl, heading } = props;

  const extractYouTubeID = url => {
    const regExp = /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?|shorts)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i;
    const match = url.match(regExp);

    return match ? match[1] : null;
  };

  const extractedVideoID = extractYouTubeID(videoUrl);

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

  return extractedVideoID ? (
    <>
      {heading ? (
        <Heading as="h2" rootClassName={css.sectionHeading}>
          {heading}
        </Heading>
      ) : null}
      <section className={css.sectionEmbeddedYoutubeVideo}>
        <YoutubeEmbed youtubeVideoId={extractedVideoID} aspectRatio="16/9" />
      </section>
    </>
  ) : null;
};

export default SectionYoutubeVideoMaybe;
