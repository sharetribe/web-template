import React from 'react';
import { node, string } from 'prop-types';

// External link that opens in a new tab/window, ensuring that the
// opened page doesn't have access to the current page.
//
// See: https://mathiasbynens.github.io/rel-noopener/
const ExternalLink = props => {
  const { children, target, ...rest } = props;
  const targetProp = target || '_blank';
  const anchorProps =
    targetProp === '_blank'
      ? { target: '_blank', rel: 'noopener noreferrer' }
      : { target: targetProp };
  return (
    <a {...rest} {...anchorProps}>
      {children}
    </a>
  );
};

ExternalLink.defaultProps = { children: null, target: '_blank' };

ExternalLink.propTypes = { children: node, target: string };

export default ExternalLink;
