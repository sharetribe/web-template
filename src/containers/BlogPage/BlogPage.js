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

import css from './BlogPage.module.css';
import SectionBreadcrumb from '../../components/SectionBreadcrumb/SectionBreadcrumb';
import SectionBlogCard from '../../components/SectionBlogCard/SectionBlogCard';
import SectionPagination from '../../components/SectionPagination/SectionPagination';
import SectionSubscribe from '../../components/SectionSubscribe/SectionSubscribe';

import SubscribeImage from '../../assets/images/blog-subscribe.png';

export const BlogPageComponent = props => {
  return (
    <Page title={'Blog'} className={css.page} scrollingDisabled={false}>
      <LayoutSingleColumn topbar={<TopbarContainer />} footer={<FooterContainer />}>
        <div className={css.root}>
          <SectionBreadcrumb secondary={0} title="Blog Page" currentPath="Blog" />
          <div className={css.cards}>
            <div className={css.cardrow}>
              <SectionBlogCard
                image={CardImage1}
                title={'Lorem ipsum dolor sit amet consectetur.'}
                description={
                  'Lorem ipsum dolor sit amet consectetur. Urna condimentum tristique gravida pulvinar sit. Quisque integer a aliquam eleifend ultricies. Lorem ipsum'
                }
              />
              <SectionBlogCard
                image={CardImage2}
                title={'Lorem ipsum dolor sit amet consectetur.'}
                description={
                  'Lorem ipsum dolor sit amet consectetur. Urna condimentum tristique gravida pulvinar sit. Quisque integer a aliquam eleifend ultricies. Lorem ipsum'
                }
              />
              <SectionBlogCard
                image={CardImage3}
                title={'Lorem ipsum dolor sit amet consectetur.'}
                description={
                  'Lorem ipsum dolor sit amet consectetur. Urna condimentum tristique gravida pulvinar sit. Quisque integer a aliquam eleifend ultricies. Lorem ipsum'
                }
              />
            </div>
            <div className={css.cardrow}>
              <SectionBlogCard
                image={CardImage4}
                title={'Lorem ipsum dolor sit amet consectetur.'}
                description={
                  'Lorem ipsum dolor sit amet consectetur. Urna condimentum tristique gravida pulvinar sit. Quisque integer a aliquam eleifend ultricies. Lorem ipsum'
                }
              />
              <SectionBlogCard
                image={CardImage5}
                title={'Lorem ipsum dolor sit amet consectetur.'}
                description={
                  'Lorem ipsum dolor sit amet consectetur. Urna condimentum tristique gravida pulvinar sit. Quisque integer a aliquam eleifend ultricies. Lorem ipsum'
                }
              />
              <SectionBlogCard
                image={CardImage6}
                title={'Lorem ipsum dolor sit amet consectetur.'}
                description={
                  'Lorem ipsum dolor sit amet consectetur. Urna condimentum tristique gravida pulvinar sit. Quisque integer a aliquam eleifend ultricies. Lorem ipsum'
                }
              />
            </div>
          </div>
          <div className={css.pagination}>
            <SectionPagination total={4} current={1} />
          </div>
          <div className={css.subscribe}>
            <SectionSubscribe rightImage={SubscribeImage} />
          </div>
        </div>
      </LayoutSingleColumn>
    </Page>
  );
};

BlogPageComponent.propTypes = {
  pageAssetsData: object,
  inProgress: bool,
  error: propTypes.error,
};

const mapStateToProps = state => {
  const { pageAssetsData, inProgress, error } = state.hostedAssets || {};
  return { pageAssetsData, inProgress, error };
};

const BlogPage = compose(connect(mapStateToProps))(BlogPageComponent);

export default BlogPage;
