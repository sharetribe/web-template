import React from 'react';
import { node, string } from 'prop-types';
import classNames from 'classnames';
import { useLocation } from 'react-router-dom';

import { useRouteConfiguration } from '../../../../context/routeConfigurationContext.js';
import { matchPathname } from '../../../../util/routes.js';

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
}

const getIconConf = (platform) => {
  const icon =  ICON_CONF[platform] || null;
  console.log({ icon });
  return icon;
}

export const SocialMediaLink = React.forwardRef((props, ref) => {
  const location = useLocation();
  const routes = useRouteConfiguration();
  console.log('social media link props',{ props })
  const Icon = getIconConf(props.children)
  console.log({ Icon })

  const iconMaybe = Icon ? <Icon/> : null;

  const { className, rootClassName, href, title, children } = props;
  const classes = classNames(rootClassName || css.link, className);
  const titleMaybe = title ? { title } : {};
  const iconOrChildren = Icon ? <Icon/> : children;
  const linkProps = { className: classes, href, children: iconOrChildren, ...titleMaybe };

  // Markdown parser (rehype-sanitize) might return undefined href
  if (!href || !children) {
    return null;
  }

  return <ExternalLink {...linkProps} ref={ref} />;
});

SocialMediaLink.displayName = 'SocialMediaLink';

SocialMediaLink.defaultProps = {
  rootClassName: null,
  className: null,
};

SocialMediaLink.propTypes = {
  rootClassName: string,
  className: string,
  children: node.isRequired,
  href: string.isRequired,
};
