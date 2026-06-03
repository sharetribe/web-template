import React from 'react';
import classNames from 'classnames';
import { NamedLink } from '../../components';
import css from './AVUserCard.module.css';

/**
 * AVUserCard
 *
 * Carousel card for a marketplace user.
 * Links to the user's public profile page (/u/:id).
 *
 * Display name priority: overrideTitle → publicData.storeName → profile.displayName
 * Image priority: overrideMedia (CMS block image) → profile image
 *
 * @param {Object}  props.user          - denormalised user entity from marketplaceData
 * @param {string?} props.overrideTitle - display name from CMS block title
 * @param {Object?} props.overrideMedia - CMS image asset object from block media
 * @param {string?} props.className
 */
const AVUserCard = props => {
  const { user, overrideTitle, overrideMedia, className } = props;

  const userId = user?.id?.uuid;
  const profile = user?.attributes?.profile || {};
  const storeName = profile.publicData?.storeName || null;
  const displayName = profile.displayName || '';

  const resolvedName = overrideTitle || storeName || displayName;

  // Image from CMS block media (same structure as AVCategoryCard)
  const mediaVariants = overrideMedia?.image?.attributes?.variants || {};
  const mediaUrl =
    (
      mediaVariants['original800'] ||
      mediaVariants['original400'] ||
      mediaVariants['original1200'] ||
      Object.values(mediaVariants)[0]
    )?.url || null;

  // Fallback: profile image from SDK
  const profileVariants = user?.profileImage?.attributes?.variants || {};
  const profileUrl =
    profileVariants['square-small2x']?.url || profileVariants['square-small']?.url || null;

  const imageUrl = mediaUrl || profileUrl;

  if (!userId) return null;

  return (
    <NamedLink
      name="ProfilePage"
      params={{ id: userId }}
      className={classNames(css.root, className)}
    >
      <div className={css.imageWrapper}>
        {imageUrl ? (
          <img src={imageUrl} alt={resolvedName} className={css.image} />
        ) : (
          <div className={css.imagePlaceholder}>
            <span className={css.initials}>{resolvedName.charAt(0).toUpperCase()}</span>
          </div>
        )}
        <div className={css.nameWrapper}>
          <span className={css.name}>{resolvedName}</span>
        </div>
      </div>
    </NamedLink>
  );
};

export default AVUserCard;
