import React from 'react';
import { node, string } from 'prop-types';
import classNames from 'classnames';

import { ExternalLink } from '../../../../components/index.js';
import {
  facebookIcon,
  instagramIcon,
  linkedinIcon,
  pinterestIcon,
  tiktokIcon,
  twitterIcon,
  youtubeIcon,
} from './Icons';

import css from './SocialMediaLink.module.css';

const ICON_CONF = {
  facebook: facebookIcon,
  instagram: instagramIcon,
  linkedin: linkedinIcon,
  pinterest: pinterestIcon,
  tiktok: tiktokIcon,
  twitter: twitterIcon,
  youtube: youtubeIcon,
};

const getIconConf = platform => {
  const icon = ICON_CONF[platform] || null;
  return icon;
};

export const supportedPlatforms = [
  'facebook',
  'instagram',
  'linkedin',
  'pinterest',
  'tiktok',
  'twitter',
  'youtube',
];

export const SocialMediaLink = React.forwardRef((props, ref) => {
  const Icon = getIconConf(props.platform);

  const { className, rootClassName, href, title, platform } = props;
  const classes = classNames(rootClassName || css.link, className);
  const titleMaybe = Icon ? { title } : {};
  const iconOrPlatform = Icon ? <Icon /> : platform;
  const linkProps = { className: classes, href, children: iconOrPlatform, ...titleMaybe };

  // Markdown parser (rehype-sanitize) might return undefined href
  if (!href || !platform) {
    return null;
  }

  return <ExternalLink {...linkProps} ref={ref} />;
});

SocialMediaLink.displayName = 'SocialMediaLink';

SocialMediaLink.defaultProps = {
  title: null,
  rootClassName: null,
  className: null,
};

SocialMediaLink.propTypes = {
  title: string,
  rootClassName: string,
  className: string,
  platform: node.isRequired,
  href: string.isRequired,
};
