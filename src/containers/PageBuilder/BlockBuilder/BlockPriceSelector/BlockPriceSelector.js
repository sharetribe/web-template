import React, { useState } from 'react';
import classNames from 'classnames';

import BlockContainer from '../BlockContainer';

import css from './BlockPriceSelector.module.css';
import pricesCss from "./PricingToggle.module.css";

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
  const {
    blockId,
    className,
    rootClassName,
    title,
    text,
    callToAction,
    options,
    alignment,
    toggles,
    plans,
    ...customProps
  } = props;
  const classes = classNames(rootClassName || css.root, className);

  return (
    <BlockContainer id={blockId} className={classes}>
      <PricingToggle plans={plans} toggles={toggles} customProps={customProps} ></PricingToggle>
    </BlockContainer>
  );
};

export default BlockPriceSelector;

const PricingToggle = props => {
  const {
    toggles,
    plans,
  } = props;

  const [activeSet, setActiveSet] = useState("set1");

  return (
    <div className={pricesCss.container}>
      {/* Toggle Buttons */}
      <div className={pricesCss.buttonGroup}>
        <button
          className={`${pricesCss.toggleButton} ${
            activeSet === "set1" ? pricesCss.active : ""
          }`}
          onClick={() => setActiveSet("set1")}
        >
          {toggles.cta1}
        </button>
        <button
          className={`${pricesCss.toggleButton} ${
            activeSet === "set2" ? pricesCss.active : ""
          }`}
          onClick={() => setActiveSet("set2")}
        >
          {toggles.cta2}
        </button>
      </div>

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
              {plan.features.map((feature, i) => (
                <li key={i} className={pricesCss.featureItem}>
                  <i className={pricesCss.checkIcon}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M20.3479 7.56384L9.7479 18.1638C9.65402 18.2585 9.52622 18.3117 9.3929 18.3117C9.25958 18.3117 9.13178 18.2585 9.0379 18.1638L3.6479 12.7738C3.55324 12.68 3.5 12.5522 3.5 12.4188C3.5 12.2855 3.55324 12.1577 3.6479 12.0638L4.3479 11.3638C4.44178 11.2692 4.56958 11.2159 4.7029 11.2159C4.83622 11.2159 4.96402 11.2692 5.0579 11.3638L9.3879 15.6938L18.9379 6.14384C19.1357 5.95205 19.4501 5.95205 19.6479 6.14384L20.3479 6.85384C20.4426 6.94772 20.4958 7.07552 20.4958 7.20884C20.4958 7.34216 20.4426 7.46995 20.3479 7.56384Z" fill="currentColor"/>
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
