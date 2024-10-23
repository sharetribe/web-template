import React from 'react';
import classNames from 'classnames';

import { FormattedMessage } from '../../../util/reactIntl';
import { USER_TYPES } from '../../../util/types';
import { Heading } from '../../../components';

import { SSOButton } from '../SSOButton/SSOButton';

import css from './Signup.module.css';

const BrandSignup = ({ from, brandStudioId }) => {
  const IMG_URL = `https://storage.googleapis.com/${process.env.REACT_APP_MARKETPLACE_BRANDING_BUCKET}/assets/img/marketplace/6446ca8583d63a9bae7ecfc45b0eb4be.png`
  const fromMaybe = from ? { from } : null;
  return (
    <div className={css.brandSignup}>
      <div className={css.root}>
        <div className={css.content}>
          <Heading as="h1" rootClassName={css.title}>
            <FormattedMessage id="AuthenticationPage.signupBrandTile" />
          </Heading>
          <Heading as="h3" rootClassName={css.subtitle}>
            <FormattedMessage id="AuthenticationPage.signupBrandDescription" />
          </Heading>
          <SSOButton isLogin={false} brandStudioId={brandStudioId} userType={USER_TYPES.BRAND} {...fromMaybe} />
        </div>

        <div className={classNames(css.content, css.imageContainer)}>
          <img alt="Brand experience" className={css.brandImg} src={IMG_URL} />
        </div>
      </div>
    </div>
  )
};

export default BrandSignup;
