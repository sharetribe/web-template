import React from 'react';

// Block components
import BlockDefault from './BlockDefault';
import BlockFooter from './BlockFooter';
import BlockSocialMediaLink from './BlockSocialMediaLink';

import { useIntl } from '../../../util/reactIntl';
import sectionCss from './../SectionBuilder/SectionBuilder.module.css';
import {
  getAvBlockComponents,
  getEffectiveBlockType,
  parseBlockCtaClass,
  createBlockCustomProps,
} from '../../../extensions/pageBuilder/av/blocks';

///////////////////////////////////////////
// Mapping of block types and components //
///////////////////////////////////////////

const defaultBlockComponents = {
  defaultBlock: { component: BlockDefault },
  footerBlock: { component: BlockFooter },
  socialMediaLink: { component: BlockSocialMediaLink },
  ...getAvBlockComponents(),
};

////////////////////
// Blocks builder //
////////////////////

/**
 * @typedef {Object} BlockConfig
 * @property {string} blockId
 * @property {string} blockName
 * @property {'defaultBlock' | 'footerBlock' | 'socialMediaLink'} blockType
 */

/**
 * @typedef {Object} FieldComponentsConfig
 * @property {ReactNode} component
 * @property {Function} pickValidProps
 */

/**
 * @typedef {Object} BlockComponentConfig
 * @property {ReactNode} component
 */

/**
 * This returns an array of Block components from given block config array.
 *
 * @component
 * @param {Object} props
 * @param {Array<BlockConfig>} props.blocks - array of block configs
 * @param {Object} props.options extra options for the block component (e.g. custom fieldComponents)
 * @param {Object<string,FieldComponentsConfig>?} props.options.fieldComponents extra options for the block component (e.g. custom fieldComponents)
 * @param {Object<string,BlockComponentConfig>?} props.options.blockComponents extra options for the block component (e.g. custom fieldComponents)
 * @param {string?} props.responsiveImageSizes
 * @param {string?} props.sectionId
 * @param {string?} props.className add more style rules in addition to components own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @param {string?} props.className add more styles in addition to components own css.root
 * @param {string?} props.mediaClassName add styles for the block's attached media field
 * @param {string?} props.textClassName add styles for the block's attached text field
 * @param {string?} props.ctaButtonClass add styles for the block's attached CTA field
 * @param {Object?} props.params - path params for the named route and its pathname prop
 * @returns {JSX.Element} containing form that allows adding availability exceptions
 */
const BlockBuilder = props => {
  const intl = useIntl();
  const { blocks = [], sectionId, options, ...otherProps } = props;

  // Extract block & field component mappings from props
  // If external mapping has been included for fields
  // E.g. { h1: { component: MyAwesomeHeader } }
  const { blockComponents, fieldComponents } = options || {};
  const blockOptionsMaybe = fieldComponents ? { options: { fieldComponents } } : {};

  // If there's no block, we can't render the correct block component
  if (!blocks || blocks.length === 0) {
    return null;
  }

  // Selection of Block components
  // Combine component-mapping from props together with the default one:
  const components = { ...defaultBlockComponents, ...blockComponents };

  // AV: pre-compute custom props per block (intl-driven copy + CTA overrides).
  const blockCustomPropsList = blocks.map(block => {
    const customProps = createBlockCustomProps(block, intl, sectionCss);
    const blockCtaOverride = parseBlockCtaClass(block.blockName, sectionCss);
    if (blockCtaOverride) {
      customProps.ctaButtonClass = blockCtaOverride;
      if (customProps.twoButtons) {
        if (!customProps.twoButtons.cta1ClassName)
          customProps.ctaButtonPrimaryClass = blockCtaOverride;
        if (!customProps.twoButtons.cta2ClassName)
          customProps.ctaButtonSecondaryClass = blockCtaOverride;
      }
    }
    const tokens = block.blockName
      ? [...block.blockName.matchAll(/(\S+)\s*::/g)].map(m => m[1])
      : [];
    if (tokens.includes('ctaBtnCenter')) {
      customProps.ctaButtonWrapClass = sectionCss.ctaBtnCenterWrap;
    }
    return customProps;
  });

  return (
    <>
      {blocks.map((block, index) => {
        const blockId = block.blockId || `${sectionId}-block-${index + 1}`;
        const effectiveBlockType = getEffectiveBlockType(blockId, block.blockName, block.blockType);
        const config = components[effectiveBlockType];
        const Block = config?.component;
        const blockCustomProps = blockCustomPropsList[index];

        if (Block) {
          return (
            <Block
              key={`${blockId}_i${index}`}
              {...block}
              blockId={blockId}
              {...blockOptionsMaybe}
              {...otherProps}
              {...blockCustomProps}
            />
          );
        } else {
          // If the block type is unknown, the app can't know what to render
          console.warn(`Unknown block type (${block.blockType}) detected inside (${sectionId}).`);
          return null;
        }
      })}
    </>
  );
};

export default BlockBuilder;
