import React from 'react';
import classNames from 'classnames';

import Field from '../../Field';

import css from './SectionContainer.module.css';

/**
 * @typedef {Object} FieldComponentConfig
 * @property {ReactNode} component
 * @property {Function} pickValidProps
 */

/**
 * This component can be used to wrap some common styles and features of Section-level components.
 * E.g: const SectionHero = props => (<SectionContainer><H1>Hello World!</H1></SectionContainer>);
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @param {string?} props.id id of the section
 * @param {string?} props.as tag/element name. Defaults to 'section'.
 * @param {ReactNode} props.children
 * @param {Object} props.appearance
 * @param {Object} props.options extra options for the section component (e.g. custom fieldComponents)
 * @param {Object<string,FieldComponentConfig>?} props.options.fieldComponents custom fields
 * @returns {JSX.Element} containing wrapper that can be used inside Block components.
 */
const SectionContainer = props => {
  const { className, rootClassName, id, as, children, appearance, options, ...otherProps } = props;
  const Tag = as || 'section';
  const classes = classNames(rootClassName || css.root, className);

  return (
    <Tag className={classes} id={id} {...otherProps}>
      {appearance?.fieldType === 'customAppearance' ? (
        <Field
          data={{ alt: `Background image for ${id}`, ...appearance }}
          className={className}
          options={options}
        />
      ) : null}

      <div className={css.sectionContent}>{children}</div>
    </Tag>
  );
};

export default SectionContainer;
