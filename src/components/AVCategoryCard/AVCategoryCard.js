import React from 'react';
import classNames from 'classnames';
import { NamedLink, ResponsiveImage } from '../../components';
import css from './AVCategoryCard.module.css';

// Variants ordered smallest → largest so ResponsiveImage builds a srcSet that
// browsers can pick from. CMS image assets expose these `original*` keys.
const IMAGE_VARIANTS = ['original400', 'original800', 'original1200', 'original2400'];

// Format slug as sentence case (Spanish convention for category labels):
// only the first word is capitalized; everything else stays lowercase.
// Callers should prefer passing the `name` prop to override this fallback.
const formatCategoryName = id => {
  const lower = (id || '').replace(/-/g, ' ').toLowerCase().trim();
  return lower ? lower.charAt(0).toUpperCase() + lower.slice(1) : '';
};

/**
 * AVCategoryCard
 *
 * Simple card showing a category image with the category name overlaid at the bottom.
 * Links to the search page filtered by categoryLevel1.
 *
 * @component
 * @param {Object} props
 * @param {string} props.categoryId  - e.g. "blazers" — used for the search link and fallback name
 * @param {string?} props.name       - display name override (from block title)
 * @param {Object?} props.media      - CMS image asset: { fieldType:'image', alt, image: { attributes: { variants } } }
 * @param {string?} props.className
 */
const AVCategoryCard = props => {
  const { categoryId, name, media, className } = props;

  const image = media?.image;
  const hasImage = !!image?.attributes?.variants;
  const alt = media?.alt || name || formatCategoryName(categoryId);
  const displayName = name || formatCategoryName(categoryId);

  return (
    <NamedLink
      name="SearchPage"
      to={{ search: `?pub_categoryLevel1=${categoryId}` }}
      className={classNames(css.root, className)}
    >
      <div className={css.imageWrapper}>
        {hasImage ? (
          <ResponsiveImage
            className={css.image}
            alt={alt}
            image={image}
            variants={IMAGE_VARIANTS}
            sizes="(max-width: 767px) 50vw, 25vw"
          />
        ) : (
          <div className={css.imagePlaceholder} />
        )}
        <div className={css.overlay}>
          <span className={css.name}>{displayName}</span>
        </div>
      </div>
    </NamedLink>
  );
};

export default React.memo(AVCategoryCard);
