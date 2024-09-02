import React from 'react';
import { func, node, object, shape, string } from 'prop-types';
import classNames from 'classnames';

import Field from '../../Field';
import BlockContainer from '../BlockContainer';

import css from './BlockSocialMediaLink.module.css';

const BlockSocialMediaLink = props => {
  const { blockId, className, rootClassName, link, options } = props;

  const classes = classNames(rootClassName || css.root, className);

  return (
    <BlockContainer id={blockId} className={classes}>
      <Field data={link} options={options} className={css.link} />
    </BlockContainer>
  );
};

const propTypeOption = shape({
  fieldComponents: shape({ component: node, pickValidProps: func }),
});

const propTypeLink = shape({
  fieldType: string,
  platform: string,
  url: string,
});

BlockSocialMediaLink.defaultProps = {
  className: null,
  rootClassName: null,
  link: null,
};

BlockSocialMediaLink.propTypes = {
  blockId: string,
  className: string,
  rootClassName: string,
  link: propTypeLink,
  options: propTypeOption,
};

export default BlockSocialMediaLink;
