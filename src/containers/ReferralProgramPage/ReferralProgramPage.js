import { compose } from 'redux';
import { connect } from 'react-redux';
import { Flex, Spin } from 'antd';

import { injectIntl } from '../../util/reactIntl';
import { isScrollingDisabled } from '../../ducks/ui.duck';

import { Page, UserNav, LayoutSingleColumn } from '../../components';
import TopbarContainer from '../TopbarContainer/TopbarContainer';
import FooterContainer from '../FooterContainer/FooterContainer';

import css from './ReferralProgramPage.module.css';

export const ReferralProgramPageComponent = props => {
  const { referralCode, scrollingDisabled, intl } = props;
  const title = intl.formatMessage({ id: 'ReferralProgramPage.title' });
  const referralCampaignURL = `https://embed.referral-factory.com/${referralCode}/referrals`;

  return (
    <Page title={title} scrollingDisabled={scrollingDisabled}>
      <LayoutSingleColumn
        topbar={
          <>
            <TopbarContainer currentPage="ReferralProgramPage" />
            <UserNav currentPage="ReferralProgramPage" />
          </>
        }
        footer={<FooterContainer />}
      >
        {referralCode ? (
          <div className={css.root}>
            <iframe
              src={referralCampaignURL}
              allow="clipboard-write"
              id="referral-campaign-iframe"
              title="referral-campaign-iframe"
              width="100%"
              height="100%"
              frameBorder="0"
            ></iframe>
          </div>
        ) : (
          <Flex justify="center" align="center">
            <Spin size="large" />
          </Flex>
        )}
      </LayoutSingleColumn>
    </Page>
  );
};

const mapStateToProps = state => {
  const { referralCode } = state.ReferralProgramPage;
  return {
    scrollingDisabled: isScrollingDisabled(state),
    referralCode,
  };
};

const ReferralProgramPage = compose(
  connect(mapStateToProps),
  injectIntl
)(ReferralProgramPageComponent);

export default ReferralProgramPage;
