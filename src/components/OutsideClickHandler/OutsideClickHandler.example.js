import React, { useState } from 'react';
import OutsideClickHandler from './OutsideClickHandler';

const childStyle = {
  padding: '16px',
  background: '#e7e7e7',
};

const OutsideClickHandlerWrapper = props => {
  const [message, setMessage] = useState('This is OutsideClickHandler example');

  const handleClick = () => {
    setMessage('You clicked outside!');
  };

  return (
    <OutsideClickHandler onOutsideClick={handleClick}>
      <div style={childStyle}>
        <h3>{message}</h3>
      </div>
    </OutsideClickHandler>
  );
};

export const FilterPopupExample = {
  component: OutsideClickHandlerWrapper,
  props: {},
  group: 'misc',
};
