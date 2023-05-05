import React from 'react';
import footerAsset from './footerasset.json';
import { SectionBuilder } from '../PageBuilder/PageBuilder';

const FooterContainer = props => {
  // TODO fetch footer asset from context
  return <SectionBuilder sections={[footerAsset]} />;
};

export default FooterContainer;
