import React from 'react';
import { arrayOf, func, node, oneOf, shape, string } from 'prop-types';

// Block components
import BlockDefault from './BlockDefault';
import BlockFooter from './BlockFooter';
import BlockSocialMediaLink from './BlockSocialMediaLink';

// Custom block components
import SearchRequestLinks from '../../../extensions/common/components/Sections/Blocks/SearchRequestLinks/SearchRequestLinks';
import SocialProofReviews from '../../../extensions/common/components/Sections/Blocks/SocialProofReviews/SocialProofReviews';
import AgentApplyNow from '../../../extensions/common/components/Sections/Blocks/AgentApplyNow/AgentApplyNow';



///////////////////////////////////////////
// Mapping of block types and components //
///////////////////////////////////////////

const defaultBlockComponents = {
  defaultBlock: { component: BlockDefault },
  footerBlock: { component: BlockFooter },
  socialMediaLink: { component: BlockSocialMediaLink },
};
const customBlockComponents = {
  searchRequestLinks: <SearchRequestLinks />, 
  socialProofReviews: <SocialProofReviews/>,
  agentApplyNow: <AgentApplyNow/>
};
////////////////////
// Blocks builder //
////////////////////

const BlockBuilder = props => {
  const { blocks, sectionId, options, ...otherProps } = props;

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

  return (
    <>
      {blocks.map((block, index) => {
        const config = components[block.blockType];
        const Block = config?.component;
        const blockId = block.blockId || `${sectionId}-block-${index + 1}`;

        if (Block) {
          if(block.blockName?.indexOf('customTemplate:') > -1){
            //console.log('section blocks inside custom SectionBuilder', section.blocks);
            const customBlockName = block.blockName.split(':')[1];
            const CustomComponent = customBlockComponents[customBlockName];

            return (
              <React.Fragment key={customBlockName}>
                {React.cloneElement(CustomComponent, { block: block })}
              </React.Fragment>
            );
          } else {
            return (
              <Block
                key={`${blockId}_i${index}`}
                {...block}
                blockId={blockId}
                {...blockOptionsMaybe}
                {...otherProps}
              />
            );
          }
        } else {
          // If the block type is unknown, the app can't know what to render
          console.warn(`Unknown block type (${block.blockType}) detected inside (${sectionId}).`);
          return null;
        }
      })}
    </>
  );
};

const propTypeBlock = shape({
  blockId: string,
  blockName: string,
  blockType: oneOf(['defaultBlock', 'footerBlock', 'socialMediaLink']).isRequired,
  // Plus all kind of unknown fields.
  // BlockBuilder doesn't really need to care about those
});

const propTypeOption = shape({
  fieldComponents: shape({ component: node, pickValidProps: func }),
  blockComponents: shape({ component: node }),
});

BlockBuilder.defaultProps = {
  blocks: [],
  options: null,
  responsiveImageSizes: null,
  className: null,
  rootClassName: null,
  mediaClassName: null,
  textClassName: null,
  ctaButtonClass: null,
};

BlockBuilder.propTypes = {
  blocks: arrayOf(propTypeBlock),
  options: propTypeOption,
  responsiveImageSizes: string,
  className: string,
  rootClassName: string,
  mediaClassName: string,
  textClassName: string,
  ctaButtonClass: string,
};

export default BlockBuilder;
