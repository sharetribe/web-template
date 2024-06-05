import React from 'react';
import { Heading, PropertyGroup } from '../../components';

import css from './ListingPage.module.css';

const SectionMultiEnumMaybe = props => {
  const { heading, options, selectedOptions, showUnselectedOptions = true } = props;
  const hasContent = showUnselectedOptions || selectedOptions?.length > 0;
  if (!heading || !options || !hasContent) {
    return null;
  }

  return (
    <section className={css.sectionMultiEnum}>
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
    </section>
  );
};

export default SectionMultiEnumMaybe;
