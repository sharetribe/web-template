import React from 'react';
import { useConfiguration } from '../../context/configurationContext';
import loadable from '@loadable/component';

const SectionBuilder = loadable(() => import ('../PageBuilder/PageBuilder'), {
  resolveComponent: (components) => components.SectionBuilder,
})

const FooterContainer = () => {
  const { footer } = useConfiguration();

  // The footer asset does not specify sectionId or sectionType. However, the SectionBuilder
  // expects sectionId and sectionType in order to identify the section. I suggest that we
  // add those attributes here before passing the asset to SectionBuilder.
  const footerSection = {
    ...footer,
    sectionId: 'footer',
    sectionType: 'footer',
  };

  return <SectionBuilder sections={[footerSection]} />;
};

export default FooterContainer;
