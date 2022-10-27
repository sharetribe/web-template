import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import css from './StyleguidePage.module.css';

const Font = props => {
  const { component: TextComponent, description, styling } = props;
  return (
    <div className={css.fontCard}>
      <div className={css.element}>
        <TextComponent />
      </div>
      <div className={css.description}>
        <p className={css.descriptionInfo}>{description}</p>
        <pre className={css.tinyFont}>{styling}</pre>
      </div>
    </div>
  );
};

const { func, string } = PropTypes;

Font.propTypes = {
  component: func.isRequired,
  description: string.isRequired,
  styling: string.isRequired,
};

const Fonts = () => {
  const h1FontStyling = `Mobile styles:
  font-size: 30px;
  font-weight: var(--fontWeightSemiBold);
  line-height: 30px;
  letter-spacing: -0.5px;
  margin-top: 18px;
  margin-bottom: 18px;

  Desktop styles:
  font-size: 40px;
  font-weight: var(--fontWeightSemiBold);
  line-height: 48px;
  letter-spacing: -1px;
  margin-top: 24px;
  margin-bottom: 24px;`;

  const h2FontStyling = `Mobile styles:
  font-size: 21px;
  font-weight: var(--fontWeightSemiBold);
  line-height: 24px;
  padding: 4px 0 2px 0;
  margin-top: 24px;
  margin-bottom: 18px;

  Desktop styles:
  font-size: 21px;
  font-weight: var(--fontWeightSemiBold);
  line-height: 32px;
  padding: 0;
  margin-top: 24px;
  margin-bottom: 16px;`;

  const h3FontStyling = `Mobile styles:
  font-size: 18px;
  font-weight: var(--fontWeightSemiBold);
  line-height: 24px;
  margin-top: 18px;
  margin-bottom: 12px;

  Desktop styles:
  font-size: 18px;
  font-weight: var(--fontWeightSemiBold);
  line-height: 24px;
  padding: 5px 0 3px 0;
  margin-top: 16px;
  margin-bottom: 16px;`;

  const h4FontStyling = `
  Can be used as a subtitle and also as
  a label font for form inputs.

  Mobile styles:
  font-size: 15px;
  font-weight: var(--fontWeightMedium);
  line-height: 24px;
  margin-top: 12px;
  margin-bottom: 12px;

  Desktop styles:
  font-size: 15px;
  font-weight: var(--fontWeightMedium);
  line-height: 24px;
  padding: 6px 0 2px 0;
  margin-top: 16px;
  margin-bottom: 16px;`;

  const h5FontStyling = `
  Can be used as a fine print text.

  Mobile styles:
  font-size: 14px;
  font-weight: var(--fontWeightMedium);
  line-height: 18px;
  padding: 5px 0 1px 0;
  margin-top: 12px;
  margin-bottom: 6px;

  Desktop styles:
  font-size: 14px;
  font-weight: var(--fontWeightMedium);
  line-height: 16px;
  padding: 2px 0 6px 0;
  margin-top: 8px;
  margin-bottom: 16px;`;

  const h6FontStyling = `
  Can be used as a 'close' button text.

  Mobile styles:
  font-size: 12px;
  font-weight: var(--fontWeightBold);
  line-height: 18px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  padding: 2px 0 4px 0;
  margin-top: 6px;
  margin-bottom: 6px;

  Desktop styles:
  font-size: 12px;
  font-weight: var(--fontWeightBold);
  line-height: 16px;
  padding: 3px 0 5px 0;
  margin-top: 8px;
  margin-bottom: 8px;`;

  const bodyFontStyling = `
  Paragraphs and other body texts.

  Mobile styles:
  font-size: 14px;
  font-weight: var(--fontWeightMedium);
  line-height: 24px;
  letter-spacing: -0.1px;
  margin-top: 12px;
  margin-bottom: 12px;

  Desktop styles:
  font-size: 16px;
  font-weight: var(--fontWeightMedium);
  line-height: 32px;
  letter-spacing: -0.1px;
  margin-top: 16px;
  margin-bottom: 16px;`;

  const tinyFontStyling = `
  Very small print.

  Mobile styles:
  font-size: 13px;
  font-weight: var(--fontWeightRegular);
  line-height: 18px;
  margin-top: 9.5px;
  margin-bottom: 8.5px;

  Desktop styles:
  font-size: 13px;
  font-weight: var(--fontWeightRegular);
  line-height: 16px;
  margin-top: 10.5px;
  margin-bottom: 13.5px;`;

  const fontsContainerClasses = classNames(css.fontsContainer, css.baselines);

  return (
    <div className={css.typographyContent}>
      <p className={css.spacing2x}>
        The line-height of typographic elements is an multiple of 6px on mobile and multiple of 8px
        on desktop. In addition to line-height, baselines are adjusted with vertical padding (the
        sum of those paddings will be 6px on mobile or 8px on desktop). As a result one can position
        following typographic elements with margins that are also multiples of 6px (or 8px).
      </p>
      <p className={css.spacing2x}>
        N.B. box-sizing is border-box, so borders affect to the total height of elements.
      </p>
      <div className={fontsContainerClasses}>
        <Font
          component={() => <h1>H1 heading</h1>}
          description="<h1>/composes: h1 from global;"
          styling={h1FontStyling}
        />
        <Font
          component={() => <h2>H2 heading</h2>}
          description="<h2>/composes: h2 from global;"
          styling={h2FontStyling}
        />
        <Font
          component={() => <h3>H3 heading</h3>}
          description="<h3>/composes: h3 from global;"
          styling={h3FontStyling}
        />
        <Font
          component={() => <h4>H4: Lorem ipsum dolor sit amet</h4>}
          description="<h4>/composes: h4 from global;"
          styling={h4FontStyling}
        />
        <Font
          component={() => (
            <h5>H5: You will only be charged if your request is accepted by the provider.</h5>
          )}
          description="<h5>/composes: h5 from global;"
          styling={h5FontStyling}
        />
        <Font
          component={() => <h6>H6: Close</h6>}
          description="<h6>/composes: h6 from global;"
          styling={h6FontStyling}
        />
        <Font
          component={() => (
            <p>
              Curabitur blandit tempus porttitor. Etiam porta sem malesuada magna mollis euismod.
              Aenean eu leo quam. Pellentesque ornare sem lacinia quam venenatis vestibulum. Duis
              mollis, est non commodo luctus, nisi erat porttitor ligula, eget lacinia odio sem nec
              elit.
            </p>
          )}
          description="<p>, <button>, etc. / composes: marketplaceBodyFontStyles from global;"
          styling={bodyFontStyling}
        />
        <Font
          component={() => <p className={css.tinyFont}>Hosted by user</p>}
          description="composes: marketplaceTinyFontStyles from global;"
          styling={tinyFontStyling}
        />
      </div>
    </div>
  );
};

export const Typography = {
  component: Fonts,
  props: {},
  group: 'elements:typography',
};
