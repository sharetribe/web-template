import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useIntl } from '../../util/reactIntl';
import { ensureCurrentUser } from '../../util/data';
import { signup, authenticationInProgress } from '../../ducks/auth.duck';

import { Page, LayoutSingleColumn, NamedRedirect } from '../../components';

import TopbarContainer from '../TopbarContainer/TopbarContainer';
import FooterContainer from '../FooterContainer/FooterContainer';

import ExpertSignupForm from './ExpertSignupForm/ExpertSignupForm';

import css from './ExpertSignupPage.module.css';

/**
 * Builds the signup params for the expert application form.
 * Core identity fields (email, password, fname, lname) are mapped to SDK fields.
 * All remaining form values are stored in privateData.
 *
 * @param {Object} values - form submit values
 * @returns {Object} params for the signup thunk
 */
const getExpertSignupParams = values => {
  const { email, password, fname, lname, ...rest } = values;

  // Strip empty strings so privateData stays clean
  const privateData = Object.entries(rest).reduce((acc, [key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      acc[key] = val;
    }
    return acc;
  }, {});

  return {
    email,
    password,
    firstName: fname.trim(),
    lastName: lname.trim(),
    privateData,
  };
};

/**
 * The ExpertSignupPage component.
 *
 * @component
 * @returns {JSX.Element}
 */
const ExpertSignupPage = () => {
  const dispatch = useDispatch();
  const intl = useIntl();

  // Redux state
  const authInProgress = useSelector(state => authenticationInProgress(state));
  const signupError = useSelector(state => state.auth?.signupError);
  const isAuthenticated = useSelector(state => state.auth?.isAuthenticated);
  const currentUser = useSelector(state => state.user?.currentUser);

  const user = ensureCurrentUser(currentUser);
  const currentUserLoaded = !!user.id;

  const handleSubmit = useCallback(
    values => {
      dispatch(signup(getExpertSignupParams(values)));
    },
    [dispatch]
  );

  const title = intl.formatMessage({ id: 'ExpertSignupPage.title' });

  // Redirect to thank you page once the user is fully created
  if (isAuthenticated && currentUserLoaded) {
    return <NamedRedirect name="ExpertSignupThankYouPage" />;
  }

  return (
    <Page title={title} scrollingDisabled={false}>
      <LayoutSingleColumn topbar={<TopbarContainer />} footer={<FooterContainer />}>
        <div className={css.root}>
          <div className={css.formContent}>
            <h1 className={css.heading}>
              {intl.formatMessage({ id: 'ExpertSignupPage.heading' })}
            </h1>
            <p className={css.description}>
              {intl.formatMessage({ id: 'ExpertSignupPage.description' })}
            </p>
            {signupError ? (
              <p className={css.error}>
                {intl.formatMessage({ id: 'ExpertSignupPage.signupFailed' })}
              </p>
            ) : null}
            <ExpertSignupForm
              formId="ExpertSignupForm"
              onSubmit={handleSubmit}
              inProgress={authInProgress}
            />
          </div>
        </div>
      </LayoutSingleColumn>
    </Page>
  );
};

export default ExpertSignupPage;
