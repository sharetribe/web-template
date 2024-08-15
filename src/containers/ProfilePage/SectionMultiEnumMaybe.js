import React from 'react';
import { Heading, PropertyGroup } from '../../components';

import css from './ProfilePage.module.css';

const SectionMultiEnumMaybe = props => {
  const { heading, options, selectedOptions, showUnselectedOptions = true } = props;
  const hasContent = showUnselectedOptions || selectedOptions?.length > 0;
  if (!heading || !options || !hasContent) {
    return null;
  }

  return (
    <div className={css.sectionMultiEnum}>
      <Heading as="h2" rootClassName={css.sectionHeading}>
        {heading}
      </Heading>
      <PropertyGroup
        id="ListingPage.amenities"
        options={options}
        selectedOptions={selectedOptions}
        twoColumns={options.length > 5}
        showUnselectedOptions={showUnselectedOptions}
      />
    </div>
  );
};

export default SectionMultiEnumMaybe;
