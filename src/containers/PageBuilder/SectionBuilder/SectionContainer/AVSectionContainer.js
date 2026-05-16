import React from 'react';
import classNames from 'classnames';

import Field from '../../Field';

import upstreamCss from './SectionContainer.module.css';
import avCss from './AVSectionContainer.module.css';

/**
 * AV-owned wrapper around the upstream SectionContainer layout.
 * Handles all AV display options (customOption tokens parsed from sectionName)
 * and the bgLink overlay without touching the upstream SectionContainer files.
 *
 * Drop-in replacement for SectionContainer in any section that needs AV styling.
 * When neither customOption nor bgLink is provided it behaves identically to SectionContainer.
 *
 * @component
 * @param {string?} props.className
 * @param {string?} props.rootClassName
 * @param {string?} props.id
 * @param {string?} props.as tag/element name. Defaults to 'section'.
 * @param {ReactNode} props.children
 * @param {Object} props.appearance
 * @param {Object} props.options
 * @param {Object?} props.customOption parsed display-option flags from parseSectionCustomOptions()
 * @param {string?} props.bgLink full-section background link URL (SectionHeroCustom2)
 */
const AVSectionContainer = props => {
  const {
    className,
    rootClassName,
    id,
    as,
    children,
    appearance,
    options,
    customOption,
    bgLink,
    ...otherProps
  } = props;

  const Tag = as || 'section';
  const classes = classNames(rootClassName || upstreamCss.root, className);

  const innerCss = classNames(
    upstreamCss.sectionContent,
    customOption?.isBlueTitle ? avCss.sectionContentBlueTitle : null,
    customOption?.isCenterTitleText ? avCss.sectionContentCenterTitleText : null,
    customOption?.isWhiteTitle ? avCss.sectionContentWhiteTitle : null,
    customOption?.isSmallSubTitles ? avCss.sectionContentSmallSubTitles : null,
    customOption?.isLargeDesc ? avCss.sectionContentLargeDesc : null,
    customOption?.isCenterDescText ? avCss.sectionContentCenterDescText : null,
    customOption?.isLarge ? avCss.sectionContentLarge : null,
    customOption?.isMedium ? avCss.sectionContentMedium : null,
    customOption?.isFullH ? avCss.sectionContentFullH : null,
    customOption?.isFullW ? avCss.sectionContentFullW : null,
    customOption?.isShortC ? avCss.sectionContentShortC : null,
    customOption?.isSmallerT ? avCss.sectionContentSmallerTitle : null,
    customOption?.isMediumT ? avCss.sectionContentMediumTitle : null,
    customOption?.hasPaddings ? avCss.sectionContentHasPaddings : null,
    customOption?.hasNoPaddings ? avCss.sectionContentNoPaddings : null,
    customOption?.hasNoPaddingsX ? avCss.sectionContentNoPaddingsX : null,
    customOption?.hasNoPaddingsY ? avCss.sectionContentNoPaddingsY : null,
    customOption?.hasTextGray ? avCss.sectionContentHasTextGray : null,
    customOption?.isAvFeature ? avCss.sectionContentAvFeature : null,
    customOption?.hasStar ? avCss.starDeco : null,
    customOption?.hasStar ? (avCss[`starDeco${customOption.starDeco}`] ?? null) : null,
    as === 'footer' ? avCss.customFooter : null,
  );

  return (
    <Tag className={classes} id={id} {...otherProps}>
      {bgLink ? (
        <a href={bgLink} className={avCss.bgClickArea} aria-hidden="true" tabIndex={-1} />
      ) : null}
      {appearance?.fieldType === 'customAppearance' ? (
        <Field
          data={{ alt: `Background image for ${id}`, ...appearance }}
          className={className}
          options={options}
        />
      ) : null}
      <div className={innerCss}>{children}</div>
    </Tag>
  );
};

export default AVSectionContainer;
