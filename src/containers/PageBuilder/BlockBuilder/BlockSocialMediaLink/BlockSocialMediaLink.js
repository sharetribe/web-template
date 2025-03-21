import React from 'react';
import classNames from 'classnames';

import Field from '../../Field';
import BlockContainer from '../BlockContainer';

import css from './BlockSocialMediaLink.module.css';

/**
 * @typedef {Object} FieldComponentConfig
 * @property {ReactNode} component
 * @property {Function} pickValidProps
 */

/**
 * This returns a component that can render 'socialMediaLink' config.
 *
 * @component
 * @param {Object} props
 * @param {string?} props.blockId id from the block config
 * @param {string} props.blockName name from the block config (not used)
 * @param {'socialMediaLink'} props.blockType blockType is set to 'socialMediaLink'
 * @param {string?} props.className add more style rules in addition to components own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @param {Object} props.link content config for the block (can be markdown)
 * @param {'socialMediaLink'} props.link.fieldType socialMediaLink type of field config
 * @param {'facebook' | 'instagram' | 'linkedin' | 'pinterest' | 'tiktok' | 'twitter' | 'youtube'} props.link.platform which supported service platform
 * @param {string} props.link.url url to social media service profile
 * @param {Object} props.options extra options for the block component (e.g. custom fieldComponents)
 * @param {Object<string,FieldComponentConfig>?} props.options.fieldComponents Custom fieldComponents
 * @returns {JSX.Element} component that renders block type: 'socialMediaLink'
 */
const BlockSocialMediaLink = props => {
  const { blockId, className, rootClassName, link, options } = props;

  const classes = classNames(rootClassName || css.root, className);

  return (
    <BlockContainer id={blockId} className={classes}>
      <Field data={link} options={options} className={css.link} />
    </BlockContainer>
  );
};

export default BlockSocialMediaLink;
