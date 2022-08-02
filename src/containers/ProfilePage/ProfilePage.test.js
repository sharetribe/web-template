import React from 'react';
import { renderDeep, renderShallow } from '../../util/test-helpers';
import { createUser, fakeViewport } from '../../util/test-data';
import {
  AsideContent,
  ReviewsErrorMaybe,
  MobileReviews,
  DesktopReviews,
  MainContent,
} from './ProfilePage';

describe('ProfilePage', () => {
  it('AsideContent matches snapshot', () => {
    const tree = renderDeep(
      <AsideContent user={createUser('test-user')} displayName="test-user" />
    );
    expect(tree).toMatchSnapshot();
  });

  it('ReviewsErrorMaybe matches snapshot', () => {
    const tree = renderDeep(<ReviewsErrorMaybe queryReviewsError={{}} />);
    expect(tree).toMatchSnapshot();
  });

  it('MobileReviews matches snapshot', () => {
    const tree = renderShallow(<MobileReviews queryReviewsError={null} reviews={[]} />);
    expect(tree).toMatchSnapshot();
  });

  it('DesktopReviews matches snapshot', () => {
    const tree = renderShallow(<DesktopReviews queryReviewsError={null} reviews={[]} />);
    expect(tree).toMatchSnapshot();
  });

  it('MainContent matches snapshot', () => {
    const tree = renderShallow(
      <MainContent
        bio="Lorem ipsum"
        displayName="john doe"
        listings={[]}
        userShowError={null}
        queryListingsError={null}
        queryReviewsError={null}
        reviews={[]}
        viewport={fakeViewport}
      />
    );
    expect(tree).toMatchSnapshot();
  });
});
