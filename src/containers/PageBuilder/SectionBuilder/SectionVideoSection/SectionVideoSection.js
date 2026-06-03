import React from 'react';
import classNames from 'classnames';

import Field, { hasDataInFields } from '../../Field';

import css from './SectionVideoSection.module.css';

/**
 * Full-width section split in two equal halves.
 * Left half: autoplay background video (URL from translation key AVVideo.<id>.videoUrl).
 * Right half: title, description and callToAction from the CMS section config.
 * On mobile the two halves stack vertically (video on top).
 *
 * Use sectionId prefix "av-video-<id>" to identify instances.
 *
 * @component
 * @param {Object} props
 * @param {string} props.sectionId
 * @param {string?} props.className
 * @param {string?} props.rootClassName
 * @param {Object} props.defaultClasses - shared button/text classes from SectionBuilder
 * @param {Object?} props.title
 * @param {Object?} props.description
 * @param {Object?} props.callToAction
 * @param {string?} props.videoUrl - autoplay video URL (from translations)
 * @param {Object} props.options
 * @returns {JSX.Element}
 */
const SectionVideoSection = props => {
  const {
    sectionId,
    className,
    rootClassName,
    defaultClasses,
    title,
    description,
    callToAction,
    videoUrl,
    options,
    customOption = {},
  } = props;

  const fieldComponents = options?.fieldComponents;
  const fieldOptions = { fieldComponents };

  const hasContent = hasDataInFields([title, description, callToAction], fieldOptions);

  const ctaClass = defaultClasses?.ctaButtonPrimary || defaultClasses?.ctaButton || '';

  const rootClass = classNames(
    rootClassName || css.root,
    className,
    customOption.isFullH ? css.rootFullH : null
  );

  const titleClass = classNames(
    css.title,
    customOption.isSmallerT || customOption.isMediumT ? css.titleSmall : null,
    customOption.isBlueTitle ? css.titleBlue : null
  );

  const descriptionClass = classNames(
    css.description,
    customOption.hasTextGray ? css.descriptionGray : null
  );

  const contentPaneClass = classNames(
    css.contentPane,
    !videoUrl ? css.fullWidth : null,
    customOption.hasPaddings ? css.contentPanePadded : null,
    customOption.isCenterTitleText ? css.contentPaneCentered : null
  );

  return (
    <section id={sectionId} className={rootClass}>
      {videoUrl ? (
        <div className={css.videoPane}>
          <video className={css.video} autoPlay muted loop playsInline>
            <source src={videoUrl} type="video/mp4" />
          </video>
        </div>
      ) : null}

      {hasContent ? (
        <div className={contentPaneClass}>
          <Field data={title} className={titleClass} options={fieldOptions} />
          <Field data={description} className={descriptionClass} options={fieldOptions} />
          <Field data={callToAction} className={ctaClass} options={fieldOptions} />
        </div>
      ) : null}
    </section>
  );
};

export default SectionVideoSection;
