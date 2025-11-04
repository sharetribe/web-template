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
    const elem = document.getElementById('styleguide');
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

const MarketplaceColors = () => {
  return (
    <div className={css.content}>
      <p className={css.spacing2x}>
        Marketplace colors have four groups: branding color, primary button color, traffic light
        colors, and grey palette for fine tuning UI elements.
      </p>
      <div className={css.colorsContainer}>
        <h4>Marketplace color</h4>
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
        <h4>Custom color for PrimaryButtons</h4>
        <div className={css.colorsGroup}>
          <ColorCard
            mpColor={css.colorPrimaryButton}
            name="--colorPrimaryButton"
            usage="<PrimaryButton>"
          />
          <ColorCard
            mpColor={css.colorPrimaryButtonLight}
            name="--colorPrimaryButtonLight"
            usage="<PrimaryButton>"
          />
          <ColorCard
            mpColor={css.colorPrimaryButtonDark}
            name="--colorPrimaryButtonDark"
            usage="<PrimaryButton>"
          />
        </div>
        <h4>Traffic light colors</h4>
        <h4>Green</h4>
        <div className={css.colorsGroup}>
          <ColorCard
            mpColor={css.successColorBackground}
            name="--colorSuccess"
            usage="e.g. color: var(--colorSuccess);"
          />
          <ColorCard
            mpColor={css.successDarkColorBackground}
            name="--colorSuccessDark"
            usage="color: var(--colorSuccessDark);"
          />
          <ColorCard
            mpColor={css.successLightColorBackground}
            name="--colorSuccessLight"
            usage="color: var(--colorSuccessLight);"
          />
          <ColorCard
            mpColor={css.successSubtleColorBackground}
            name="--colorSuccessSubtle"
            usage="color: var(--colorSuccessSubtle);"
          />
        </div>
        <h4>Red</h4>
        <div className={css.colorsGroup}>
          <ColorCard
            mpColor={css.failColorBackground}
            name="--colorFail"
            usage="color: var(--colorFail);"
          />
          <ColorCard
            mpColor={css.failDarkColorBackground}
            name="--colorFailDark"
            usage="color: var(--colorFailDark);"
          />
          <ColorCard
            mpColor={css.failSubtleColorBackground}
            name="--colorFailSubtle"
            usage="color: var(--colorFailSubtle);"
          />
        </div>
        <h4>Yellow</h4>
        <div className={css.colorsGroup}>
          <ColorCard
            mpColor={css.attentionColorBackground}
            name="--colorAttention"
            usage="color: var(--colorAttention);"
          />
          <ColorCard
            mpColor={css.attentionDarkColorBackground}
            name="--colorAttentionDark"
            usage="color: var(--colorAttentionDark);"
          />
          <ColorCard
            mpColor={css.attentionSubtleColorBackground}
            name="--colorAttentionSubtle"
            usage="color: var(--colorAttentionSubtle);"
          />
        </div>
        <h4>Grey colors</h4>
        <div className={css.colorsGroup}>
          <ColorCard
            mpColor={css.colorBlack}
            name="--colorBlack"
            usage="color: var(--colorBlack);"
          />
          <ColorCard
            mpColor={css.colorGrey900}
            name="--colorGrey900"
            usage="color: var(--colorGrey900);"
          />
          <ColorCard
            mpColor={css.colorGrey800}
            name="--colorGrey800"
            usage="color: var(--colorGrey800);"
          />
          <ColorCard
            mpColor={css.colorGrey700}
            name="--colorGrey700"
            usage="color: var(--colorGrey700);"
          />
          <ColorCard
            mpColor={css.colorGrey600}
            name="--colorGrey600"
            usage="color: var(--colorGrey600);"
          />
          <ColorCard
            mpColor={css.colorGrey500}
            name="--colorGrey500"
            usage="color: var(--colorGrey500);"
          />
          <ColorCard
            mpColor={css.colorGrey400}
            name="--colorGrey400"
            usage="color: var(--colorGrey400);"
          />
          <ColorCard
            mpColor={css.colorGrey300}
            name="--colorGrey300"
            usage="color: var(--colorGrey300);"
          />
          <ColorCard
            mpColor={css.colorGrey200}
            name="--colorGrey200"
            usage="color: var(--colorGrey200);"
          />
          <ColorCard
            mpColor={css.colorGrey100}
            name="--colorGrey100"
            usage="color: var(--colorGrey100);"
          />
          <ColorCard
            mpColor={css.colorGrey50}
            name="--colorGrey50"
            usage="color: var(--colorGrey50);"
          />
          <ColorCard
            mpColor={css.colorWhite}
            name="--colorWhite"
            usage="color: var(--colorWhite);"
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
