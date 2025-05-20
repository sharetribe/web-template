import React, { useEffect, useState } from 'react';
import classNames from 'classnames';

import { FormattedMessage } from '../../util/reactIntl';
import { ResponsiveImage, Modal } from '../../components';

import ImageCarousel from './ImageCarousel/ImageCarousel';
import ActionBarMaybe from './ActionBarMaybe';

import css from './ListingPage.module.css';

const SectionHero = props => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    title,
    listing,
    isOwnListing,
    editParams,
    currentUser,
    handleViewPhotosClick,
    imageCarouselOpen,
    onImageCarouselClose,
    onManageDisableScrolling,
    noPayoutDetailsSetWithOwnListing,
    onToggleFavorites,
  } = props;

  const [showToast, setShowToast] = useState(false);

  const hasImages = listing.images && listing.images.length > 0;
  const firstImage = hasImages ? listing.images[0] : null;
  const variants = firstImage
    ? Object.keys(firstImage?.attributes?.variants).filter(k => k.startsWith('scaled'))
    : [];

  const viewPhotosButton = hasImages ? (
    <button className={css.viewPhotos} onClick={handleViewPhotosClick}>
      <FormattedMessage
        id="ListingPage.viewImagesButton"
        values={{ count: listing.images.length }}
      />
    </button>
  ) : null;

  const HeartIcon = ({ filled }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      style={{
        height: '28px',
        width: '28px',
        marginLeft: '0px',
        marginTop: '-3px',
        verticalAlign: 'middle',
        fill: filled ? 'red' : 'none',
        stroke: filled ? 'none' : 'black',
        strokeWidth: 1,
        transition: 'all 0.2s ease',
      }}
    >
      <path d={
        filled
          ? "M12.1 8.64l-.1.1-.11-.1C10.14 6.6 7.4 6.6 5.5 8.5 \
              c-1.9 1.9-1.9 4.63 0 6.54l6.6 6.6 6.6-6.6 \
              c1.9-1.9 1.9-4.63 0-6.54-1.9-1.9-4.64-1.9-6.54 0z"
          : "M12.1 8.64l-.1.1-.11-.1C10.14 6.6 7.4 6.6 5.5 8.5 \
              c-1.9 1.9-1.9 4.63 0 6.54l6.6 6.6 6.6-6.6 \
              c1.9-1.9 1.9-4.63 0-6.54-1.9-1.9-4.64-1.9-6.54 0z"
      } />
    </svg>
  );
  
  const isFavorite = currentUser?.attributes.profile.privateData.favorites?.includes(
    listing.id.uuid
  );
  
  const toggleFavorites = e => {
  e.stopPropagation(); // Prevent image click
  if (typeof onToggleFavorites === 'function') {
    onToggleFavorites(isFavorite);
  }
  };

  const handleFacebookShare = () => {
    const shareUrl = window.location.href;
    const shareTitle = title || '';
    const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareTitle)}`;
    window.open(facebookShareUrl, '_blank', 'width=600,height=400');
  };

  const handleCopyUrl = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url)
      .then(() => {
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      })
      .catch(err => {
        console.error('Failed to copy URL: ', err);
      });
  };

  return (
    <section className={css.sectionHero} data-testid="hero">
      <div className={css.imageWrapperForSectionHero} onClick={handleViewPhotosClick}>
        {mounted && listing.id && isOwnListing ? (
          <div onClick={e => e.stopPropagation()} className={css.actionBarContainerForHeroLayout}>
            {noPayoutDetailsSetWithOwnListing ? (
              <ActionBarMaybe
                className={css.actionBarForHeroLayout}
                isOwnListing={isOwnListing}
                listing={listing}
                showNoPayoutDetailsSet={noPayoutDetailsSetWithOwnListing}
                currentUser={currentUser}
              />
            ) : null}

            <ActionBarMaybe
              className={css.actionBarForHeroLayout}
              isOwnListing={isOwnListing}
              listing={listing}
              editParams={editParams}
              currentUser={currentUser}
            />
          </div>
        ) : null}

        <ResponsiveImage
          rootClassName={css.rootForImage}
          alt={title}
          image={firstImage}
          variants={variants}
        />
        {viewPhotosButton}

        <button
          className={css.facebookShareButton}
          onClick={e => {
            e.stopPropagation();
            handleFacebookShare();
          }}
          aria-label="Share on Facebook"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <path fill="#1877F2" d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
          </svg>
        </button>

        <button
          className={css.favoriteShareButton} // <- Use same base style as facebook button
          onClick={toggleFavorites}
          aria-label="Favorite listing"
        >
          <HeartIcon filled={isFavorite} />
        </button>

        <button
          className={css.copyUrlButton}
          onClick={e => {
            e.stopPropagation();
            handleCopyUrl();
          }}
          aria-label="Copy URL"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <path fill="#555555" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
          </svg>
        </button>

        {showToast && (
          <div className={css.toast}>
            URL copied to clipboard!
          </div>
        )}
      </div>
      <Modal
        id="ListingPage.imageCarousel"
        scrollLayerClassName={css.carouselModalScrollLayer}
        containerClassName={css.carouselModalContainer}
        lightCloseButton
        isOpen={imageCarouselOpen}
        onClose={onImageCarouselClose}
        usePortal
        onManageDisableScrolling={onManageDisableScrolling}
      >
        <ImageCarousel
          images={listing.images}
          imageVariants={['scaled-small', 'scaled-medium', 'scaled-large', 'scaled-xlarge']}
        />
      </Modal>
    </section>
  );
};

export default SectionHero;
