import React from 'react';

import Field, { hasDataInFields } from '../../Field';
import PricingToggle from '../../../../components/PricingToggle/PricingToggle';

import AVSectionContainer from '../SectionContainer/AVSectionContainer';

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
 * Section component that's able to show blocks in multiple different columns (defined by "numColumns" prop)
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
 * @param {'columns'} props.sectionType
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
const SectionPriceSelector = props => {
    const {
        sectionId,
        className,
        rootClassName,
        defaultClasses,
        title,
        description,
        appearance,
        callToAction,
        options,
        customOption,
        toggles,
        plans,
    } = props;

    // If external mapping has been included for fields
    // E.g. { h1: { component: MyAwesomeHeader } }
    const fieldComponents = options?.fieldComponents;
    const fieldOptions = { fieldComponents };

    const hasHeaderFields = hasDataInFields([title, description, callToAction], fieldOptions);

    return (
        <AVSectionContainer
            id={sectionId}
            className={className}
            rootClassName={rootClassName}
            appearance={appearance}
            options={fieldOptions}
            customOption={customOption}
        >
            {hasHeaderFields ? (
                <header className={defaultClasses.sectionDetails}>
                    <Field data={title} className={defaultClasses.title} options={fieldOptions} />
                    <Field data={description} className={defaultClasses.description} options={fieldOptions} />
                    <Field data={callToAction} className={defaultClasses.ctaButton} options={fieldOptions} />
                </header>
            ) : null}

            <PricingToggle plans={plans} toggles={toggles} />
        </AVSectionContainer>
    );
};

export default SectionPriceSelector;
