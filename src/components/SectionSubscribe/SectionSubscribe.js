import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope } from '@fortawesome/free-regular-svg-icons';
import { string } from 'prop-types';
import css from './SectionSubscribe.module.css';

import backgroundImage from '../../assets/images/subscribe-back.svg';

const SectionSubscribe = props => {
  const {
    rightImage
  } = props;

  return (
    <div className={css.root}>
      <img src={backgroundImage} className={css.backgroundImage} />
      <div className={css.subscribeBox}>
        <div className={css.iconBox}>
          <FontAwesomeIcon icon={faEnvelope} className={css.iconEnvelope} />
        </div>
        <div className={css.inputContainer}>
          <div>
            <div className={css.firstLine}>Culture's Future </div>
            <div className={css.secondLine}>in Your Inbox </div>
          </div>
          <div className={css.inputEmail}>
            <div className={css.inputPlaceholder}>Your email</div>
            <div className={css.btnSubscribe}>Subscribe</div>
          </div>
        </div>
      </div>
      <div className={css.rightImage}>
        <img src={rightImage} />
      </div>
    </div>
  )
}
SectionSubscribe.defaultProps = {
  rightImage: null
};

SectionSubscribe.propTypes = {
  rightImage: string
};

export default SectionSubscribe;
