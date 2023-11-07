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

const PLATFORM_CONF = {
  facebook: { icon: facebookIcon, name: 'Facebook' },
  instagram: { icon: instagramIcon, name: 'Instagram' },
  linkedin: { icon: linkedinIcon, name: 'LinkedIn' },
  pinterest: { icon: pinterestIcon, name: 'Pinterest' },
  tiktok: { icon: tiktokIcon, name: 'TikTok' },
  twitter: { icon: twitterIcon, name: 'X' },
  youtube: { icon: youtubeIcon, name: 'YouTube' },
};

const getIconConf = platform => {
  const icon = PLATFORM_CONF[platform]?.icon || null;
  return icon;
};
const getIconTitle = platform => {
  return PLATFORM_CONF[platform]?.name || platform;
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

  const { className, rootClassName, href, platform } = props;
  const classes = classNames(rootClassName || css.link, className);
  const titleMaybe = Icon ? { title: getIconTitle(platform) } : {};
  const children = Icon ? <Icon /> : platform;
  const linkProps = { className: classes, href, children, ...titleMaybe };

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
