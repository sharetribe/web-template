import React from 'react';
import { Heading, PropertyGroup } from '../../components';

import css from './ProfilePage.module.css';

const SectionMultiEnumMaybe = props => {
  const { heading, options, selectedOptions, showUnselectedOptions = true } = props;
  const hasContent = showUnselectedOptions || selectedOptions?.length > 0;
  if (!heading || !options || !hasContent) {
    return null;
  }
  const idSlug = heading.toLowerCase().replace(/ /g, '_');

  return (
    <div className={css.sectionMultiEnum}>
      <Heading as="h2" rootClassName={css.sectionHeading}>
        {heading}
      </Heading>
      <PropertyGroup
        id={`ProfilePage.${idSlug}`}
        ariaLabel={heading}
        options={options}
        selectedOptions={selectedOptions}
        twoColumns={options.length > 5}
        showUnselectedOptions={showUnselectedOptions}
      />
    </div>
  );
};

export default SectionMultiEnumMaybe;
