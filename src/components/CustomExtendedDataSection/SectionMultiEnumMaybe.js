import React from 'react';
import { Heading, PropertyGroup } from '../../components';

import css from './CustomExtendedDataSection.module.css';

const SectionMultiEnumMaybe = props => {
  const { heading, options, selectedOptions, idPrefix, showUnselectedOptions = true } = props;
  const hasContent = showUnselectedOptions || selectedOptions?.length > 0;
  if (!heading || !options || !hasContent) {
    return null;
  }
  const idSlug = heading.toLowerCase().replace(/ /g, '_');

  return (
    <section className={css.sectionMultiEnum}>
      <Heading as="h2" rootClassName={css.sectionHeading}>
        {heading}
      </Heading>
      <PropertyGroup
        id={`${idPrefix}.${idSlug}`}
        ariaLabel={heading}
        options={options}
        selectedOptions={selectedOptions}
        twoColumns={options.length > 5}
        showUnselectedOptions={showUnselectedOptions}
      />
    </section>
  );
};

export default SectionMultiEnumMaybe;
