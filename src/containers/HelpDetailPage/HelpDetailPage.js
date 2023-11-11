import React from 'react';

import { bool, object } from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { Page, LayoutSingleColumn } from '../../components';
import { propTypes } from '../../util/types';
import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';
import FooterContainer from '../../containers/FooterContainer/FooterContainer';

import css from './HelpDetailPage.module.css';
import SectionHelpHead from '../../components/SectionHelpHead/SectionHelpHead';
import SectionHelpCard from '../../components/SectionHelpCard/SectionHelpCard';
import SectionHelpfulQuiz from '../../components/SectionHelpfulQuiz/SectionHelpfulQuiz';
import SectionHelpSidebarItem from '../../components/SectionHelpSidebarItem/SectionHelpSidebarItem';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck } from '@fortawesome/free-regular-svg-icons';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';

export const HelpDetailPageComponent = props => {

  return (
    <Page title={"HelpCenter"} scrollingDisabled={false}>
      <LayoutSingleColumn topbar={<TopbarContainer />} footer={<FooterContainer />}>
        <div className={css.root}>
          <div className={css.content}>
            <SectionHelpHead title="Help Center" subTitle="Welcome to our" />
            <div className={css.main_content}>
              <div className={css.sidebar}>
                <SectionHelpSidebarItem title="About Bevy Experiences" active={true} />
                <SectionHelpSidebarItem title="Getting Started" active={false} />
                <SectionHelpSidebarItem title="Planning & Managing an Experience" active={false} />
                <SectionHelpSidebarItem title="Payment" active={false} />
                <SectionHelpSidebarItem title="Retreat Experiences" active={false} />
                <SectionHelpSidebarItem title="In-Person & Venue Experiences" active={false} />
                <SectionHelpSidebarItem title="Virtual Experiences" active={false} />
                <SectionHelpSidebarItem title="Become a Host" active={false} />
                <SectionHelpSidebarItem title="Booking an Experience" active={false} />
              </div>
              <div className={css.details}>
                <div className={css.help_content}>
                  <h3>Where did the name Bevy Experiences come from?</h3>
                  <div className={css.help_detail}>
                    The word Bevy means a large group of people or things of a particular kind, so it was fitting that Bevy be an event company that brings people together to bond, get to know each other and enjoy themselves.
                  </div>
                </div>
                <SectionHelpfulQuiz quizType={0} bodyText={"Was this article helpful?"} />
                <SectionHelpfulQuiz quizType={1} bodyText={"Thank you. Your feedback will be used to make future improvements."} />
                <div className={css.help_related_container}>
                  <h5>Related articles</h5>
                  <div className={css.help_related_index}>
                    <FontAwesomeIcon icon={faArrowRight} className={css.fontIcon} />
                    What is Bevy Experiences?
                  </div>
                  <div className={css.help_related_index}>
                    <FontAwesomeIcon icon={faArrowRight} className={css.fontIcon} />
                    What is Bevy Experiences?
                  </div>
                  <div className={css.help_related_index}>
                    <FontAwesomeIcon icon={faArrowRight} className={css.fontIcon} />
                    What is Bevy Experiences?
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </LayoutSingleColumn>
    </Page>
  );
};

HelpDetailPageComponent.propTypes = {
  pageAssetsData: object,
  inProgress: bool,
  error: propTypes.error,
};

const mapStateToProps = state => {
  const { pageAssetsData, inProgress, error } = state.hostedAssets || {};
  return { pageAssetsData, inProgress, error };
};

const HelpDetailPage = compose(connect(mapStateToProps))(HelpDetailPageComponent);

export default HelpDetailPage;
