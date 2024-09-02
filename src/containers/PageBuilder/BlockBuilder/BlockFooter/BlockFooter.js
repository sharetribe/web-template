import React from 'react';
import { func, node, object, shape, string } from 'prop-types';
import classNames from 'classnames';

import Field, { hasDataInFields } from '../../Field';
import BlockContainer from '../BlockContainer';

import css from './BlockFooter.module.css';

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

const propTypeOption = shape({
  fieldComponents: shape({ component: node, pickValidProps: func }),
});

BlockFooter.defaultProps = {
  className: null,
  rootClassName: null,
  textClassName: null,
  text: null,
  options: null,
};

BlockFooter.propTypes = {
  blockId: string,
  className: string,
  rootClassName: string,
  textClassName: string,
  text: object,
  options: propTypeOption,
};

export default BlockFooter;
