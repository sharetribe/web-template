import React from 'react';

import { bool, object } from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { Page, LayoutSingleColumn } from '../../components';
import { propTypes } from '../../util/types';
import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';
import FooterContainer from '../../containers/FooterContainer/FooterContainer';

import css from './BlogArticleSinglePage.module.css';
import SectionBreadcrumb from '../../components/SectionBreadcrumb/SectionBreadcrumb';
import SectionSubscribe from '../../components/SectionSubscribe/SectionSubscribe';

import SubscribeImage from "../../assets/images/blog-subscribe-2.png";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebook, faInstagram, faLinkedin, faTwitter } from '@fortawesome/free-brands-svg-icons';

export const BlogArticleSinglePageComponent = props => {

  return (
    <Page title={"Article"} className={css.page} scrollingDisabled={false}>
      <LayoutSingleColumn topbar={<TopbarContainer />} footer={<FooterContainer />}>
        <div className={css.root}>
          <SectionBreadcrumb secondary={0} title="How Bevy help Axiom Cloud" currentPath="Article" middlePath="Blog" subTitle="John Doe  JUL 26, 2023 7:15:10 AM" />
          <div className={css.articles}>
            <div className={css.article_row}>
              <div className={css.article_title}>
                Lorem ipsum dolor sit amet consectetur.
              </div>
              <div className={css.article_content}>
                Lorem ipsum dolor sit amet consectetur. Urna condimentum tristique gravida pulvinar sit. Quisque integer a aliquam eleifend ultricies. Lorem ipsum
              </div>
            </div>
            <div className={css.article_row}>
              <div className={css.article_title}>
                Lorem ipsum dolor sit amet consectetur.
              </div>
              <div className={css.article_content}>
                Lorem ipsum dolor sit amet consectetur. Urna condimentum tristique gravida pulvinar sit. Quisque integer a aliquam eleifend ultricies. Lorem ipsum
              </div>
            </div>

            <div className={css.social_box}>
              <FontAwesomeIcon icon={faInstagram} className={css.social_icon} />
              <FontAwesomeIcon icon={faFacebook} className={css.social_icon} />
              <FontAwesomeIcon icon={faLinkedin} className={css.social_icon} />
              <FontAwesomeIcon icon={faTwitter} className={css.social_icon} />
            </div>
          </div>
          <div className={css.subscribe}>
            <SectionSubscribe rightImage={SubscribeImage} />
          </div>
        </div>
      </LayoutSingleColumn>
    </Page>
  );
};

BlogArticleSinglePageComponent.propTypes = {
  pageAssetsData: object,
  inProgress: bool,
  error: propTypes.error,
};

const mapStateToProps = state => {
  const { pageAssetsData, inProgress, error } = state.hostedAssets || {};
  return { pageAssetsData, inProgress, error };
};

const BlogArticleSinglePage = compose(connect(mapStateToProps))(BlogArticleSinglePageComponent);

export default BlogArticleSinglePage;
