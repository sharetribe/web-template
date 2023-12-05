import React from 'react';

import { bool, object } from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { Page, LayoutSingleColumn } from '../../components';
import { propTypes } from '../../util/types';
import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';
import FooterContainer from '../../containers/FooterContainer/FooterContainer';
import SectionCaribbean from '../../components/SectionCaribbean/SectionCaribbean';
import SectionTeamExperience from '../../components/SectionTeamExperience/SectionTeamExperience';
import SectionCustomerService from '../../components/SectionCustomerService/SectionCustomerService';
import SectionFeaturedExperience from '../../components/SectionFeaturedExperience/SectionFeaturedExperience';
import SectionTips from '../../components/SectionTips/SectionTips';
import SectionCustomExperience from '../../components/SectionCustomExperience/SectionCustomExperience';
import SectionBevyExperience from '../../components/SectionBevyExperience/SectionBevyExperience';
import SectionYearExperience from '../../components/SectionYearExperience/SectionYearExperience';
import SectionLiveDemo from '../../components/SectionLiveDemo/SectionLiveDemo';

import css from './LandingPage.module.css';

export const LandingPageComponent = props => {
  return (
    <Page title={'Home'} scrollingDisabled={false}>
      <LayoutSingleColumn topbar={<TopbarContainer />} footer={<FooterContainer />}>
        <div className={css.root}>
          <div className={css.content}>
            <SectionCaribbean />
            <SectionTeamExperience />
            <SectionCustomerService />
            <SectionFeaturedExperience />
            <SectionTips />
            <SectionCustomExperience />
            <SectionBevyExperience />
            <SectionYearExperience />
            <SectionLiveDemo />
          </div>
        </div>
      </LayoutSingleColumn>
    </Page>
  );
};

LandingPageComponent.propTypes = {
  pageAssetsData: object,
  inProgress: bool,
  error: propTypes.error,
};

const mapStateToProps = state => {
  const { pageAssetsData, inProgress, error } = state.hostedAssets || {};
  return { pageAssetsData, inProgress, error };
};

const LandingPage = compose(connect(mapStateToProps))(LandingPageComponent);

export default LandingPage;
