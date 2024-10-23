import React from 'react';

import { FormattedMessage } from '../../../util/reactIntl';
import { USER_TYPES } from '../../../util/types';
import { Heading } from '../../../components';

import { SSOButton } from '../SSOButton/SSOButton';

import css from './Signup.module.css';

const BaseSignup = ({ from }) => {
  const fromMaybe = from ? { from } : null;
  return (
    <div className={css.root}>
      <div className={css.content}>
        <Heading as="h1" rootClassName={css.title}>
          <FormattedMessage id="AuthenticationPage.signupBuyerTile" />
        </Heading>
        <Heading as="h3" rootClassName={css.subtitle}>
          <FormattedMessage id="AuthenticationPage.signupBuyerDescription" />
        </Heading>
        <SSOButton isLogin={false} userType={USER_TYPES.BUYER} {...fromMaybe} />
      </div>

      <div className={css.line}></div>
      <div className={css.content}>
        <Heading as="h1" rootClassName={css.title}>
          <FormattedMessage id="AuthenticationPage.signupSellerTile" />
        </Heading>
        <Heading as="h3" rootClassName={css.subtitle}>
          <FormattedMessage id="AuthenticationPage.signupSellerDescription" />
        </Heading>
        <SSOButton isLogin={false} userType={USER_TYPES.SELLER} {...fromMaybe} />
      </div>
    </div>
  );
};

export default BaseSignup;
