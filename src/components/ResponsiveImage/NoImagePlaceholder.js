import React from 'react';
import classNames from 'classnames';
import { Image } from 'antd';

import imagePlaceholder from '../../assets/no-image-placeholder.png';
import { FormattedMessage } from '../../util/reactIntl';

import NoImageIcon from './NoImageIcon';
import css from './ResponsiveImage.module.css';

const NoImagePlaceholder = ({ className, rootClassName, noImageMessage, withBranding = true }) => {
  if (withBranding) {
    return <Image src={imagePlaceholder} />;
  }

  const noImageClasses = classNames(rootClassName || css.root, css.noImageContainer, className);
  const noImageMessageText = noImageMessage || <FormattedMessage id="ResponsiveImage.noImage" />;
  return (
    <div className={noImageClasses}>
      <div className={css.noImageWrapper}>
        <NoImageIcon className={css.noImageIcon} />
        <div className={css.noImageText}>{noImageMessageText}</div>
      </div>
    </div>
  );
};

export default NoImagePlaceholder;

/**
 * [TODO:] - PENDING
 *
 *    - Revisar que pasa con el email template de la factura que no le llega al comprador.....
 *    - Borrar todos los paquetes de NPM que ya no sean necesarios......
 *
 *    - Hacer merge y release del webapp y del marketplace
 *    - Hablar con Marcus del toogle del tipo de card
 *
 */
