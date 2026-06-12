import React from 'react';
import classNames from 'classnames';

import Field, { hasDataInFields } from '../../Field';
import { parseSectionCtaClass } from '../../../../extensions/pageBuilder/av/sectionStyles';

import AVSectionContainer from '../SectionContainer/AVSectionContainer';
import css from './SectionHeroCustom2.module.css';

/**
 * @typedef {Object} FieldComponentConfig
 * @property {ReactNode} component
 * @property {Function} pickValidProps
 */

/**
 * Multi-instance hero section (avHero2).
 * Supports 0–2 optional CTA buttons and an optional mobile background image.
 * Identify instances with sectionId prefix "av-hero2-<id>".
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className
 * @param {string?} props.rootClassName
 * @param {Object} props.defaultClasses
 * @param {string} props.sectionId
 * @param {Object?} props.title
 * @param {Object?} props.description
 * @param {Object?} props.appearance
 * @param {Object?} props.callToAction  - optional first CTA button
 * @param {Object?} props.callToAction2 - optional second CTA button
 * @param {string?} props.mobileBackgroundImageUrl - URL for mobile-only background (≤767px)
 * @param {string?} props.bgLink - makes the whole section a link; resolved by the AV transforms
 *   from `AVHero2.<id>.bgLink` ('#' or unset → null). Read here as a prop, never via intl.
 * @param {string?} props.sectionName - section name string; parsed for CTA style tokens that
 *   apply to both buttons when no explicit cta1Style/cta2Style is set.
 * @param {string?} props.classWrap - additional CSS class on the section (e.g. 'contentLeft')
 * @param {boolean?} props.isLanding
 * @param {Object} props.options
 * @returns {JSX.Element}
 */
const SectionHeroCustom2 = props => {
  const {
    sectionId,
    className,
    rootClassName,
    defaultClasses,
    title,
    description,
    appearance,
    callToAction,
    callToAction2,
    cta1Style,
    cta2Style,
    mobileBackgroundImageUrl,
    bgLink,
    sectionName,
    options,
    classWrap,
    isLanding,
    customOption,
  } = props;

  const fieldComponents = options?.fieldComponents;
  const fieldOptions = { fieldComponents };

  const hasHeaderFields = hasDataInFields(
    [title, description, callToAction, callToAction2],
    fieldOptions
  );
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
  // Explicit per-button style from cta1Style/cta2Style strings (e.g. "blue rounded").
  // Returns null when nothing maps, so the section/default fallbacks can apply.
  const explicitCtaClass = style => {
    const cls = classNames(
      (style || '')
        .trim()
        .split(/\s+/)
        .map(t => styleClassMap[t])
        .filter(Boolean)
    );
    return cls || null;
  };
  // Section Name CTA tokens (e.g. "- SectionCtaBtnBlue - Rounded") apply to both
  // buttons when no explicit per-button style is set. Falls through to the
  // primary/secondary defaults when neither is present.
  const sectionCtaClass = parseSectionCtaClass(sectionName, defaultClasses);
  const cta1Class =
    explicitCtaClass(cta1Style) || sectionCtaClass || defaultClasses?.ctaButtonPrimary;
  const cta2Class =
    explicitCtaClass(cta2Style) || sectionCtaClass || defaultClasses?.ctaButtonSecondary;

  const mobileStyle = mobileBackgroundImageUrl
    ? { '--av2-mobile-bg': `url("${mobileBackgroundImageUrl}")` }
    : undefined;

  return (
    <AVSectionContainer
      id={sectionId}
      className={classNames(
        className,
        css[classWrap] ?? '',
        mobileBackgroundImageUrl ? css.hasMobileBg : ''
      )}
      rootClassName={classNames(
        rootClassName || css.root,
        customOption?.isShortHero ? css.shortHero : ''
      )}
      appearance={appearance}
      options={fieldOptions}
      style={mobileStyle}
      bgLink={bgLink}
    >
      {hasHeaderFields ? (
        <header
          className={classNames(
            defaultClasses.sectionDetails,
            css.contentHeader,
            isLanding ? css.landingVersion : ''
          )}
        >
          <Field data={title} className={classNames(defaultClasses.title)} options={fieldOptions} />
          <Field data={description} className={defaultClasses.description} options={fieldOptions} />
          {callToAction || callToAction2 ? (
            <div className={css.buttonWrap}>
              {callToAction ? (
                <Field data={callToAction} className={cta1Class} options={fieldOptions} />
              ) : null}
              {callToAction2 ? (
                <Field data={callToAction2} className={cta2Class} options={fieldOptions} />
              ) : null}
            </div>
          ) : null}
        </header>
      ) : null}
    </AVSectionContainer>
  );
};

export default SectionHeroCustom2;
