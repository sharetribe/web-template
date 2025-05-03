import React from 'react';
import { Space } from 'antd';
import Icon, { AppstoreFilled } from '@ant-design/icons';
import classNames from 'classnames';
import IconMasonryGrid from '../IconMasonryGrid/IconMasonryGrid'; // adjust path if needed
import css from './GridLayoutToggle.module.css';
import { GRID_STYLE_MASONRY, GRID_STYLE_SQUARE } from '../../util/types'; // optional custom styles

const GridLayoutToggle = ({ value, onChange }) => {
  const isMasonry = value === GRID_STYLE_MASONRY;

  const handleKeyDown = style => e => {
    if (e.key === 'Enter') {
      onChange(style);
    }
  };

  return (
    <Space>
      <span
        className={classNames(css.gridViewButton, { [css.active]: isMasonry })}
        onClick={() => {
          onChange(GRID_STYLE_MASONRY);
        }}
        role="button"
        aria-pressed={isMasonry}
        tabIndex={0}
        onKeyDown={handleKeyDown(GRID_STYLE_MASONRY)}
      >
        <Icon component={IconMasonryGrid} />
      </span>
      <span
        className={classNames(css.gridViewButton, { [css.active]: !isMasonry })}
        onClick={() => onChange(GRID_STYLE_SQUARE)}
        role="button"
        aria-pressed={!isMasonry}
        tabIndex={0}
        onKeyDown={handleKeyDown(GRID_STYLE_SQUARE)}
      >
        <AppstoreFilled />
      </span>
    </Space>
  );
};

export default GridLayoutToggle;
