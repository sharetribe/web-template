import React from 'react';
import classNames from 'classnames';

import Field, { hasDataInFields } from '../../Field';
import BlockBuilder from '../../BlockBuilder';

// import IconArrowHead from '../../IconArrowHead';

import SectionContainer from '../SectionContainer';
import css from './SectionArticle.module.css';
import { NamedLink } from '../../../../components';

/**
 * @typedef {Object} BlockConfig
 * @property {string} blockId
 * @property {string} blockName
 * @property {'defaultBlock' | 'footerBlock' | 'socialMediaLink'} blockType
 */

/**
 * @typedef {Object} FieldComponentConfig
 * @property {ReactNode} component
 * @property {Function} pickValidProps
 */

/**
 * Section component that's able to show article content.
 * The article content is mainly supposed to be inside a block.
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @param {Object} props.defaultClasses
 * @param {string} props.defaultClasses.sectionDetails
 * @param {string} props.defaultClasses.title
 * @param {string} props.defaultClasses.description
 * @param {string} props.defaultClasses.ctaButton
 * @param {string} props.sectionId id of the section
 * @param {'article'} props.sectionType
 * @param {Object?} props.title
 * @param {Object?} props.description
 * @param {Object?} props.appearance
 * @param {Object?} props.callToAction
 * @param {Array<BlockConfig>?} props.blocks array of block configs
 * @param {boolean?} props.isInsideContainer
 * @param {Object} props.options extra options for the section component (e.g. custom fieldComponents)
 * @param {Object<string,FieldComponentConfig>?} props.options.fieldComponents custom fields
 * @returns {JSX.Element} Section for article content
 */
const SectionArticle = props => {
  const {
    sectionId,
    className,
    rootClassName,
    defaultClasses,
    title,
    description,
    appearance,
    callToAction,
    blocks = [],
    isInsideContainer = false,
    options,
  } = props;

  // If external mapping has been included for fields
  // E.g. { h1: { component: MyAwesomeHeader } }
  const fieldComponents = options?.fieldComponents;
  const fieldOptions = { fieldComponents };

  const hasHeaderFields = hasDataInFields([title, description, callToAction], fieldOptions);
  const hasBlocks = blocks?.length > 0;

  return (
    <SectionContainer
      id={sectionId}
      className={className}
      rootClassName={rootClassName}
      appearance={appearance}
      options={fieldOptions}
    >
      {hasHeaderFields ? (
        <header className={defaultClasses.sectionDetails}>
          <Field data={title} className={defaultClasses.title} options={fieldOptions} />
          <Field data={description} className={defaultClasses.description} options={fieldOptions} />
          <Field data={callToAction} className={defaultClasses.ctaButton} options={fieldOptions} />
        </header>
      ) : null}
      {sectionId === 'ready-to-start' ? (
        <div className={css.readyToStartButtons}>
          <NamedLink className={css.listTackleButton} name="SearchPage">
            List Your Tackle
            <svg style={{fill:"transparent"}}width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3.33325 8H12.6666" stroke="white" style={{"stroke": "white;stroke-opacity:1;"}} stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M8 3.3335L12.6667 8.00016L8 12.6668" stroke="white" style={{"stroke": "white;stroke-opacity:1;"}} stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round" />
            </svg>

          </NamedLink>
          <NamedLink className={css.browseTackleButton} name="SearchPage">
            Browse Tackle
          </NamedLink>
        </div>
      ) : null}
      {hasBlocks ? (
        <div
          className={classNames(defaultClasses.blockContainer, css.articleMain, {
            [css.noSidePaddings]: isInsideContainer,
          })}
        >
          <BlockBuilder
            blocks={blocks}
            sectionId={sectionId}
            ctaButtonClass={defaultClasses.ctaButton}
            options={options}
          />
        </div>
      ) : null}
    </SectionContainer>
  );
};

export default SectionArticle;
