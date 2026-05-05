import React, { useState } from 'react';

import ExternalLink from '../ExternalLink/ExternalLink';
import css from './PricingToggle.module.css';

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M20.3479 7.56384L9.7479 18.1638C9.65402 18.2585 9.52622 18.3117 9.3929 18.3117C9.25958 18.3117 9.13178 18.2585 9.0379 18.1638L3.6479 12.7738C3.55324 12.68 3.5 12.5522 3.5 12.4188C3.5 12.2855 3.55324 12.1577 3.6479 12.0638L4.3479 11.3638C4.44178 11.2692 4.56958 11.2159 4.7029 11.2159C4.83622 11.2159 4.96402 11.2692 5.0579 11.3638L9.3879 15.6938L18.9379 6.14384C19.1357 5.95205 19.4501 5.95205 19.6479 6.14384L20.3479 6.85384C20.4426 6.94772 20.4958 7.07552 20.4958 7.20884C20.4958 7.34216 20.4426 7.46995 20.3479 7.56384Z" fill="currentColor" />
  </svg>
);

const PricingToggle = props => {
  const { toggles = {}, plans = {} } = props;

  const [activeSet, setActiveSet] = useState('set1');
  const showToggle = Boolean(toggles.cta1?.trim()) || Boolean(toggles.cta2?.trim());
  const activePlans = plans[activeSet] || [];

  return (
    <div className={css.container}>
      {/* Toggle Buttons */}
      {showToggle ? (
        <div className={css.buttonGroup}>
          <button
            className={`${css.toggleButton} ${activeSet === 'set1' ? css.active : ''}`}
            onClick={() => setActiveSet('set1')}
          >
            {toggles.cta1}
          </button>
          <button
            className={`${css.toggleButton} ${activeSet === 'set2' ? css.active : ''}`}
            onClick={() => setActiveSet('set2')}
          >
            {toggles.cta2}
          </button>
        </div>
      ) : null}

      {/* Card Grid */}
      <div className={css.cardGrid}>
        {activePlans.map((plan, idx) => (
          <div key={plan.title || idx} className={css.card}>
            {/* Header */}
            <div className={css.cardHeader}>
              <h3 className={css.cardTitle}>{plan.title}</h3>
              <p className={css.cardDescription}>{plan.description}</p>
            </div>

            <div className={css.separator}></div>

            {/* Body */}
            <div className={css.cardBody}>
              <p className={css.cardPrice}>{plan.price}</p>
              <p className={css.cardPriceText}>{plan.priceText}</p>
              <ExternalLink href={plan.cta.link} className={css.ctaButton}>
                {plan.cta.text}
              </ExternalLink>
            </div>

            <div className={css.separator}></div>

            {/* Footer */}
            <ul className={css.featureList}>
              {plan.features.map((feature, i) => (
                <li key={typeof feature === 'string' ? feature : i} className={css.featureItem}>
                  <i className={css.checkIcon}>
                    <CheckIcon />
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

export default PricingToggle;
