import React from 'react';
import { renderShallow } from '../../util/test-helpers';
import {
  AuthenticationOrConfirmInfoForm,
  AuthenticationForms,
  SocialLoginButtonsMaybe,
} from './AuthenticationPage';

const noop = () => null;

describe('AuthenticationOrConfirmInfoForm', () => {
  // We need to overwrite social login client ids before running the test
  // to make sure it's same in local environment and in CI
  beforeEach(() => {
    process.env = Object.assign(process.env, { REACT_APP_FACEBOOK_APP_ID: '' });
    process.env = Object.assign(process.env, { REACT_APP_GOOGLE_CLIENT_ID: '' });
  });

  it('tab=login matches snapshot', () => {
    const props = {
      tab: 'login',
      authInfo: {
        idpToken: 'idpToken',
        email: 'email',
        firstName: 'firstName',
        lastName: 'lastName',
        idpId: 'idpId',
      },
      authInProgress: false,
      submitLogin: noop,
      submitSignup: noop,
      submitSingupWithIdp: noop,
      onOpenTermsOfService: noop,
    };
    const tree = renderShallow(<AuthenticationOrConfirmInfoForm {...props} />);
    expect(tree).toMatchSnapshot();
  });

  it('tab=confirm matches snapshot', () => {
    const props = {
      tab: 'confirm',
      authInfo: {
        idpToken: 'idpToken',
        email: 'email',
        firstName: 'firstName',
        lastName: 'lastName',
        idpId: 'idpId',
      },
      authInProgress: false,
      submitLogin: noop,
      submitSignup: noop,
      submitSingupWithIdp: noop,
      onOpenTermsOfService: noop,
    };
    const tree = renderShallow(<AuthenticationOrConfirmInfoForm {...props} />);
    expect(tree).toMatchSnapshot();
  });
});

describe('AuthenticationForms with Facebook login', () => {
  // We need to overwrite social login client ids before running the test
  // to make sure it's same in local environment and in CI
  beforeEach(() => {
    process.env = Object.assign(process.env, { REACT_APP_FACEBOOK_APP_ID: 'test' });
    process.env = Object.assign(process.env, { REACT_APP_GOOGLE_CLIENT_ID: '' });
  });

  it('matches snapshot', () => {
    const props = {
      isLogin: true,
      showFacebookLogin: !!process.env.REACT_APP_FACEBOOK_APP_ID,
      showGoogleLogin: !!process.env.REACT_APP_GOOGLE_CLIENT_ID,
      from: null,
      loginError: null,
      signupError: null,
      submitLogin: noop,
      authInProgress: false,
      submitSignup: noop,
      onOpenTermsOfService: noop,
    };
    const tree = renderShallow(<AuthenticationForms {...props} />);
    expect(tree).toMatchSnapshot();
  });
});

describe('AuthenticationForms with Google login', () => {
  // We need to overwrite social login client ids before running the test
  // to make sure it's same in local environment and in CI
  beforeEach(() => {
    process.env = Object.assign(process.env, { REACT_APP_FACEBOOK_APP_ID: '' });
    process.env = Object.assign(process.env, { REACT_APP_GOOGLE_CLIENT_ID: 'test' });
  });

  it('matches snapshot', () => {
    const props = {
      isLogin: true,
      showFacebookLogin: !!process.env.REACT_APP_FACEBOOK_APP_ID,
      showGoogleLogin: !!process.env.REACT_APP_GOOGLE_CLIENT_ID,
      from: null,
      loginError: null,
      signupError: null,
      submitLogin: noop,
      authInProgress: false,
      submitSignup: noop,
      onOpenTermsOfService: noop,
    };
    const tree = renderShallow(<AuthenticationForms {...props} />);
    expect(tree).toMatchSnapshot();
  });
});

describe('AuthenticationForms with Facebook and Google login', () => {
  // We need to overwrite social login client ids before running the test
  // to make sure it's same in local environment and in CI
  beforeEach(() => {
    process.env = Object.assign(process.env, { REACT_APP_FACEBOOK_APP_ID: 'test' });
    process.env = Object.assign(process.env, { REACT_APP_GOOGLE_CLIENT_ID: 'test' });
  });

  it('matches snapshot', () => {
    const props = {
      isLogin: true,
      showFacebookLogin: !!process.env.REACT_APP_FACEBOOK_APP_ID,
      showGoogleLogin: !!process.env.REACT_APP_GOOGLE_CLIENT_ID,
      from: null,
      loginError: null,
      signupError: null,
      submitLogin: noop,
      authInProgress: false,
      submitSignup: noop,
      onOpenTermsOfService: noop,
    };
    const tree = renderShallow(<AuthenticationForms {...props} />);
    expect(tree).toMatchSnapshot();
  });
});

describe('SocialLoginButtonsMaybe with Facebook and Google login', () => {
  it('matches snapshot', () => {
    const props = {
      isLogin: true,
      showFacebookLogin: true,
      showGoogleLogin: true,
    };
    const tree = renderShallow(<SocialLoginButtonsMaybe {...props} />);
    expect(tree).toMatchSnapshot();
  });
});
