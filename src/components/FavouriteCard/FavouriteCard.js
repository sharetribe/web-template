import React, { useState } from 'react';
import { string } from 'prop-types';
import css from './FavouriteCard.module.css';

const FavouriteCard = props => {
  const { title, comment, price, location, background } = props;

  return (
    <div className={css.root}>
      <div className={css.topContainer}>
        <img src={background} className={css.background} />
        <div className={css.favIcon}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
          >
            <path
              d="M1.67344 10.5615L8.02617 16.4924C8.28984 16.7384 8.63789 16.8756 9 16.8756C9.36211 16.8756 9.71016 16.7384 9.97383 16.4924L16.3266 10.5615C17.3953 9.56657 18 8.17087 18 6.71188V6.50798C18 4.05055 16.2246 1.95524 13.8023 1.55095C12.1992 1.28376 10.568 1.80759 9.42188 2.95368L9 3.37555L8.57812 2.95368C7.43203 1.80759 5.80078 1.28376 4.19766 1.55095C1.77539 1.95524 0 4.05055 0 6.50798V6.71188C0 8.17087 0.604687 9.56657 1.67344 10.5615Z"
              fill="#06C167"
            />
          </svg>
        </div>
        <div className={css.locationBox}>
          <div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="9"
              height="11"
              viewBox="0 0 9 11"
              fill="none"
            >
              <g clipPath="url(#clip0_72_1468)">
                <path
                  d="M5.05547 10.725C6.25781 9.3457 9 6.00274 9 4.125C9 1.84766 6.98438 0 4.5 0C2.01562 0 0 1.84766 0 4.125C0 6.00274 2.74219 9.3457 3.94453 10.725C4.23281 11.0537 4.76719 11.0537 5.05547 10.725ZM4.5 2.75C4.89782 2.75 5.27936 2.89487 5.56066 3.15273C5.84196 3.41059 6 3.76033 6 4.125C6 4.48967 5.84196 4.83941 5.56066 5.09727C5.27936 5.35513 4.89782 5.5 4.5 5.5C4.10218 5.5 3.72064 5.35513 3.43934 5.09727C3.15804 4.83941 3 4.48967 3 4.125C3 3.76033 3.15804 3.41059 3.43934 3.15273C3.72064 2.89487 4.10218 2.75 4.5 2.75Z"
                  fill="#227667"
                />
              </g>
              <defs>
                <clipPath id="clip0_72_1468">
                  <rect width="9" height="11" fill="white" />
                </clipPath>
              </defs>
            </svg>
          </div>
          <div>{location}</div>
        </div>
      </div>

      <div className={css.bottomContainer}>
        <div className={css.title}>{title}</div>
        <div className={css.comment}>{comment}</div>
        <div className={css.price}>{price}</div>
      </div>
    </div>
  );
};

FavouriteCard.defaultProps = {
  title: null,
  comment: null,
  price: null,
  location: null,
  background: null,
};

FavouriteCard.propTypes = {
  title: string,
  comment: string,
  price: string,
  location: string,
  background: string,
};

export default FavouriteCard;
