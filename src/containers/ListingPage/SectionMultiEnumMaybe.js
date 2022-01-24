import React from 'react';
import { PropertyGroup } from '../../components';

import css from './ListingPage.module.css';

const SectionMultiEnumMaybe = props => {
  const { heading, options, selectedOptions } = props;
  if (!heading || !options || !selectedOptions) {
    return null;
  }

  return (
    <div className={css.sectionMultiEnum}>
      <h2 className={css.multiEnumTitle}>{heading}</h2>
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
