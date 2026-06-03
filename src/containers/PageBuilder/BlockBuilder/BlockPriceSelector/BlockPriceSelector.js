import React from 'react';
import classNames from 'classnames';

import BlockContainer from '../BlockContainer';
import PricingToggle from '../../../../components/PricingToggle/PricingToggle';

import css from './BlockPriceSelector.module.css';

/**
 * @typedef {Object} FieldComponentConfig
 * @property {ReactNode} component
 * @property {Function} pickValidProps
 */

/**
 * This returns a component that can render 'defaultBlock' config.
 *
 * @component
 * @param {Object} props
 * @param {string?} props.blockId id from the block config
 * @param {string} props.blockName name from the block config (not used)
 * @param {'defaultBlock'} props.blockType blockType is set to 'defaultBlock'
 * @param {string?} props.className add more style rules in addition to components own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @param {string?} props.className add more styles in addition to components own css.root
 * @param {string?} props.mediaClassName add styles for the block's attached media field
 * @param {string?} props.textClassName add styles for the block's attached text field
 * @param {string?} props.ctaButtonClass add styles for the block's attached CTA field
 * @param {Object?} props.title heading config for the block
 * @param {Object?} props.text content config for the block (can be markdown)
 * @param {Object?} props.callToAction call to action button (e.g. internal link config)
 * @param {string?} props.responsiveImageSizes
 * @param {Object} props.options extra options for the block component (e.g. custom fieldComponents)
 * @param {Object<string,FieldComponentConfig>?} props.options.fieldComponents Custom fieldComponents
 * @returns {JSX.Element} component that renders block type: 'defaultBlock'
 */
const BlockPriceSelector = props => {
  const { blockId, className, rootClassName, toggles, plans } = props;
  const classes = classNames(rootClassName || css.root, className);

  return (
    <BlockContainer id={blockId} className={classes}>
      <PricingToggle plans={plans} toggles={toggles} />
    </BlockContainer>
  );
};

export default BlockPriceSelector;
