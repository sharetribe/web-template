import React from 'react';

import { bool, object } from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { Page, LayoutSingleColumn } from '../../components';
import { propTypes } from '../../util/types';
import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';
import FooterContainer from '../../containers/FooterContainer/FooterContainer';

import CardImage1 from '../../assets/images/blog/1.png';
import CardImage2 from '../../assets/images/blog/2.png';
import CardImage3 from '../../assets/images/blog/3.png';
import CardImage4 from '../../assets/images/blog/4.png';
import CardImage5 from '../../assets/images/blog/5.png';
import CardImage6 from '../../assets/images/blog/6.png';

import css from './BlogArticlePage.module.css';
import SectionBreadcrumb from '../../components/SectionBreadcrumb/SectionBreadcrumb';
import SectionBlogCard from '../../components/SectionBlogCard/SectionBlogCard';
import SectionPagination from '../../components/SectionPagination/SectionPagination';
import SectionSubscribe from '../../components/SectionSubscribe/SectionSubscribe';

import SubscribeImage from '../../assets/images/blog-subscribe.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebook, faInstagram, faLinkedin, faTwitter } from '@fortawesome/free-brands-svg-icons';

import NamedLink from '../../components/NamedLink/NamedLink';

export const BlogArticlePageComponent = props => {
  return (
    <Page title={'Article'} className={css.page} scrollingDisabled={false}>
      <LayoutSingleColumn topbar={<TopbarContainer />} footer={<FooterContainer />}>
        <div className={css.root}>
          <SectionBreadcrumb
            secondary={0}
            title="How Bevy help Axiom Cloud"
            currentPath="Article"
            middlePath="Blog"
            subTitle="John Doe  JUL 26, 2023 7:15:10 AM"
          />
          <div className={css.list}>
            <div className={css.articles}>
              <div className={css.article_row}>
                <div className={css.article_title}>Lorem ipsum dolor sit amet consectetur.</div>
                <div className={css.article_content}>
                  Lorem ipsum dolor sit amet consectetur. Urna condimentum tristique gravida
                  pulvinar sit. Quisque integer a aliquam eleifend ultricies. Lorem ipsum
                </div>
              </div>
              <div className={css.article_row}>
                <div className={css.article_title}>Lorem ipsum dolor sit amet consectetur.</div>
                <div className={css.article_content}>
                  Lorem ipsum dolor sit amet consectetur. Urna condimentum tristique gravida
                  pulvinar sit. Quisque integer a aliquam eleifend ultricies. Lorem ipsum
                </div>
              </div>
              <div className={css.social_box}>
                <FontAwesomeIcon icon={faInstagram} className={css.social_icon} />
                <FontAwesomeIcon icon={faFacebook} className={css.social_icon} />
                <FontAwesomeIcon icon={faLinkedin} className={css.social_icon} />
                <FontAwesomeIcon icon={faTwitter} className={css.social_icon} />
              </div>
            </div>
            <div className={css.latest}>
              <div className={css.latest_title}>Latest articles</div>
              <div className={css.latest_articles}>
                <div>
                  <NamedLink className={css.latest_article_title} name="BlogArticleSinglePage">
                    Lorem ipsum dolor sit amet consectetur.
                  </NamedLink>
                  <div className={css.latest_article_content}>
                    Lorem ipsum dolor sit amet consectetur. Urna condimentum...
                  </div>
                </div>
                <div className={css.latest_article_line}></div>
                <div>
                  <NamedLink className={css.latest_article_title} name="BlogArticleSinglePage">
                    Lorem ipsum dolor sit amet consectetur.
                  </NamedLink>
                  <div className={css.latest_article_content}>
                    Lorem ipsum dolor sit amet consectetur. Urna condimentum...
                  </div>
                </div>
                <div className={css.latest_article_line}></div>
                <div>
                  <NamedLink className={css.latest_article_title} name="BlogArticleSinglePage">
                    Lorem ipsum dolor sit amet consectetur.
                  </NamedLink>
                  <div className={css.latest_article_content}>
                    Lorem ipsum dolor sit amet consectetur. Urna condimentum...
                  </div>
                </div>
              </div>
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

BlogArticlePageComponent.propTypes = {
  pageAssetsData: object,
  inProgress: bool,
  error: propTypes.error,
};

const mapStateToProps = state => {
  const { pageAssetsData, inProgress, error } = state.hostedAssets || {};
  return { pageAssetsData, inProgress, error };
};

const BlogArticlePage = compose(connect(mapStateToProps))(BlogArticlePageComponent);

export default BlogArticlePage;
