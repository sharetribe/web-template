import React, { useRef } from 'react';
import { arrayOf, string } from 'prop-types';
import classNames from 'classnames';

import { injectIntl, intlShape } from '../../util/reactIntl';
import { propTypes } from '../../util/types';

import { Avatar, SecondaryButton, ReviewRating, UserDisplayName } from '../../components';

import {ChevronLeft, ChevronRight} from 'lucide-react';

import Carousel from "react-multi-carousel";
import "react-multi-carousel/lib/styles.css";

import css from './Reviews.module.css';

const Review = props => {
  const { review, intl } = props;

  const date = review.attributes.createdAt;
  const dateString = intl.formatDate(date, { month: 'long', year: 'numeric' });

  return (
    <div className={css.review}>
      <Avatar className={css.avatar} user={review.author} />
      <div>
        <ReviewRating
          rating={review.attributes.rating}
          className={css.mobileReviewRating}
          reviewStarClassName={css.reviewRatingStar}
        />
        <p className={css.reviewContent}>{review.attributes.content}</p>
        <p className={css.reviewInfo}>
          <UserDisplayName user={review.author} intl={intl} />
          <span className={css.separator}>•</span>
          {dateString}
          <span className={css.desktopSeparator}>•</span>
          <span className={css.desktopReviewRatingWrapper}>
            <ReviewRating
              rating={review.attributes.rating}
              className={css.desktopReviewRating}
              reviewStarClassName={css.reviewRatingStar}
            />
          </span>
        </p>
      </div>
    </div>
  );
};

Review.propTypes = {
  review: propTypes.review.isRequired,
  intl: intlShape.isRequired,
};

const ReviewsComponent = props => {
  
  const { className, rootClassName, reviews, intl } = props;
  const classes = classNames(rootClassName || css.root, className);
  
  const responsive = {
    desktop: {
      breakpoint: { max: 3000, min: 1024 },
      items: 2
    },
    mobile: {
      breakpoint: { max: 600, min: 0 },
      items: 1
    }
  };

  const carouselRef = useRef(null);

  const [currentSlide, setCurrentSlide] = React.useState(0);
  const [totalItems, setTotalItems] = React.useState(0);

  const handleAfterChange = (previousSlide, { currentSlide, totalItems }) => {
    setCurrentSlide(currentSlide);
    setTotalItems(totalItems);
  };

  return (
    <div className={classes}>
      <div className="carousel-button-group">
        <SecondaryButton 
          className={currentSlide === 0 ? 'disable' : ''} 
          onClick={() => carouselRef.current.previous()}
        >
          <ChevronLeft/>
        </SecondaryButton>
        <SecondaryButton 
          className={currentSlide === totalItems - 1 ? 'disable' : ''} 
          onClick={() => carouselRef.current.next()}
        >
          <ChevronRight/>
        </SecondaryButton>
      </div>

      <Carousel 
        ref={carouselRef} 
        arrows={false} 
        responsive={responsive} 
        afterChange={handleAfterChange}
      >
        {reviews.map(r => {
          return (
            <li key={`Review_${r.id.uuid}`} className={css.reviewItem}>
              <Review review={r} intl={intl} />
            </li>
          );
        })}
      </Carousel>
    </div>
  );
};

ReviewsComponent.defaultProps = {
  className: null,
  rootClassName: null,
  reviews: [],
};

ReviewsComponent.propTypes = {
  className: string,
  rootCalssName: string,
  reviews: arrayOf(propTypes.review),

  // from injectIntl
  intl: intlShape.isRequired,
};

const Reviews = injectIntl(ReviewsComponent);

export default Reviews;
