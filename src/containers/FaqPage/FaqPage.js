import React from 'react';

import { bool, object } from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { Page, LayoutSingleColumn } from '../../components';
import { propTypes } from '../../util/types';
import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';
import FooterContainer from '../../containers/FooterContainer/FooterContainer';

import css from './FaqPage.module.css';
import SectionBreadcrumb from '../../components/SectionBreadcrumb/SectionBreadcrumb';
import SectionFaqBlock from '../../components/SectionFaqBlock/SectionFaqBlock';

export const FaqPageComponent = props => {
  return (
    <Page title={'FAQ'} className={css.page} scrollingDisabled={false}>
      <LayoutSingleColumn topbar={<TopbarContainer />} footer={<FooterContainer />}>
        <div className={css.root}>
          <SectionBreadcrumb secondary={1} title="FAQ Page" currentPath="FAQ" />
          <div className={css.content}>
            <SectionFaqBlock />
            <SectionFaqBlock />
            <SectionFaqBlock />
          </div>
        </div>
      </LayoutSingleColumn>
    </Page>
  );
};

FaqPageComponent.propTypes = {
  pageAssetsData: object,
  inProgress: bool,
  error: propTypes.error,
};

const mapStateToProps = state => {
  const { pageAssetsData, inProgress, error } = state.hostedAssets || {};
  return { pageAssetsData, inProgress, error };
};

const FaqPage = compose(connect(mapStateToProps))(FaqPageComponent);

export default FaqPage;
