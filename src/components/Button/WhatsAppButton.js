// WhatsAppButton.js
import React from 'react';
import { string, bool, node } from 'prop-types';
import classNames from 'classnames';

import css from './Button.module.css';

const WhatsAppButton = ({ rootClassName, className, children, ...rest }) => {
  const classes = classNames(rootClassName || css.whatsAppButton, className);

  const handleWhatsAppButtonClick = () => {
    // Reemplaza 'tuNúmeroDeTeléfono' con tu número de teléfono real, incluyendo el código de país
    const phoneNumber = '5492944232664'; //https://wa.me/5492944232664

    // Genera el enlace de WhatsApp
    const whatsappLink = `https://wa.me/${phoneNumber}`;

    // Redirige a la página de WhatsApp
    window.location.href = whatsappLink;
  };

  return (
    <button className={classes} onClick={handleWhatsAppButtonClick} {...rest}>
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