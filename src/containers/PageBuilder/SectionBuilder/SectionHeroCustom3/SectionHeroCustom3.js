import React from 'react';
import classNames from 'classnames';
import { useIntl } from 'react-intl';

import Field from '../../Field';

import css from './SectionHeroCustom3.module.css';

const getImageUrl = media => {
  const variants = media?.image?.attributes?.variants || {};
  return (
    variants['original2400'] ||
    variants['original1200'] ||
    variants['original800'] ||
    variants['original400'] ||
    Object.values(variants)[0]
  )?.url || null;
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
 *   - media      → background image
 *   - title      → heading field
 *   - text       → paragraph/markdown field
 *   - callToAction → CTA button
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
  const {
    sectionId,
    className,
    rootClassName,
    defaultClasses,
    blocks = [],
    cta1Style,
    cta2Style,
    options,
  } = props;

  if (!blocks.length) return null;

  const intl = useIntl();
  const bgLinkKeys = [
    intl.formatMessage({ id: `AVHero2.${sectionId}.bgLink`, defaultMessage: '' }),
    intl.formatMessage({ id: `AVHero2.${sectionId}.bgLink2`, defaultMessage: '' }),
  ].map(v => (v && v !== '#' ? v : null));

  const fieldComponents = options?.fieldComponents;
  const fieldOptions = { fieldComponents };

  const styleClassMap = {
    primary: defaultClasses?.ctaButtonPrimary,
    secondary: defaultClasses?.ctaButtonSecondary,
    blue: defaultClasses?.ctaButtonBlue,
    lightBlue: defaultClasses?.ctaButtonLightBlue,
    purple: defaultClasses?.ctaButtonPurple,
    pink: defaultClasses?.ctaButtonPink,
    yellow: defaultClasses?.ctaButtonYellow,
    roundedFull: defaultClasses?.roundedFull,
    rounded: defaultClasses?.rounded,
    square: defaultClasses?.square,
    dashed: defaultClasses?.dashed,
    solid: defaultClasses?.solid,
    noOutline: defaultClasses?.noOutline,
    headingFont: defaultClasses?.headingFont,
    bodyFont: defaultClasses?.bodyFont,
    accentFont: css.accentFont,
  };
  const resolveCtaClass = style =>
    classNames((style || '').trim().split(/\s+/).map(t => styleClassMap[t]).filter(Boolean)) ||
    defaultClasses?.ctaButtonPrimary;
  const ctaStyles = [resolveCtaClass(cta1Style), resolveCtaClass(cta2Style)];

  const halves = blocks.slice(0, 2);

  return (
    <section
      id={sectionId}
      className={classNames(rootClassName || css.root, className)}
    >
      {halves.map((block, i) => {
        const imageUrl = getImageUrl(block.media);
        const bgLink = bgLinkKeys[i];
        const HalfTag = bgLink ? 'a' : 'div';
        return (
          <HalfTag
            key={block.blockId || block.blockName || i}
            href={bgLink || undefined}
            className={classNames(css.half, imageUrl ? css.hasBg : '', bgLink ? css.halfLinked : '')}
            style={imageUrl ? { backgroundImage: `url("${imageUrl}")` } : undefined}
          >
            <div className={classNames(css.content, alignmentClass(block.alignment))}>
              <Field data={block.title} options={fieldOptions} />
              <Field data={block.text} options={fieldOptions} />
              {block.callToAction ? (
                <Field
                  data={block.callToAction}
                  className={ctaStyles[i]}
                  options={fieldOptions}
                />
              ) : null}
            </div>
          </HalfTag>
        );
      })}
    </section>
  );
};

export default SectionHeroCustom3;
