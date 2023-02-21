import React from 'react';
import { Heading, PropertyGroup } from '../../components';

import css from './ListingPage.module.css';

const SectionMultiEnumMaybe = props => {
  const { heading, options, selectedOptions } = props;
  if (!heading || !options || !selectedOptions) {
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
      />
    </div>
  );
};

export default SectionMultiEnumMaybe;
