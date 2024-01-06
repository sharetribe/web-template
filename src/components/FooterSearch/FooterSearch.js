import React from 'react';
import { string, bool, func } from 'prop-types';
import classNames from 'classnames';

import { useConfiguration } from '../../context/configurationContext';
import { FormattedMessage, injectIntl, intlShape } from '../../util/reactIntl';
import {
  ExternalLink,
  NamedLink,
  IconMap,
  IconList,
} from '../../components';

import css from './FooterSearch.module.css';

const FooterSearch = props => {
  const { rootClassName, className, isMapShow, changeMapSize, handleShowMap, fullMap } = props;
  const classes = classNames(rootClassName || css.root, className);

  const handleMapAction = (e) => {
    if(!fullMap){
      changeMapSize();
    }
    handleShowMap(!isMapShow);
  }

  const buttonMessage = isMapShow ? <FormattedMessage id="FooterSearch.showList"/> : <FormattedMessage id="FooterSearch.showMap"/>;
  const buttonIcon = isMapShow ? <IconList className={css.iconList}/> : <IconMap className={css.iconMap}/>;

  return (
    <div className={classes}>
      <div className={css.footerContainer}>
        <div className={css.mapActionContainer}>
          <button className={css.mapActionButton} onClick={e => handleMapAction(e)}>
            <span className={css.buttonText}>{buttonMessage}</span>
            <span>{buttonIcon}</span>
          </button>
            {/* egfweghaf wsadgdsf */}
        </div>
      </div>
    </div>
  );
};

FooterSearch.defaultProps = {
  rootClassName: null,
  className: null,
  changeMapSize: null,
  handleShowMap: null,
  isMapShow: null,
  fullMap: null,
};

FooterSearch.propTypes = {
  rootClassName: string,
  className: string,
  changeMapSize: func,
  handleShowMap: func,
  isMapShow: bool,
  fullMap: bool
};

export default injectIntl(FooterSearch);
