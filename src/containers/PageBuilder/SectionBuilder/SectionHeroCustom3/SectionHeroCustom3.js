import React from 'react';
import classNames from 'classnames';

import Field from '../../Field';
import { sanitizeUrl } from '../../../../util/sanitize';
import { parseBlockCtaClass } from '../../../../extensions/pageBuilder/av/blocks';

import css from './SectionHeroCustom3.module.css';

const getImageUrl = media => {
  const variants = media?.image?.attributes?.variants || {};
  return (
    (
      variants['original2400'] ||
      variants['original1200'] ||
      variants['original800'] ||
      variants['original400'] ||
      Object.values(variants)[0]
    )?.url || null
  );
};

const alignmentClass = alignment => {
  if (alignment === 'center') return css.alignCenter;
  if (alignment === 'right') return css.alignRight;
  return css.alignLeft;
};

/**
 * SectionHeroCustom3 — full-width two-half hero driven by the first two CMS blocks.
 *
 * Each half renders independently using its block's:
 *   - media      → background image; its "Block image link" makes the whole panel
 *                  clickable via a stretched-link overlay (separate destination)
 *   - title      → heading field
 *   - text       → paragraph/markdown field
 *   - callToAction → CTA button with its own link (independent of the panel link)
 *   - alignment  → 'left' | 'center' | 'right' content alignment
 *
 * sectionId prefix: av-hero3-<id>
 *
 * @component
 * @param {string}  props.sectionId
 * @param {string?} props.className
 * @param {string?} props.rootClassName
 * @param {Object}  props.defaultClasses  - shared button/text classes from SectionBuilder
 * @param {Array}   props.blocks          - CMS blocks array (first two used)
 * @param {Object}  props.options
 */
const SectionHeroCustom3 = props => {
  const { sectionId, className, rootClassName, defaultClasses, blocks = [], options } = props;

  if (!blocks.length) return null;

  const fieldComponents = options?.fieldComponents;
  const fieldOptions = { fieldComponents };

  // Button styling is driven by block name tokens (e.g. "blockCtaBtnBlue :: rounded ::")
  // with a fallback to the section's primary button — which already reflects any
  // section-name CTA tokens baked into defaultClasses by SectionBuilder.
  const resolveCtaClass = block =>
    parseBlockCtaClass(block.blockName, defaultClasses) || defaultClasses?.ctaButtonPrimary;

  const halves = blocks.slice(0, 2);

  return (
    <section id={sectionId} className={classNames(rootClassName || css.root, className)}>
      {halves.map((block, i) => {
        const imageUrl = getImageUrl(block.media);
        // The whole-panel link comes from the block's "Block image link" setting
        // (block.media.link.href) — independent of the CTA button's own link.
        const bgLink = block.media?.link?.href ? sanitizeUrl(block.media.link.href) : null;
        return (
          <div
            key={block.blockId || block.blockName || i}
            className={classNames(
              css.half,
              imageUrl ? css.hasBg : '',
              bgLink ? css.halfLinked : ''
            )}
            style={imageUrl ? { backgroundImage: `url("${imageUrl}")` } : undefined}
          >
            {bgLink ? (
              // Stretched-link overlay for the "Block image link": makes the whole
              // panel clickable without nesting an <a> inside the CTA <a>. Labelled
              // by the panel title (or image alt) since it's a real, keyboard-
              // reachable link with a destination distinct from the CTA button.
              <a
                className={css.bgLinkOverlay}
                href={bgLink}
                aria-label={block.title?.content || block.media?.alt || undefined}
              />
            ) : null}
            <div
              className={classNames(
                css.content,
                alignmentClass(block.alignment),
                bgLink ? css.contentLinked : ''
              )}
            >
              <Field data={block.title} options={fieldOptions} />
              <Field data={block.text} options={fieldOptions} />
              {block.callToAction ? (
                <Field
                  data={block.callToAction}
                  className={classNames(resolveCtaClass(block), css.ctaAbove)}
                  options={fieldOptions}
                />
              ) : null}
            </div>
          </div>
        );
      })}
    </section>
  );
};

export default SectionHeroCustom3;
