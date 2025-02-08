import React, { useRef } from 'react';
import { arrayOf, string } from 'prop-types';
import classNames from 'classnames';

import { injectIntl, intlShape } from '../../util/reactIntl';
import { propTypes } from '../../util/types';

import { Avatar, SecondaryButton, ReviewRating, UserDisplayName } from '../../components';

import {ChevronLeft, ChevronRight} from 'lucide-react';

import Slider from "react-slick";

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
  
  const settings = {
    dots: true,
    infinite: false,
    speed: 500,
    slidesToShow: 2,
    slidesToScroll: 1,
    initialSlide: 0,
    responsive: [

      {
        breakpoint: 600,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1
        }
      }
    ]
  };

  const carouselRef = useRef(null);
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const [slidesToShow, setSlidesToShow] = React.useState(settings.slidesToShow);

  const updateSlidesToShow = () => {
    const width = window.innerWidth;
    const responsiveSetting = settings.responsive.find(r => width <= r.breakpoint);
    setSlidesToShow(responsiveSetting ? responsiveSetting.settings.slidesToShow : settings.slidesToShow);
    carouselRef.current.slickGoTo(0);
  };

  React.useEffect(() => {
    updateSlidesToShow();
    window.addEventListener('resize', updateSlidesToShow);

    // Mimic a window resize event
    const resizeEvent = new Event('resize');

    setTimeout(() => {
      window.dispatchEvent(resizeEvent);
    }, 300);

    return () => {
      window.removeEventListener('resize', updateSlidesToShow);
    };
  }, []);

  const totalSlides = Math.ceil(reviews.length / slidesToShow);

  //for use with carousel buttons
  const handleAfterChange = (current) => {
    setCurrentSlide(current);
    console.log('current', current);
    console.log('totalSlides', totalSlides);
  };

  return (
    <div className={classes}>
      <div className="carousel-button-group">
        <SecondaryButton 
          className={currentSlide === 0 ? 'disable' : ''} 
          onClick={() => carouselRef.current.slickPrev()}
        >
          <ChevronLeft/>
        </SecondaryButton>
        <SecondaryButton 
          className={currentSlide == totalSlides -1 ? 'disable' : ''}
          onClick={() => carouselRef.current.slickNext()}
        >
          <ChevronRight/>
        </SecondaryButton>
      </div>

      <Slider ref={carouselRef} {...settings} afterChange={handleAfterChange}>
        {reviews.map(r => {
          return (
            <div key={`Review_${r.id.uuid}`} className={css.reviewItem}>
              <Review review={r} intl={intl} />
            </div>
          );
        })}
      </Slider>
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
