import React from 'react';

import { bool, object } from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { Page, LayoutSingleColumn } from '../../components';
import { propTypes } from '../../util/types';
import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';
import FooterContainer from '../../containers/FooterContainer/FooterContainer';

import css from './BecomeHostPage.module.css';
import SectionSurvey from '../../components/SectionSurvey/SectionSurvey';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGem, faLightbulb } from '@fortawesome/free-regular-svg-icons';
import {
  faLock,
  faMagnifyingGlass,
  faPeopleGroup,
  faRocket,
  faShieldHalved,
  faShieldVirus,
} from '@fortawesome/free-solid-svg-icons';

export const BecomeHostPageComponent = props => {
  return (
    <Page title={'Become a Host'} className={css.page} scrollingDisabled={false}>
      <LayoutSingleColumn topbar={<TopbarContainer />} footer={<FooterContainer />}>
        <div className={css.root}>
          <div className={css.content}>
            <div className={css.section_head}>
              <div className={css.section_head_l}>
                <div className={css.section_head_l_desc}>
                  <div className={css.section_head_l_desc_title}>
                    Allow it to grow if you like it.
                  </div>
                  <div className={css.section_head_l_desc_content}>
                    Bevy works with creators and companies to transform their passions into
                    engaging, scalable in-person and virtual experiences for the world's most
                    influential teams.
                  </div>
                </div>
                <div className={css.section_head_button}>Become a Host</div>
              </div>
              <div className={css.section_head_r}></div>
            </div>

            <div className={css.section_creating_culture}>
              <h2>Creating a culture for the best teams in the world.</h2>
              <div className={css.section_creating_culture_container}>
                <div className={css.section_creating_culture_item}>
                  <FontAwesomeIcon icon={faPeopleGroup} className={css.fontIconCreatingCulture} />
                  <div>
                    <div className={css.section_creating_culture_title}>
                      Build an engaged audience.
                    </div>
                    <div className={css.section_creating_culture_desc}>
                      We assemble outstanding teams to work closely with you and your goods or
                      services.
                    </div>
                  </div>
                </div>
                <div className={css.section_creating_culture_item}>
                  <FontAwesomeIcon icon={faLightbulb} className={css.fontIconCreatingCulture} />
                  <div>
                    <div className={css.section_creating_culture_title}>
                      Make use of your creativity.
                    </div>
                    <div className={css.section_creating_culture_desc}>
                      Our hosts work from any location, pursuing their passions. Greetings from the passionate economy.
                    </div>
                  </div>
                </div>
                <div className={css.section_creating_culture_item}>
                  <FontAwesomeIcon icon={faRocket} className={css.fontIconCreatingCulture} />
                  <div>
                    <div className={css.section_creating_culture_title}>
                      Create memorable experiences.
                    </div>
                    <div className={css.section_creating_culture_desc}>
                      In order to create experiences that people will touch, taste, and remember, we combine real products with virtual interactivity.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={css.section_become_host}>
              <div className={css.section_become_host_l}>
                <h3>There is nothing better than Bevy Hosts.</h3>
                <div className={css.section_head_button}>Become a Host</div>
              </div>
              <div className={css.section_become_host_r}>
                <div className={css.secton_become_host_r_item}>
                  <div>
                    <FontAwesomeIcon icon={faLock} className={css.becomeHostIcon} />
                  </div>
                  <div className={css.section_become_host_r_item_desc}>
                    <div className={css.section_become_host_r_item_desc_title}>Connection</div>
                    <div className={css.section_become_host_r_item_desc_body}>
                      Bevy hosts create secure environments where people feel noticed, appreciated,
                      and respected, fostering meaningful and deep conversations.
                    </div>
                  </div>
                </div>
                <div className={css.secton_become_host_r_item}>
                  <div>
                    <FontAwesomeIcon icon={faShieldHalved} className={css.becomeHostIcon} />
                  </div>
                  <div className={css.section_become_host_r_item_desc}>
                    <div className={css.section_become_host_r_item_desc_title}>Connection</div>
                    <div className={css.section_become_host_r_item_desc_body}>
                      Bevy hosts create secure environments where people feel noticed, appreciated,
                      and respected, fostering meaningful and deep conversations.
                    </div>
                  </div>
                </div>
                <div className={css.secton_become_host_r_item}>
                  <div>
                    <FontAwesomeIcon icon={faMagnifyingGlass} className={css.becomeHostIcon} />
                  </div>
                  <div className={css.section_become_host_r_item_desc}>
                    <div className={css.section_become_host_r_item_desc_title}>Connection</div>
                    <div className={css.section_become_host_r_item_desc_body}>
                      Bevy hosts create secure environments where people feel noticed, appreciated,
                      and respected, fostering meaningful and deep conversations.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={css.section_case_study}>
              <div className={css.section_case_study_l}></div>
              <div className={css.section_case_study_r}>
                <div className={css.section_case_study_r_fontIcon}>
                  <FontAwesomeIcon icon={faGem} className={css.fontIcon} />
                </div>
                <div className={css.section_case_study_content}>
                  <div className={css.section_case_study_content_title}>Case study name</div>
                  <div className={css.section_case_study_content_content}>
                    Lorem ipsum lorem ipsum Lorem ipsum lorem ipsum Lorem ipsum lorem ipsum Lorem
                    ipsum lorem ipsum Lorem ipsum lorem ipsum Lorem ipsum lorem ipsum Lorem ipsum
                    lorem ipsum
                  </div>
                  <div className={css.section_case_study_content_button}>Become a host</div>
                </div>
              </div>
            </div>
            <SectionSurvey />
          </div>
        </div>
      </LayoutSingleColumn>
    </Page>
  );
};

BecomeHostPageComponent.propTypes = {
  pageAssetsData: object,
  inProgress: bool,
  error: propTypes.error,
};

const mapStateToProps = state => {
  const { pageAssetsData, inProgress, error } = state.hostedAssets || {};
  return { pageAssetsData, inProgress, error };
};

const BecomeHostPage = compose(connect(mapStateToProps))(BecomeHostPageComponent);

export default BecomeHostPage;
