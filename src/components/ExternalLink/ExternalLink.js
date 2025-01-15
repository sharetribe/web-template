import React from 'react';

/**
 * External link that opens in a new tab/window, ensuring that the
 * opened page doesn't have access to the current page.
 * See: https://mathiasbynens.github.io/rel-noopener/
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @param {string} props.target attribute for <a> element
 * @param {ReactNode} props.children
 * @returns {JSX.Element} External link
 */
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

export default ExternalLink;
