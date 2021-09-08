import React, { Component } from 'react';
import { string } from 'prop-types';
import classNames from 'classnames';

import { FormattedMessage } from '../../../util/reactIntl';
import { lazyLoadWithDimensions } from '../../../util/contextHelpers';

import { NamedLink } from '../../../components';

import css from './SectionFilteredSearches.module.css';

// Update images by saving images to src/LandingPage/SeactionFilteredSearches/images directory.
// If those images have been saved with the same name, no need to make changes to these imports.
import imageForFilter1 from './images/imageForFilter1_648x448.jpg';
import imageForFilter2 from './images/imageForFilter2_648x448.jpg';
import imageForFilter3 from './images/imageForFilter3_648x448.jpg';

// Thumbnail image for the search "card"
class ThumbnailImage extends Component {
  render() {
    const { alt, ...rest } = this.props;
    return <img alt={alt} {...rest} />;
  }
}
// Load the image only if it's close to viewport (user has scrolled the page enough).
const LazyImage = lazyLoadWithDimensions(ThumbnailImage);

// Create a "card" that contains a link to filtered search on SearchPage.
const FilterLink = props => {
  const { name, image, link } = props;
  const url = typeof window !== 'undefined' ? new window.URL(link) : new global.URL(link);
  const searchQuery = url.search;
  const nameText = <span className={css.searchName}>{name}</span>;
  return (
    <NamedLink name="SearchPage" to={{ search: searchQuery }} className={css.searchLink}>
      <div className={css.imageWrapper}>
        <div className={css.aspectWrapper}>
          <LazyImage src={image} alt={name} className={css.searchImage} />
        </div>
      </div>
      <div className={css.linkText}>
        <FormattedMessage
          id="SectionFilteredSearches.filteredSearch"
          values={{ filter: nameText }}
        />
      </div>
    </NamedLink>
  );
};

// Component that shows full-width section on LandingPage.
// Inside it shows 3 "cards" that link to SearchPage with specific filters applied.
const SectionFilteredSearches = props => {
  const { rootClassName, className } = props;
  const classes = classNames(rootClassName || css.root, className);

  // FilterLink props:
  // - "name" is a string that defines what kind of search the link is going to make
  // - "image" is imported from images directory and you can update it by changing the file
  // - "link" should be copy-pasted URL from search page.
  //    The domain doesn't matter, but search query does. (I.e. "?pub_brand=nike")
  return (
    <div className={classes}>
      <div className={css.title}>
        <FormattedMessage id="SectionFilteredSearches.title" />
      </div>
      <div className={css.filteredSearches}>
        <FilterLink
          name="Nikes"
          image={imageForFilter1}
          link="http://localhost:3000/s?pub_brand=nike"
        />
        <FilterLink
          name="Yeezys"
          image={imageForFilter2}
          link="http://localhost:3000/s?pub_brand=yeezy"
        />
        <FilterLink
          name="Converses"
          image={imageForFilter3}
          link="http://localhost:3000/s?pub_brand=converse"
        />
      </div>
    </div>
  );
};

SectionFilteredSearches.defaultProps = { rootClassName: null, className: null };

SectionFilteredSearches.propTypes = {
  rootClassName: string,
  className: string,
};

export default SectionFilteredSearches;
