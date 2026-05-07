import React from 'react';

import { useIntl } from '../../util/reactIntl';

import { Page, LayoutSingleColumn } from '../../components';

import TopbarContainer from '../TopbarContainer/TopbarContainer';
import FooterContainer from '../FooterContainer/FooterContainer';

import css from './ExpertSignupThankYouPage.module.css';

/**
 * The ExpertSignupThankYouPage component.
 * Shown after a successful expert application submission.
 *
 * @component
 * @returns {JSX.Element}
 */
const ExpertSignupThankYouPage = () => {
  const intl = useIntl();
  const title = intl.formatMessage({ id: 'ExpertSignupThankYouPage.title' });

  return (
    <Page title={title} scrollingDisabled={false}>
      <LayoutSingleColumn topbar={<TopbarContainer />} footer={<FooterContainer />}>
        <div className={css.root}>
          <div className={css.content}>
            <h1 className={css.heading}>
              {intl.formatMessage({ id: 'ExpertSignupThankYouPage.heading' })}
            </h1>
            <p className={css.intro}>
              {intl.formatMessage({ id: 'ExpertSignupThankYouPage.intro' })}
            </p>
            <ul className={css.outcomeList}>
              <li>
                <strong>
                  {intl.formatMessage({ id: 'ExpertSignupThankYouPage.outcomeDirectLabel' })}
                </strong>{' '}
                {intl.formatMessage({ id: 'ExpertSignupThankYouPage.outcomeDirectText' })}
              </li>
              <li>
                <strong>
                  {intl.formatMessage({ id: 'ExpertSignupThankYouPage.outcomeDialogueLabel' })}
                </strong>{' '}
                {intl.formatMessage({ id: 'ExpertSignupThankYouPage.outcomeDialogueText' })}
              </li>
              <li>
                <strong>
                  {intl.formatMessage({ id: 'ExpertSignupThankYouPage.outcomeNotAcceptedLabel' })}
                </strong>{' '}
                {intl.formatMessage({ id: 'ExpertSignupThankYouPage.outcomeNotAcceptedText' })}
              </li>
            </ul>
            <p className={css.closing}>
              {intl.formatMessage({ id: 'ExpertSignupThankYouPage.closing' })}
            </p>
            <p className={css.signature}>
              {intl.formatMessage({ id: 'ExpertSignupThankYouPage.signatureRegards' })}
              <br />
              {intl.formatMessage({ id: 'ExpertSignupThankYouPage.signatureTeam' })}
            </p>
          </div>
        </div>
      </LayoutSingleColumn>
    </Page>
  );
};

export default ExpertSignupThankYouPage;
