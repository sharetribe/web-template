import React from 'react';
import classNames from 'classnames';
import { InlineTextButton, NamedLink } from '../../components';

import css from './TabNavHorizontal.module.css';

export const LIGHT_SKIN = 'light';
export const DARK_SKIN = 'dark';

const Tab = props => {
  const { className, disabled, text, selected, onClick, linkProps, isDark } = props;
  const darkSkinClasses = isDark
    ? classNames(css.tabContentDarkSkin, {
        [css.selectedTabContentDarkSkin]: selected,
        [css.disabledDarkSkin]: disabled,
      })
    : null;

  const linkClasses = classNames(
    css.tabContent,
    {
      [css.selectedTabContent]: selected,
      [css.disabled]: disabled,
    },
    darkSkinClasses
  );

  const buttonClasses = classNames(
    css.tabContent,
    css.button,
    {
      [css.selectedTabContent]: selected,
      [css.disabled]: disabled,
    },
    darkSkinClasses
  );

  const isButton = !!onClick;

  return (
    <div className={className}>
      {isButton ? (
        <InlineTextButton rootClassName={buttonClasses} onClick={onClick}>
          {text}
        </InlineTextButton>
      ) : (
        <NamedLink className={linkClasses} {...linkProps}>
          {text}
        </NamedLink>
      )}
    </div>
  );
};

const TabNavHorizontal = props => {
  const { className, rootClassName, tabRootClassName, tabs, skin = LIGHT_SKIN } = props;
  const isDark = skin === DARK_SKIN;
  const classes = classNames(rootClassName || css.root, { [css.darkSkin]: isDark }, className);
  const tabClasses = tabRootClassName || css.tab;
  return (
    <nav className={classes}>
      {tabs.map((tab, index) => {
        const key = typeof tab.text === 'string' ? tab.text : index;
        return <Tab key={key} className={tabClasses} {...tab} isDark={isDark} />;
      })}
    </nav>
  );
};

/**
 * @typedef {Object} TabConfig
 * @property {string} text - The text to be rendered in the tab
 * @property {boolean} disabled - Whether the tab is disabled
 * @property {boolean} selected - Whether the tab is selected
 * @property {Object} onClick - The onClick function to be passed to the tab component
 * @property {Object} linkProps - The props to be passed to the link component
 * @property {string} linkProps.name - The name of the link
 * @property {string} linkProps.params - The path params to be passed to the link component
 * @property {string} linkProps.to - The rest of the URL params needed
 * @property {boolean} isDark - Whether the tab is dark
 */

/**
 * A tab navigation element with buttons. Requires onClick
 * function param for tab objects passed as parameter.
 *
 * @component
 * @param {Object} props
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} [props.rootClassName] - Custom class that overrides the default class for the root element
 * @param {string} [props.tabRootClassName] - Custom class that overrides the default class for the tab element
 * @param {Array<TabConfig>} props.tabs - The tabs to render
 * @param {LIGHT_SKIN | DARK_SKIN} [props.skin] - The skin of the tab navigation
 * @returns {JSX.Element}
 */
export const ButtonTabNavHorizontal = props => <TabNavHorizontal {...props} />;

/**
 * A tab navigation element with links. Requires tabs prop (an array of TabConfig objects)
 *
 * @component
 * @param {Object} props
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} [props.rootClassName] - Custom class that overrides the default class for the root element
 * @param {string} [props.tabRootClassName] - Custom class that overrides the default class for the tab element
 * @param {Array<TabConfig>} props.tabs - The tabs to render
 * @param {LIGHT_SKIN | DARK_SKIN} [props.skin] - The skin of the tab navigation
 * @returns {JSX.Element}
 */
export const LinkTabNavHorizontal = props => <TabNavHorizontal {...props} />;
