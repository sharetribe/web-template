import React from 'react';
import css from './ProductCard.module.css';

const ProductCard = props => {
  const {
    image,
    title,
    price,
    originalPrice,
    location,
    actionText,
    actionIcon,
    className
  } = props;

  const shieldIcon = (
    <svg style={{fill:"transparent"}}  width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#a)">
        <path
          d="M11.667 7.583c0 2.917-2.042 4.375-4.469 5.221a.58.58 0 0 1-.39-.006c-2.433-.84-4.475-2.298-4.475-5.215V3.5a.583.583 0 0 1 .584-.583c1.166 0 2.625-.7 3.64-1.587a.68.68 0 0 1 .886 0c1.021.893 2.474 1.587 3.64 1.587a.583.583 0 0 1 .584.583z"
          stroke="#4a90e2"
          strokeWidth="1.167"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="a">
          <path fill="#fff" d="M0 0h14v14H0z" />
        </clipPath>
      </defs>
    </svg>
  );

  return (
    <div className={css.card}>
      <div className={css.imageContainer}>
        <img src={image} alt={title} className={css.image} />
      </div>
      <div className={css.content}>
        <div className={css.header}>
          <h3 className={css.title}>{title}</h3>
          <div className={css.priceContainer}>
            {originalPrice && <span className={css.originalPrice}>{originalPrice}</span>}
            <span className={css.price}>{price}</span>
          </div>
        </div>
        <p className={css.location}>{location}</p>
        <div className={css.actionButton}>
          <span className={css.actionIcon}>{shieldIcon}</span>
          <span>{actionText}</span>
          <span className={css.dropdownArrow}>
            <svg style={{fill:"transparent"}} width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3.5 5.25L7 8.75L10.5 5.25" stroke="#444444" style={{stroke:"#444444",stroke:"color(display-p3 0.2667 0.2667 0.2667)",strokeOpacity:1}} stroke-width="1.16667" stroke-linecap="round" stroke-linejoin="round" />
            </svg>

          </span>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
