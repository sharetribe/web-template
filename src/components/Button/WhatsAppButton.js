// WhatsAppButton.js
import React from 'react';
import { string, bool, node } from 'prop-types';
import classNames from 'classnames';

import css from './Button.module.css';

const WhatsAppButton = ({ rootClassName, className, children, ...rest }) => {
  const classes = classNames(rootClassName || css.whatsAppButton, className);

  const handleWhatsAppButtonClick = () => {
    const phoneNumber = '5492944232664';
    const whatsappLink = `https://wa.me/${phoneNumber}`;
    window.location.href = whatsappLink;
  };

  return (
    <button className={classes} onClick={handleWhatsAppButtonClick} {...rest}>
      {/* Puedes agregar un elemento <img> aquí para mostrar el logo */}
      <img src="public/static/icons/whatsapp.png" alt="WhatsApp" />
      {children}
    </button>
  );
};

WhatsAppButton.propTypes = {
  rootClassName: string,
  className: string,
  children: node,
};

export default WhatsAppButton;