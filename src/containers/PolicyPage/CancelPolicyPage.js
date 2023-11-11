import React from 'react';

import { bool, object } from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { Page, LayoutSingleColumn } from '../../components';
import { propTypes } from '../../util/types';
import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';
import FooterContainer from '../../containers/FooterContainer/FooterContainer';

import css from './PolicyPage.module.css';
import SectionBreadcrumb from '../../components/SectionBreadcrumb/SectionBreadcrumb';

export const CancelPolicyPageComponent = props => {
  return (
    <Page title={'Cancellation policy'} className={css.page} scrollingDisabled={false}>
      <LayoutSingleColumn topbar={<TopbarContainer />} footer={<FooterContainer />}>
        <div className={css.root}>
          <SectionBreadcrumb
            secondary={0}
            title="Cancellation policy"
            currentPath="Cancellation policy"
            middlePath=""
            subTitle="Last update  JUL 26, 2023 7:15:10 AM"
          />
          <div className={css.articles}>
            <div className={css.article_row}>
              <div className={css.article_title}>Lorem ipsum dolor sit amet consectetur.</div>
              <div className={css.article_content}>
                Lorem ipsum dolor sit amet consectetur. Urna condimentum tristique gravida pulvinar
                sit. Quisque integer a aliquam eleifend ultricies. Lorem ipsum
              </div>
            </div>
            <div className={css.article_row}>
              <div className={css.article_title}>Lorem ipsum dolor sit amet consectetur.</div>
              <div className={css.article_content}>
                Lorem ipsum dolor sit amet consectetur. Urna condimentum tristique gravida pulvinar
                sit. Quisque integer a aliquam eleifend ultricies. Lorem ipsum
              </div>
            </div>

          </div>
        </div>
      </LayoutSingleColumn>
    </Page>
  );
};

CancelPolicyPageComponent.propTypes = {
  pageAssetsData: object,
  inProgress: bool,
  error: propTypes.error,
};

const mapStateToProps = state => {
  const { pageAssetsData, inProgress, error } = state.hostedAssets || {};
  return { pageAssetsData, inProgress, error };
};

const CancelPolicyPage = compose(connect(mapStateToProps))(CancelPolicyPageComponent);

export default CancelPolicyPage;
