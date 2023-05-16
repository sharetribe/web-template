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
  const Icon = getIconConf(props.children);

  const { className, rootClassName, href, title, children } = props;
  const classes = classNames(rootClassName || css.link, className);
  const titleMaybe = title ? { title } : {};
  const iconOrChildren = Icon ? <Icon /> : children;
  const linkProps = { className: classes, href, children: iconOrChildren, ...titleMaybe };

  // Markdown parser (rehype-sanitize) might return undefined href
  if (!href || !children) {
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
  children: node.isRequired,
  href: string.isRequired,
};
