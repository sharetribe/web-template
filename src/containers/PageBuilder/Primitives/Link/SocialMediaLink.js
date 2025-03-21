import React from 'react';
import classNames from 'classnames';

import { ExternalLink } from '../../../../components/index.js';
import {
  facebookIcon,
  instagramIcon,
  linkedinIcon,
  pinterestIcon,
  tiktokIcon,
  xIcon,
  youtubeIcon,
} from './Icons';

import css from './SocialMediaLink.module.css';

const PLATFORM_CONF = {
  facebook: { icon: facebookIcon, name: 'Facebook' },
  instagram: { icon: instagramIcon, name: 'Instagram' },
  linkedin: { icon: linkedinIcon, name: 'LinkedIn' },
  pinterest: { icon: pinterestIcon, name: 'Pinterest' },
  tiktok: { icon: tiktokIcon, name: 'TikTok' },
  twitter: { icon: xIcon, name: 'X' },
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

/**
 * Link element which internally uses NamedLink or ExternalLink
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @param {string?} props.title
 * @param {('facebook' | 'instagram' | 'linkedin' | 'pinterest' | 'tiktok' | 'twitter' | 'youtube')} props.platform social media service platform
 * @param {string} props.href social media service profile
 * @returns {JSX.Element} social media link (wraps a platform-specific SVG icon)
 */
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
