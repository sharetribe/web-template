import React from 'react';
import { arrayOf, bool, func, node, number, object, shape, string } from 'prop-types';
import classNames from 'classnames';
import {Logo} from '../../../../components';

import Field, { hasDataInFields } from '../../Field';
import BlockBuilder from '../../BlockBuilder';

import SectionContainer from '../SectionContainer';
import css from './SectionFooter.module.css';
import { ExternalLink, NamedLink } from '../../../../components';

// The number of columns (numberOfColumns) affects styling

const GRID_CONFIG = [
  { contentCss: css.contentCol1, gridCss: css.gridCol1 },
  { contentCss: css.contentCol2, gridCss: css.gridCol2 },
  { contentCss: css.contentCol3, gridCss: css.gridCol3 },
  { contentCss: css.contentCol4, gridCss: css.gridCol4 },
]

const getIndex = numberOfColumns => numberOfColumns - 1;

const getContentCss = numberOfColumns => {
  const contentConfig = GRID_CONFIG[getIndex(numberOfColumns)];
  return contentConfig ? contentConfig.contentCss : GRID_CONFIG[0].contentCss;
}

const getGridCss = numberOfColumns => {
  const contentConfig = GRID_CONFIG[getIndex(numberOfColumns)];
  return contentConfig ? contentConfig.gridCss : GRID_CONFIG[0].gridCss;
}

// Section component that's able to show blocks in multiple different columns (defined by "numberOfColumns" prop)
const SectionFooter = props => {
  const {
    sectionId,
    className,
    rootClassName,
    numberOfColumns,
    socialMediaLinks,
    slogan,
    appearance,
    copyright,
    blocks,
    options,
  } = props;

  // If external mapping has been included for fields
  // E.g. { h1: { component: MyAwesomeHeader } }
  const fieldComponents = options?.fieldComponents;
  const fieldOptions = { fieldComponents };

  const showSocialMediaLinks = socialMediaLinks?.length > 0;

  // use block builder instead of mapping blocks manually

  return (
    <footer>
    <SectionContainer
      id={sectionId}
      className={className}
      rootClassName={rootClassName}
      appearance={appearance}
      options={fieldOptions}
    >
      <div className={css.footer}>
        <div className={classNames(css.content, getContentCss(numberOfColumns))}>
        <div className={css.detailsInfo}>
            <NamedLink name="LandingPage" className={css.logoLink}>
                <Logo format="desktop" className={css.logo} />
              </NamedLink>
              <Field data={slogan}/>
          </div>
          <div className={css.socialInfo}>
            <div className={css.icons}>
              {showSocialMediaLinks ? socialMediaLinks.map(l => (
                <ExternalLink key={l.url} href={l.url} className={css.icon} >{l.iconLetter}</ExternalLink>
                )) : null}
            </div>
            <Field data={copyright} />
          </div>
          <div className={classNames(css.grid, getGridCss(numberOfColumns))}>
            <BlockBuilder
              blocks={blocks}
            />
          </div>
        </div>
      </div>
    </SectionContainer>
    </footer>
  );
};

const propTypeOption = shape({
  fieldComponents: shape({ component: node, pickValidProps: func }),
});

SectionFooter.defaultProps = {
  className: null,
  rootClassName: null,
  defaultClasses: null,
  textClassName: null,
  numberOfColumns: 1,
  title: null,
  description: null,
  appearance: null,
  callToAction: null,
  blocks: [],
  isInsideContainer: false,
  options: null,
};

SectionFooter.propTypes = {
  sectionId: string.isRequired,
  className: string,
  rootClassName: string,
  defaultClasses: shape({
    sectionDetails: string,
    title: string,
    description: string,
    ctaButton: string,
  }),
  numberOfColumns: number,
  title: object,
  description: object,
  appearance: object,
  callToAction: object,
  blocks: arrayOf(object),
  isInsideContainer: bool,
  options: propTypeOption,
};

export default SectionFooter;