import React from 'react';

// Block components
import BlockDefault from './BlockDefault';
import BlockWithCols from './BlockWithCols';
import BlockPriceSelector from './BlockPriceSelector';
import BlockFooter from './BlockFooter';
import BlockSocialMediaLink from './BlockSocialMediaLink';

// To load Marketplace texts.
import { useIntl } from '../../../util/reactIntl';

import sectionCss from './../SectionBuilder/SectionBuilder.module.css';

///////////////////////////////////////////
// Mapping of block types and components //
///////////////////////////////////////////

const defaultBlockComponents = {
  defaultBlock: { component: BlockDefault },
  blockWithCols: { component: BlockWithCols },
  blockPriceSelector: { component: BlockPriceSelector },
  footerBlock: { component: BlockFooter },
  socialMediaLink: { component: BlockSocialMediaLink },
};

const DEFAULT_CLASSES = {
  ctaButtonPrimary: sectionCss.ctaButtonPrimary,
  ctaButtonSecondary: sectionCss.ctaButtonSecondary,
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

  const blockCustomPropsList = blocks.map((block, index) => {
    return createBlockCustomProps(block);
  });

  return (
    <>
      {blocks.map((block, index) => {
        const config = components[block.blockType];
        const Block = config?.component;
        const blockId = block.blockId || `${sectionId}-block-${index + 1}`;
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

/**
 * Create custom block properties object for block overrides.
 * @param {Object} block The block object.
 * @return {Object} Custom block properties
 */
function createBlockCustomProps(block) {
  const intl = useIntl();
  const blockCustomProps = {};
  // Custom Blocks. Use name to enable.
  blockCustomProps.ctaButtonPrimaryClass = DEFAULT_CLASSES.ctaButtonPrimary;
  blockCustomProps.ctaButtonSecondaryClass = DEFAULT_CLASSES.ctaButtonSecondary;
  // ie. blockName = '2 cols buttons :: block_name';
  if (block.blockName?.includes('contact buttons ::')) {
    blockCustomProps.contactButtons = {
      ctaButtonPrimaryClass: DEFAULT_CLASSES.ctaButtonPrimary,
      ctaButtonSecondaryClass: DEFAULT_CLASSES.ctaButtonSecondary,
      callToAction1: {
        fieldType: 'internalButtonLink',
        href: intl.formatMessage({ id: 'ContactButtons.' + block.blockId + '.cta1Link', defaultMessage:'Hello' }),
        content: intl.formatMessage({ id: 'ContactButtons.' + block.blockId + '.cta1Text', defaultMessage:'Hello' }),
      },
      callToAction2: {
        fieldType: 'internalButtonLink',
        href: intl.formatMessage({ id: 'ContactButtons.' + block.blockId + '.cta2Link', defaultMessage:'Hello' }),
        content: intl.formatMessage({ id: 'ContactButtons.' + block.blockId + '.cta2Text', defaultMessage:'Hello' }),
      },
      social: {
        fieldType: 'socialMediaLink',
        href: intl.formatMessage({ id: 'ContactButtons.' + block.blockId + '.socialLink', defaultMessage:'Hello' }),
        content: intl.formatMessage({ id: 'ContactButtons.' + block.blockId + '.socialText', defaultMessage:'Hello' }),
      },
    };
  }
  // Adds 2 columns to the end of the block content.
  if (block.blockName?.includes('2 cols ::')) {
    blockCustomProps.blueCols = {
      col1Title: intl.formatMessage({ id: 'BlueCols.' + block.blockId + '.col1Title', defaultMessage:' ' }),
      col1Text: intl.formatMessage({ id: 'BlueCols.' + block.blockId + '.col1Text', defaultMessage:' ' }),
      col2Title: intl.formatMessage({ id: 'BlueCols.' + block.blockId + '.col2Title', defaultMessage:' ' }),
      col2Text: intl.formatMessage({ id: 'BlueCols.' + block.blockId + '.col2Text', defaultMessage:' ' }),
      col3Title: intl.formatMessage({ id: 'BlueCols.' + block.blockId + '.col3Title', defaultMessage:' ' }),
      col3Text: intl.formatMessage({ id: 'BlueCols.' + block.blockId + '.col3Text', defaultMessage:' ' }),
    };
  }
  // Adds 2 buttons to the end of the block content.
  if (block.blockName?.includes('2 buttons ::')) {
    blockCustomProps.twoButtons = {
      titleEyebrow: intl.formatMessage({ id: 'TwoButtons.' + block.blockId + '.titleEyebrow', defaultMessage:'' }),
      callToAction1: {
        fieldType: 'internalButtonLink',
        href: intl.formatMessage({ id: 'TwoButtons.' + block.blockId + '.cta1Link', defaultMessage:'Hello' }),
        content: intl.formatMessage({ id: 'TwoButtons.' + block.blockId + '.cta1Text', defaultMessage:'Hello' }),
      },
      callToAction2: {
        fieldType: 'internalButtonLink',
        href: intl.formatMessage({ id: 'TwoButtons.' + block.blockId + '.cta2Link', defaultMessage:'Hello' }),
        content: intl.formatMessage({ id: 'TwoButtons.' + block.blockId + '.cta2Text', defaultMessage:'Hello' }),
      },
    };
  }
  if (block.blockName?.includes('full height media ::')) {
    blockCustomProps.hasFullHeightMedia = true;
  }

  if (block.blockName?.includes('buyer list ::')) {
    blockCustomProps.showBuyerList = true;
    blockCustomProps.buyerListButton = {
      fieldType: 'internalButtonLink',
      href: intl.formatMessage({ id: 'CustomList.' + block.blockId + '.buttonLink', defaultMessage: ' ' }),
      content: intl.formatMessage({ id: 'CustomList.' + block.blockId + '.buttonText', defaultMessage: ' ' }),
    };
    blockCustomProps.buyerListData = [];
    for (let r = 1; r <= 5; r++) {
      blockCustomProps.buyerListData.push({
        title: intl.formatMessage({ id: 'CustomList.' + block.blockId + '.title' + r, defaultMessage: ' ' }),
        text: intl.formatMessage({ id: 'CustomList.' + block.blockId + '.text' + r, defaultMessage: ' ' }),
      });
    }
  }
  if (block.blockName?.includes('seller list ::')) {
    blockCustomProps.showSellerList = true;
    blockCustomProps.sellerListButton = {
      fieldType: 'internalButtonLink',
      href: intl.formatMessage({ id: 'CustomList.' + block.blockId + '.buttonLink', defaultMessage: ' ' }),
      content: intl.formatMessage({ id: 'CustomList.' + block.blockId + '.buttonText', defaultMessage: ' ' }),
    };
    blockCustomProps.sellerListData = [];
    for (let r = 1; r <= 5; r++) {
      blockCustomProps.sellerListData.push(
        {
          title: intl.formatMessage({ id: 'CustomList.' + block.blockId + '.title' + r, defaultMessage: ' ' }),
          text: intl.formatMessage({ id: 'CustomList.' + block.blockId + '.text' + r, defaultMessage: ' ' }),
        }
      );
    }
  }

  // CTA is secondary style.
  if (block.blockName?.includes('button secondary ::')) {
    blockCustomProps.hasCTASecondary = true;
  }
  // CTA is tertiary style.
  if (block.blockName?.includes('button tertiary ::')) {
    blockCustomProps.hasCTATertiary = true;
  }
  // Content text is smaller.
  if (block.blockName?.includes('smaller ::')) {
    blockCustomProps.hasTextSmaller = true;
  }
  // Content text is larger & gray.
  if (block.blockName?.includes('text larger ::')) {
    blockCustomProps.hasTextLarger = true;
  }
  // Content text is larger & gray.
  if (block.blockName?.includes('text gray ::')) {
    blockCustomProps.hasTextGray = true;
  }
  // Content text is smaller & darkgray.
  if (block.blockName?.includes('text darkgray ::')) {
    blockCustomProps.hasTextDarkGray = true;
  }
  // Content text is smaller & darkgray.
  if (block.blockName?.includes('text nogap ::')) {
    blockCustomProps.hasTextNoGap = true;
  }
  // Content has numeric list large items.
  if (block.blockName?.includes('large list :: ')) {
    blockCustomProps.hasLargeList = true;
  }
  if (block.blockName?.includes('newsletter form ::')) {
    blockCustomProps.hasNewsletterForm = true;
    blockCustomProps.disclaimerText="Al ingresar tu correo, aceptas recibir correos promocionales de Archivo Vintach y nuestra Política de Privacidad. Puedes darte de baja en cualquier momento.";
    blockCustomProps.okMsg="¡Gracias! Por favor, revisa tu bandeja de entrada.";
    blockCustomProps.errorMsg="La suscripción ha fallado. Inténtalo de nuevo más tarde.";
  }
  // Image is small Icon.
  if (block.blockName?.includes('icon img ::')) {
    blockCustomProps.hasIconImg = true;
  }
  // Social Link strip.
  if (block.blockName?.includes('social links ::')) {
    blockCustomProps.hasSocialLinks = true;
  }
  // Short Content for block.
  if (block.blockName?.includes('content short ::')) {
    blockCustomProps.hasShortContent = true;
  }
  // Section with 2 columns and 2 buttons.
  if (block.blockName?.includes('2 cols buttons ::')) {
    block.blockType = 'blockWithCols';

    blockCustomProps.ctaButtonPrimaryClass = DEFAULT_CLASSES.ctaButtonPrimary;
    blockCustomProps.ctaButtonSecondaryClass = DEFAULT_CLASSES.ctaButtonSecondary;

    blockCustomProps.titleEyebrow = intl.formatMessage({ id: 'BlockWithCols.' + block.blockId + '.titleEyebrow', defaultMessage:'' });
    blockCustomProps.col1Title = intl.formatMessage({ id: 'BlockWithCols.' + block.blockId + '.col1Title', defaultMessage:'Hello' });
    blockCustomProps.col1Title = intl.formatMessage({ id: 'BlockWithCols.' + block.blockId + '.col1Title', defaultMessage:'Hello' });
    blockCustomProps.col2Title = intl.formatMessage({ id: 'BlockWithCols.' + block.blockId + '.col2Title', defaultMessage:'Hello' });
    blockCustomProps.col1Text = intl.formatMessage({ id: 'BlockWithCols.' + block.blockId + '.col1Text', defaultMessage:'Hello' });
    blockCustomProps.col2Text = intl.formatMessage({ id: 'BlockWithCols.' + block.blockId + '.col2Text', defaultMessage:'Hello' });
    blockCustomProps.callToAction1 = {
      fieldType: 'internalButtonLink',
      href: intl.formatMessage({ id: 'BlockWithCols.' + block.blockId + '.cta1Link', defaultMessage:'Hello' }),
      content: intl.formatMessage({ id: 'BlockWithCols.' + block.blockId + '.cta1Text', defaultMessage:'Hello' }),
    };
    blockCustomProps.callToAction2 = {
      fieldType: 'internalButtonLink',
      href: intl.formatMessage({ id: 'BlockWithCols.' + block.blockId + '.cta2Link', defaultMessage:'Hello' }),
      content: intl.formatMessage({ id: 'BlockWithCols.' + block.blockId + '.cta2Text', defaultMessage:'Hello' }),
    };
  }
  // Section photo slider
  if (block.blockName?.includes('photo slider ::')) {
    blockCustomProps.sliderImages = [
      intl.formatMessage({ id: 'PhotoSlider.' + block.blockId + '.image_1', defaultMessage:'' }),
      intl.formatMessage({ id: 'PhotoSlider.' + block.blockId + '.image_2', defaultMessage:'' }),
      intl.formatMessage({ id: 'PhotoSlider.' + block.blockId + '.image_3', defaultMessage:'' }),
      intl.formatMessage({ id: 'PhotoSlider.' + block.blockId + '.image_4', defaultMessage:'' }),
    ];
  }

  return blockCustomProps;
}

export default BlockBuilder;
