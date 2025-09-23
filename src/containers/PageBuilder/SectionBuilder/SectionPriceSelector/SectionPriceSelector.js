import React, { useState } from 'react';

import Field, { hasDataInFields } from '../../Field';

import SectionContainer from '../SectionContainer';
import pricesCss from './SectionPriceSelector.module.css';

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
        <SectionContainer
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

            <PricingToggle plans={plans} toggles={toggles}></PricingToggle>
        </SectionContainer>
    );
};

export default SectionPriceSelector;

const PricingToggle = props => {
    const {
        toggles,
        plans,
    } = props;

    const [activeSet, setActiveSet] = useState("set1");
    const useToggle = toggles.cta1 !== ' ' || toggles.cta2 !== ' ';

    return (
        <div className={pricesCss.container}>
            {/* Toggle Buttons */}
            {useToggle ? (
            <div className={pricesCss.buttonGroup}>
                <button
                    className={`${pricesCss.toggleButton} ${activeSet === "set1" ? pricesCss.active : ""
                        }`}
                    onClick={() => setActiveSet("set1")}
                >
                    {toggles.cta1}
                </button>
                <button
                    className={`${pricesCss.toggleButton} ${activeSet === "set2" ? pricesCss.active : ""
                        }`}
                    onClick={() => setActiveSet("set2")}
                >
                    {toggles.cta2}
                </button>
            </div>
            ) : null}

            {/* Card Grid */}
            <div className={pricesCss.cardGrid}>
                {plans[activeSet].map((plan, idx) => (
                    <div
                        key={idx}
                        className={pricesCss.card}
                    >
                        {/* Header */}
                        <div className={pricesCss.cardHeader}>
                            <h3 className={pricesCss.cardTitle}>{plan.title}</h3>
                            <p className={pricesCss.cardDescription}>{plan.description}</p>
                        </div>

                        <div className={pricesCss.separator}></div>

                        {/* Body */}
                        <div className={pricesCss.cardBody}>
                            <p className={pricesCss.cardPrice}>
                                {plan.price}
                            </p>
                            <p className={pricesCss.cardPriceText}>
                                {plan.priceText}
                            </p>
                            <a href={plan.cta.link} className={pricesCss.ctaButton}>
                                {plan.cta.text}
                            </a>
                        </div>

                        <div className={pricesCss.separator}></div>

                        {/* Footer */}
                        <ul className={pricesCss.featureList}>
                            {plan.features.split('#!#').map((feature, i) => (
                                <li key={i} className={pricesCss.featureItem}>
                                    <i className={pricesCss.checkIcon}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                            <path d="M20.3479 7.56384L9.7479 18.1638C9.65402 18.2585 9.52622 18.3117 9.3929 18.3117C9.25958 18.3117 9.13178 18.2585 9.0379 18.1638L3.6479 12.7738C3.55324 12.68 3.5 12.5522 3.5 12.4188C3.5 12.2855 3.55324 12.1577 3.6479 12.0638L4.3479 11.3638C4.44178 11.2692 4.56958 11.2159 4.7029 11.2159C4.83622 11.2159 4.96402 11.2692 5.0579 11.3638L9.3879 15.6938L18.9379 6.14384C19.1357 5.95205 19.4501 5.95205 19.6479 6.14384L20.3479 6.85384C20.4426 6.94772 20.4958 7.07552 20.4958 7.20884C20.4958 7.34216 20.4426 7.46995 20.3479 7.56384Z" fill="currentColor" />
                                        </svg>
                                    </i>
                                    {feature}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    );
};