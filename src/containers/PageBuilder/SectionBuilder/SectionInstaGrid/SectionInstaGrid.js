import React, { useState, useEffect } from 'react';
import classNames from 'classnames';
import Field from '../../Field';
import useDebouncedWindowResize from '../../../../hooks/useDebouncedWindowResize';
import css from './SectionInstaGrid.module.css';

const getColumns = () => {
  if (typeof window === 'undefined') return 6;
  const w = window.innerWidth;
  if (w < 550) return 2;
  if (w < 768) return 3;
  if (w < 1024) return 4;
  return 6;
};

const getImageUrl = (media, preferSmall = false) => {
  const variants = media?.image?.attributes?.variants || {};
  if (preferSmall) {
    return (
      variants['scaled-medium'] ||
      variants['original400'] ||
      variants['original800'] ||
      Object.values(variants)[0]
    )?.url || null;
  }
  return (
    variants['original2400'] ||
    variants['original1200'] ||
    variants['original800'] ||
    variants['original400'] ||
    Object.values(variants)[0]
  )?.url || null;
};

const InstaIcon = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
  </svg>
);

const PostModal = ({ block, username, onClose, fieldOptions }) => {
  const imageUrl = getImageUrl(block.media);

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    // Prevent body scroll while modal is open
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      className={css.modalOverlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Instagram post"
    >
      <div className={css.modal} onClick={e => e.stopPropagation()}>
        {/* Left: post image */}
        <div
          className={css.modalImage}
          style={imageUrl ? { backgroundImage: `url("${imageUrl}")` } : undefined}
        />

        {/* Right: post details */}
        <div className={css.modalBody}>
          <div className={css.modalHeader}>
            <InstaIcon size={24} />
            <span className={css.modalUsername}>{username || 'archivovintach'}</span>
            <button className={css.modalClose} onClick={onClose} aria-label="Close post">
              ×
            </button>
          </div>
          <hr className={css.modalDivider} />
          <div className={css.modalCaption}>
            {block.text ? (
              <Field data={block.text} options={fieldOptions} />
            ) : null}
          </div>
          {block.callToAction ? (
            <div className={css.modalCta}>
              <Field data={block.callToAction} options={fieldOptions} />
            </div>
          ) : null}
          {block.blockName ? (
            <div className={css.modalDate}>{block.blockName}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

const SectionInstaGrid = props => {
  const {
    sectionId,
    className,
    rootClassName,
    title,
    blocks = [],
    options,
  } = props;

  const [activeBlock, setActiveBlock] = useState(null);
  const [columns, setColumns] = useState(6);
  const fieldOptions = { fieldComponents: options?.fieldComponents };
  const username = title?.content;

  useDebouncedWindowResize(() => setColumns(getColumns()));

  if (!blocks.length) return null;

  const visibleBlocks = blocks.slice(0, columns * 2);

  return (
    <section id={sectionId} className={classNames(rootClassName || css.root, className)}>
      <div className={css.grid}>
        {visibleBlocks.map((block, i) => {
          const thumb = getImageUrl(block.media, true);
          return (
            <button
              key={block.blockId || block.blockName || i}
              className={css.cell}
              onClick={() => setActiveBlock(block)}
              aria-label={`View Instagram post ${i + 1}`}
            >
              <div
                className={css.cellImage}
                style={thumb ? { backgroundImage: `url("${thumb}")` } : undefined}
              />
              <div className={css.cellOverlay}>
                <InstaIcon size={32} />
              </div>
            </button>
          );
        })}
      </div>

      {activeBlock ? (
        <PostModal
          block={activeBlock}
          username={username}
          onClose={() => setActiveBlock(null)}
          fieldOptions={fieldOptions}
        />
      ) : null}
    </section>
  );
};

export default SectionInstaGrid;
