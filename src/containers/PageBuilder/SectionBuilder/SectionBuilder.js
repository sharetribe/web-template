import React from 'react';
import classNames from 'classnames';

// Section components
import SectionArticle from './SectionArticle';
import SectionCarousel from './SectionCarousel';
import SectionColumns from './SectionColumns';
import SectionFeatures from './SectionFeatures';
import SectionHero from './SectionHero';

// Styles
// Note: these contain
// - shared classes that are passed as defaultClasses
// - dark theme overrides
// TODO: alternatively, we could consider more in-place way of theming components
import css from './SectionBuilder.module.css';
import SectionFooter from './SectionFooter';

// These are shared classes.
// Use these to have consistent styles between different section components
// E.g. share the same title styles
const DEFAULT_CLASSES = {
  sectionDetails: css.sectionDetails,
  title: css.title,
  description: css.description,
  ctaButton: css.ctaButton,
  blockContainer: css.blockContainer,
};

/////////////////////////////////////////////
// Mapping of section types and components //
/////////////////////////////////////////////

const defaultSectionComponents = {
  article: { component: SectionArticle },
  carousel: { component: SectionCarousel },
  columns: { component: SectionColumns },
  features: { component: SectionFeatures },
  footer: { component: SectionFooter },
  hero: { component: SectionHero },
};

//////////////////////
// Section builder //
//////////////////////

/**
 * @typedef {Object} FieldOption
 * @property {ReactNode} component
 * @property {Function} pickValidProps
 */

/**
 * @typedef {Object} BlockOption
 * @property {ReactNode} component
 */

/**
 * @typedef {Object} SectionOption
 * @property {ReactNode} component
 */

/**
 * @typedef {Object} SectionConfig
 * @property {string} sectionId
 * @property {string} sectionName
 * @property {('article' | 'carousel' | 'columns' | 'features' | 'hero')} sectionType
 */

/**
 * Build section elements from given section config array.
 *
 * @component
 * @param {Object} props
 * @param {Array<SectionConfig>} props.sections
 * @param {Object} props.options
 * @param {Object<string,FieldOption>} props.options.fieldComponents
 * @param {Object<string,BlockOption>} props.options.blockComponents
 * @param {Object<string,SectionOption>} props.options.sectionComponents
 * @param {boolean} props.options.isInsideContainer
 * @returns {JSX.Element} element containing array of sections according from given config array.
 */
const SectionBuilder = props => {
  const { sections = [], options } = props;
  const { sectionComponents = {}, isInsideContainer, ...otherOption } = options || {};

  // If there's no sections, we can't render the correct section component
  if (!sections || sections.length === 0) {
    return null;
  }

  // Selection of Section components
  const components = { ...defaultSectionComponents, ...sectionComponents };
  const getComponent = sectionType => {
    const config = components[sectionType];
    return config?.component;
  };

  // Generate unique ids for sections if operator has managed to create duplicates
  // E.g. "foobar", "foobar1", and "foobar2"
  const sectionIds = [];
  const getUniqueSectionId = (sectionId, index) => {
    const candidate = sectionId || `section-${index + 1}`;
    if (sectionIds.includes(candidate)) {
      let sequentialCandidate = `${candidate}1`;
      for (let i = 2; sectionIds.includes(sequentialCandidate); i++) {
        sequentialCandidate = `${candidate}${i}`;
      }
      return getUniqueSectionId(sequentialCandidate, index);
    } else {
      sectionIds.push(candidate);
      return candidate;
    }
  };

  return (
    <>
      {sections.map((section, index) => {
        const Section = getComponent(section.sectionType);
        // If the default "dark" theme should be applied (when text color is white).
        // By default, this information is stored to customAppearance field
        const isDarkTheme =
          section?.appearance?.fieldType === 'customAppearance' &&
          section?.appearance?.textColor === 'white';
        const classes = classNames({ [css.darkTheme]: isDarkTheme });
        const sectionId = getUniqueSectionId(section.sectionId, index);

        if (Section) {
          return (
            <Section
              key={`${sectionId}_i${index}`}
              className={classes}
              defaultClasses={DEFAULT_CLASSES}
              isInsideContainer={isInsideContainer}
              options={otherOption}
              {...section}
              sectionId={sectionId}
            />
          );
        } else {
          // If the section type is unknown, the app can't know what to render
          console.warn(
            `Unknown section type (${section.sectionType}) detected using sectionName (${section.sectionName}).`
          );
          return null;
        }
      })}
    </>
  );
};

export default SectionBuilder;
