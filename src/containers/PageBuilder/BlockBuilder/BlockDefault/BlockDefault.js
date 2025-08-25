import React, { useEffect, useState } from 'react';
import classNames from 'classnames';

import Field, { hasDataInFields } from '../../Field';
import BlockContainer from '../BlockContainer';

import css from './BlockDefault.module.css';

import sliderDefault1 from '../../../../assets/slider/slider_1.webp';
import sliderDefault2 from '../../../../assets/slider/slider_2.webp';
import sliderDefault3 from '../../../../assets/slider/slider_3.webp';
import sliderDefault4 from '../../../../assets/slider/slider_4.webp';
import sliderCss from './ImageSliderBlockComponent.module.css';

const FieldMedia = props => {
  const { className, media, sizes, options } = props;
  const hasMediaField = hasDataInFields([media], options);
  return hasMediaField ? (
    <div className={classNames(className, css.media)}>
      <Field data={media} sizes={sizes} options={options} />
    </div>
  ) : null;
};

/**
 * @typedef {Object} FieldComponentConfig
 * @property {ReactNode} component
 * @property {Function} pickValidProps
 */

/**
 * This returns a component that can render 'defaultBlock' config.
 *
 * @component
 * @param {Object} props
 * @param {string?} props.blockId id from the block config
 * @param {string} props.blockName name from the block config (not used)
 * @param {'defaultBlock'} props.blockType blockType is set to 'defaultBlock'
 * @param {string?} props.className add more style rules in addition to components own css.root
 * @param {string?} props.rootClassName overwrite components own css.root
 * @param {string?} props.className add more styles in addition to components own css.root
 * @param {string?} props.mediaClassName add styles for the block's attached media field
 * @param {string?} props.textClassName add styles for the block's attached text field
 * @param {string?} props.ctaButtonClass add styles for the block's attached CTA field
 * @param {Object?} props.title heading config for the block
 * @param {Object?} props.text content config for the block (can be markdown)
 * @param {Object?} props.callToAction call to action button (e.g. internal link config)
 * @param {string?} props.responsiveImageSizes
 * @param {Object} props.options extra options for the block component (e.g. custom fieldComponents)
 * @param {Object<string,FieldComponentConfig>?} props.options.fieldComponents Custom fieldComponents
 * @returns {JSX.Element} component that renders block type: 'defaultBlock'
 */
const BlockDefault = props => {
  const {
    blockId,
    className,
    rootClassName,
    mediaClassName,
    textClassName,
    ctaButtonClass,
    title,
    text,
    callToAction,
    media,
    responsiveImageSizes,
    options,
    alignment,
    twoButtons,
    blueCols,
    showBuyerList,
    buyerListData,
    showSellerList,
    sellerListData,
    contactButtons,
    hasFullHeightMedia,
    hasIconImg,
    hasTextGray,
    hasTextDarkGray,
    hasTextNoGap,
    hasLargeList,
    hasTextLarger,
    hasTextSmaller,
    hasShortContent,
    hasCTASecondary,
    hasCTATertiary,
    sliderImages,
    ...customProps
  } = props;
  const classes = classNames(rootClassName || css.root, className, hasLargeList ? css.reverseMediaPos : '');
  const hasTextComponentFields = hasDataInFields([title, text, callToAction], options);

  const alignmentClasses = {
    left: css.alignLeft,
    center: css.alignCenter,
    right: css.alignRight,
  };

  const alignmentClass = alignmentClasses[alignment];

  const ctaCustomClass = classNames(
    hasCTASecondary ? css.ctaSecondary
      : hasCTATertiary ? css.ctaTertiary
        : ctaButtonClass,
  );

  const textComponentsClass = classNames(
    textClassName,
    alignmentClass,
    css.text,
    hasIconImg ? css.slimContent : '',
    hasTextGray ? css.textGray : '',
    hasTextDarkGray ? css.textDarkGray : '',
    hasTextNoGap ? css.textNoGap : '',
    hasLargeList ? css.largeList : '',
    hasTextLarger ? css.textLarger : '',
    hasTextSmaller ? css.textSmaller : '',
    hasShortContent ? css.shortContent : '',
  );

  const fieldMediaClass = classNames(
    mediaClassName,
    hasIconImg ? css.iconImg : '',
    hasFullHeightMedia ? css.fullHeightMedia : '',
  );

  return (
    <BlockContainer id={blockId} className={classes}>
      {sliderImages?.length ? (
        <ImageSliderBlockComponent images={sliderImages} className={fieldMediaClass} options={options} />
      ) : <FieldMedia
        media={media}
        sizes={responsiveImageSizes}
        className={fieldMediaClass}
        options={options}
      />}
      {hasTextComponentFields ? (
        <div className={textComponentsClass}>
          {twoButtons && twoButtons.titleEyebrow ? (
            <span className={css.titleEyebrow}>{twoButtons.titleEyebrow}</span>
          ) : null}
          <Field data={title} options={options} />
          <Field data={text} options={options} />
          <Field data={callToAction} className={ctaCustomClass} options={options} />

          {showBuyerList ? (
            <ol className={css.titleList}>
             {buyerListData.map((item, index) => item.title.trim() ? (
                <li key={index}>
                  <div>
                    <h3>{item.title}</h3>
                    <div dangerouslySetInnerHTML={{ __html: item.text }}></div>
                  </div>
                </li>
              ): null)}
            </ol>
          ) : null}

          {showSellerList ? (
            <ol className={css.titleList}>
              {sellerListData.map((item, index) => item.title.trim() ? (
                <li key={index}>
                  <div>
                    <h3>{item.title}</h3>
                    <div dangerouslySetInnerHTML={{ __html: item.text }}></div>
                  </div>
                </li>
              ): null)}
            </ol>
          ) : null}

          {contactButtons ? (
            <div> 
              <div className={css.buttonWrap}>
                <Field data={contactButtons.callToAction1} className={customProps.ctaButtonPrimaryClass} options={options} />
                <Field data={contactButtons.callToAction2} className={customProps.ctaButtonSecondaryClass} options={options} />

                <a className={css.btnInstagram} href={contactButtons.social.href} target="_blank" rel="noopener">
                  <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 34 34" fill="none">
                    <path fillRule="evenodd" clipRule="evenodd" d="M22.6667 4.59473H11.3333C7.42132 4.59473 4.25 7.76605 4.25 11.6781V23.0114C4.25 26.9234 7.42132 30.0947 11.3333 30.0947H22.6667C26.5786 30.0947 29.75 26.9234 29.75 23.0114V11.6781C29.75 7.76605 26.5786 4.59473 22.6667 4.59473ZM27.2708 23.0114C27.263 25.5509 25.2062 27.6078 22.6667 27.6156H11.3333C8.79375 27.6078 6.73694 25.5509 6.72917 23.0114V11.6781C6.73694 9.13847 8.79375 7.08167 11.3333 7.07389H22.6667C25.2062 7.08167 27.263 9.13847 27.2708 11.6781V23.0114ZM23.7292 12.0322C24.5116 12.0322 25.1458 11.398 25.1458 10.6156C25.1458 9.83316 24.5116 9.19889 23.7292 9.19889C22.9467 9.19889 22.3125 9.83316 22.3125 10.6156C22.3125 11.398 22.9467 12.0322 23.7292 12.0322ZM17 10.9697C13.4792 10.9697 10.625 13.8239 10.625 17.3447C10.625 20.8656 13.4792 23.7197 17 23.7197C20.5208 23.7197 23.375 20.8656 23.375 17.3447C23.3788 15.6528 22.7083 14.0291 21.5119 12.8328C20.3156 11.6364 18.6919 10.966 17 10.9697ZM13.1042 17.3447C13.1042 19.4964 14.8484 21.2406 17 21.2406C19.1516 21.2406 20.8958 19.4964 20.8958 17.3447C20.8958 15.1931 19.1516 13.4489 17 13.4489C14.8484 13.4489 13.1042 15.1931 13.1042 17.3447Z" fill="currentColor"/>
                  </svg>
                  {contactButtons.social.content}
                </a>
              </div>
            </div>  
          ) : null}
          {blueCols ? (
            <div className={classNames(css.colWrap, css.colsSecondary)}>
              <div>
                <h3>{blueCols.col1Title}</h3>
                <p>{blueCols.col1Text}</p>
              </div>
              {blueCols.col2Title.trim() ? (
                <div>
                  <h3>{blueCols.col2Title}</h3>
                  <p>{blueCols.col2Text}</p>
                </div>
              ) : null}
              {blueCols.col3Title.trim() ? (
                <div>
                  <h3>{blueCols.col3Title}</h3>
                  <p>{blueCols.col3Text}</p>
                </div>
              ) : null}
            </div>
          ) : null}
          {twoButtons ? (
            <div className={css.buttonWrap}>
              <Field data={twoButtons.callToAction1} className={customProps.ctaButtonPrimaryClass} options={options} />
              <Field data={twoButtons.callToAction2} className={customProps.ctaButtonSecondaryClass} options={options} />
            </div>
          ) : null}
        </div>
      ) : null}
    </BlockContainer>
  );
};

export default BlockDefault;

const ImageSliderBlockComponent = props => {
  const { images } = props;
  const [index, setIndex] = useState(0);

  const defaultImages = [
    sliderDefault1,
    sliderDefault2,
    sliderDefault3,
    sliderDefault4,
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex(prev => (prev + 1) % images.length);
    }, 7000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={sliderCss.sliderWrapper}>
      {defaultImages.map((src, i) => (
        <img
          key={i}
          src={src}
          alt={`Slide ${i}`}
          className={`${sliderCss.sliderImage} ${index === i ? sliderCss.visible : ''}`}
        />
      ))}
    </div>
  );
};
