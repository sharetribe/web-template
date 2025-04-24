import React from 'react';
import classNames from 'classnames';

import css from './IconDate.module.css';

/**
 * Calendar icon.
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @returns {JSX.Element} SVG icon
 */
const IconDate = props => {
  const { rootClassName, className } = props;
  const classes = classNames(rootClassName || css.root, className);
  return (
    <svg className={classes} xmlns="http://www.w3.org/2000/svg" width="16" height="16">
      <path d="M5.33398.666504c.36819 0 .66667.298477.66667.666666v.66667h4.00005v-.66667c0-.368189.2984-.666666.6666-.666666.3682 0 .6667.298477.6667.666666v.66667h1.8667c.8627 0 1.4666.74388 1.4666 1.53846v9.5897c0 .7946-.6039 1.5385-1.4666 1.5385H2.80065c-.86279 0-1.46667-.7439-1.46667-1.5385V3.5383c0-.79458.60388-1.53846 1.46667-1.53846h1.86667v-.66667c0-.368189.29847-.666666.66666-.666666ZM4.66732 3.33317H2.80065c-.01729 0-.0441.0063-.07449.03942-.03127.03408-.05884.09093-.05884.16571v2.46154H13.334V3.5383c0-.07478-.0276-.13163-.0589-.16571-.0303-.03312-.0572-.03942-.0744-.03942H11.334v.66667c0 .36819-.2985.66666-.6667.66666-.3682 0-.6666-.29847-.6666-.66666v-.66667H6.00065v.66667c0 .36819-.29848.66666-.66667.66666-.36819 0-.66666-.29847-.66666-.66666v-.66667Zm8.66668 4H2.66732V13.128c0 .0748.02757.1317.05884.1657.03039.0332.0572.0395.07449.0395H13.2007c.0172 0 .0441-.0063.0744-.0395.0313-.034.0589-.0909.0589-.1657V7.33317Z" />
    </svg>
  );
};

export default IconDate;
