import React from 'react';

import { bool, object } from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { Page, LayoutSingleColumn } from '../../components';
import { propTypes } from '../../util/types';
import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';
import FooterContainer from '../../containers/FooterContainer/FooterContainer';

import css from './HelpCenterPage.module.css';
import SectionHelpHead from '../../components/SectionHelpHead/SectionHelpHead';
import SectionHelpCard from '../../components/SectionHelpCard/SectionHelpCard';

export const HelpCenterPageComponent = props => {

  return (
    <Page title={"HelpCenter"} scrollingDisabled={false}>
      <LayoutSingleColumn topbar={<TopbarContainer />} footer={<FooterContainer />}>
        <div className={css.root}>
          <div className={css.content}>
            <SectionHelpHead title="Help Center" subTitle="Welcome to our" />
            <div className={css.helpCards}>
              <div className={css.helpCardRow}>
                <SectionHelpCard
                  title={"Getting Started"}
                  content={"Queries about bookkeeping, managing, voting on a team experience, creating proposals, and other relevant aspects!"}
                  buttonType={1} />
                <SectionHelpCard
                  title={"Getting Started"}
                  content={"Queries about bookkeeping, managing, voting on a team experience, creating proposals, and other relevant aspects!"}
                  buttonType={0} />
                <SectionHelpCard
                  title={"Getting Started"}
                  content={"Queries about bookkeeping, managing, voting on a team experience, creating proposals, and other relevant aspects!"}
                  buttonType={1} />
              </div>
              <div className={css.helpCardRow}>
                <SectionHelpCard
                  title={"Getting Started"}
                  content={"Queries about bookkeeping, managing, voting on a team experience, creating proposals, and other relevant aspects!"}
                  buttonType={1} />
                <SectionHelpCard
                  title={"Getting Started"}
                  content={"Queries about bookkeeping, managing, voting on a team experience, creating proposals, and other relevant aspects!"}
                  buttonType={1} />
                <SectionHelpCard
                  title={"Getting Started"}
                  content={"Queries about bookkeeping, managing, voting on a team experience, creating proposals, and other relevant aspects!"}
                  buttonType={1} />
              </div>
            </div>
          </div>
        </div>
      </LayoutSingleColumn>
    </Page>
  );
};

HelpCenterPageComponent.propTypes = {
  pageAssetsData: object,
  inProgress: bool,
  error: propTypes.error,
};

const mapStateToProps = state => {
  const { pageAssetsData, inProgress, error } = state.hostedAssets || {};
  return { pageAssetsData, inProgress, error };
};

const HelpCenterPage = compose(connect(mapStateToProps))(HelpCenterPageComponent);

export default HelpCenterPage;
