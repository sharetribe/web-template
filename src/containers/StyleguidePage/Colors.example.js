import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { NamedLink } from '../../components';
import css from './StyleguidePage.module.css';

const componentToHex = c =>
  (+c)
    .toString(16)
    .padStart(2, '0')
    .toUpperCase();
const rgbToHex = rgb => {
  const [r, g, b] = rgb.split(',');
  return '#' + componentToHex(r) + componentToHex(g) + componentToHex(b);
};
const getRgb = selector => {
  const selectedElem = document.getElementById(selector);
  const elemStyles = getComputedStyle(selectedElem);
  return typeof window !== 'undefined'
    ? elemStyles.backgroundColor.match(/(\d+, \d+, \d+)/)[1]
    : '0,0,0';
};

const ColorCard = props => {
  const [hexColor, setHexColor] = useState('#FFFFFF');

  useEffect(() => {
    setHexColor(rgbToHex(getRgb(props.name)));
  }, []);

  const { mpColor, name, usage } = props;
  const colorClasses = mpColor || css.color;

  const handleChange = e => {
    const value = e.target.value;
    const elem = window.document.documentElement;
    const re = new RegExp('^#([0-9a-f]{3}){1,2}$', 'i');
    const isValidColor = re.test(value);

    if (isValidColor) {
      elem.style.setProperty(name, value);
    }
    setHexColor(value);
  };

  return (
    <div className={css.colorCard}>
      <div className={colorClasses} id={name}>
        <div>{hexColor}</div>
      </div>
      <div className={css.colorDescription}>
        <p>
          <span>{name}</span>
          <br />
          <span className={css.tinyFont}>{usage}</span>
        </p>
        <p>
          Test different colors <br />
          (valid between page loads):
          <input type="color" value={hexColor} onChange={handleChange} className={css.colorInput} />
        </p>
      </div>
    </div>
  );
};

const { string } = PropTypes;

// Jest test strip off CSS classes (css is an empty object). Otherwise this could be required prop.
const defaultProps = { mpColor: undefined };
// Create a real undefined value, not just injecting a hopefully undefined object.
delete defaultProps.mpColor;
ColorCard.defaultProps = defaultProps;

ColorCard.propTypes = {
  mpColor: string,
  name: string.isRequired,
  usage: string.isRequired,
};

const MarketplaceColors = () => {
  return (
    <div className={css.content}>
      <p className={css.spacing2x}>
        Marketplace colors have three groups: branding color and its variations, action colors, and
        grey palette for fine tuning UI elements.
      </p>
      <p className={css.spacing2x}>
        If you test different colors, <NamedLink name="LandingPage">Go to LandingPage</NamedLink> to
        check them.
      </p>
      <div className={css.colorsContainer}>
        <div className={css.colorsGroup}>
          <ColorCard
            mpColor={css.marketplaceColorBackground}
            name="--marketplaceColor"
            usage="color: var(--marketplaceColor);"
          />
          <ColorCard
            mpColor={css.marketplaceColorLightBackground}
            name="--marketplaceColorLight"
            usage="color: var(--marketplaceColorLight);"
          />
          <ColorCard
            mpColor={css.marketplaceColorDarkBackground}
            name="--marketplaceColorDark"
            usage="color: var(--marketplaceColorDark);"
          />
        </div>
        <div className={css.colorsGroup}>
          <ColorCard
            mpColor={css.successColorBackground}
            name="--successColor"
            usage="e.g. color: var(--successColor);"
          />
          <ColorCard
            mpColor={css.failColorBackground}
            name="--failColor"
            usage="color: var(--failColor);"
          />
          <ColorCard
            mpColor={css.attentionColorBackground}
            name="--attentionColor"
            usage="color: var(--attentionColor);"
          />
        </div>
        <div className={css.colorsGroup}>
          <ColorCard
            mpColor={css.matterColorDarkBackground}
            name="--matterColorDark"
            usage="color: var(--matterColorDark);"
          />
          <ColorCard
            mpColor={css.matterColorBackground}
            name="--matterColor"
            usage="color: var(--matterColor);"
          />
          <ColorCard
            mpColor={css.matterColorAntiBackground}
            name="--matterColorAnti"
            usage="color: var(--matterColorAnti);"
          />
          <ColorCard
            mpColor={css.matterColorNegativeBackground}
            name="--matterColorNegative"
            usage="color: var(--matterColorNegative);"
          />
          <ColorCard
            mpColor={css.matterColorLightBackground}
            name="--matterColorLight"
            usage="color: var(--matterColorLight);"
          />
        </div>
      </div>
    </div>
  );
};

export const Colors = {
  component: MarketplaceColors,
  group: 'elements:colors',
  props: {},
};
