import React from 'react';

import { bool, object } from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { Page, LayoutSingleColumn } from '../../components';
import { propTypes } from '../../util/types';
import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';
import FooterContainer from '../../containers/FooterContainer/FooterContainer';
import SectionListingByCategory from '../../components/SectionListingByCategory/SectionListingByCategory';

import css from './MarketPlacePage2.module.css';

export const MarketPlacePage2Component = props => {

  return (
    <Page title={"MarketPlace 2"} scrollingDisabled={false}>
      <LayoutSingleColumn topbar={<TopbarContainer />} footer={<FooterContainer />}>
        <div className={css.root}>
            <div className={css.content}>
                <div className={css.header}>
                    <div className={css.title}>
                        Gather Together
                    </div>
                    On-site, outside, or in-office, the most distinctive Carribean experiences
                </div>
                <SectionListingByCategory  />
            </div>
        </div>
      </LayoutSingleColumn>
    </Page>
  );
};

MarketPlacePage2Component.propTypes = {
  pageAssetsData: object,
  inProgress: bool,
  error: propTypes.error,
};

const mapStateToProps = state => {
  const { pageAssetsData, inProgress, error } = state.hostedAssets || {};
  return { pageAssetsData, inProgress, error };
};

const MarketPlacePage2 = compose(connect(mapStateToProps))(MarketPlacePage2Component);

export default MarketPlacePage2;
