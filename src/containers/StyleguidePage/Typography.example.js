import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import css from './StyleguidePage.module.css';

const Font = props => {
  const { component: TextComponent, description } = props;
  return (
    <div className={css.fontCard}>
      <div className={css.element}>
        <TextComponent />
      </div>
      <div className={css.description}>
        <pre className={css.descriptionInfo}>{description}</pre>
      </div>
    </div>
  );
};

const { func, string } = PropTypes;

Font.propTypes = {
  component: func.isRequired,
  description: string.isRequired,
};

const Fonts = () => {
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
          description={`<H1>H1 heading</H1>

Rendered HTML element can be
changed with 'as' prop.
<H1 as="h2">H1 heading</H1>
`}
        />
        <Font
          component={() => <h2>H2 heading</h2>}
          description={`<H2>H2 heading</H2>

Rendered HTML element can be
changed with 'as' prop.
<H2 as="h1">H1 heading</H2>
`}
        />
        <Font
          component={() => <h3>H3 heading</h3>}
          description={`<H3>H3 heading</H3>

Rendered HTML element can be
changed with 'as' prop.
<H3 as="h2">H1 heading</H3>
`}
        />
        <Font
          component={() => <h4>H4: Lorem ipsum dolor sit amet</h4>}
          description={`<H4>H4 heading</H4>

Rendered HTML element can be
changed with 'as' prop.
<HH41 as="h2">H1 heading</H4>
`}
        />
        <Font
          component={() => (
            <h5>H5: You will only be charged if your request is accepted by the provider.</h5>
          )}
          description={`<H5>H5 heading</H5>

Rendered HTML element can be
changed with 'as' prop.
<H5 as="h2">H1 heading</H5>
`}
        />
        <Font
          component={() => <h6>H6: Close</h6>}
          description={`<H6>H6: Close</H6>

Rendered element can be
changed with 'as' prop.
<H6 as="h2">H6: Close</H6>
`}
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
          description={`<p>, <button>, etc.
.myClass {
  composes: p from global;
}`}
        />
        <Font
          component={() => <p className={css.tinyFont}>Hosted by user</p>}
          description={`.myClass {
  composes: marketplaceTinyFontStyles from global;
}`}
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
