import React from 'react';
import classNames from 'classnames';

import Field, { hasDataInFields } from '../../Field';
import BlockContainer from '../BlockContainer';

import css from './BlockFooter.module.css';

/**
 * @typedef {Object} FieldComponentConfig
 * @property {ReactNode} component
 * @property {Function} pickValidProps
 */

/**
 * This returns a component that can render 'footerBlock' config.
 *
 * @component
 * @param {Object} props
 * @param {string?} props.blockId id from the block config
 * @param {string} props.blockName name from the block config (not used)
 * @param {'footerBlock'} props.blockType blockType is set to 'footerBlock'
 * @param {string?} props.className add more style rules in addition to components own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @param {string?} props.className add more styles in addition to components own css.root
 * @param {string?} props.textClassName add styles for the block's attached text field
 * @param {Object?} props.text content config for the block (can be markdown)
 * @param {Object} props.options extra options for the block component (e.g. custom fieldComponents)
 * @param {Object<string,FieldComponentConfig>?} props.options.fieldComponents Custom fieldComponents
 * @returns {JSX.Element} component that renders block type: 'footerBlock'
 */
const BlockFooter = props => {
  const { blockId, className, rootClassName, textClassName, text, options } = props;
  const classes = classNames(rootClassName || css.root, className);
  const hasTextComponentFields = hasDataInFields([text], options);

  return (
    <BlockContainer id={blockId} className={classes}>
      {hasTextComponentFields ? (
        <div className={classNames(textClassName, css.text)}>
          <Field data={text} options={options} />
        </div>
      ) : null}
    </BlockContainer>
  );
};

export default BlockFooter;
