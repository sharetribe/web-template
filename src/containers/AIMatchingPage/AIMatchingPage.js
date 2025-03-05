import React from 'react';
import {
  LayoutComposer, NamedRedirect,
} from '../../components';

import StaticPage from '../PageBuilder/StaticPage';
import TopbarContainer from '../TopbarContainer/TopbarContainer';
import FooterContainer from '../FooterContainer/FooterContainer';
import AIMatchingCarousel from '../../components/AIMatching/AIMatchingCarousel';

const AIMatchingPage = () => {
  const layoutAreas = `
    topbar
    main
    footer
  `;

  return (
    process.env.REACT_APP_IS_LOWER_ENV === 'true' ? (
      <StaticPage
        title="AI-Powered Instructor Matching"
        schema={{
          '@context': 'http://schema.org',
          '@type': 'AIMatchingPage',
          description: 'Use AI to find the perfect ground instructor!',
          name: 'Instructor matching page',
        }}
      >
        <LayoutComposer areas={layoutAreas}>
          {() => (
            <>
              <TopbarContainer />
              <AIMatchingCarousel />
              <FooterContainer />
            </>
          )}
        </LayoutComposer>
      </StaticPage>
    ) : (
      <NamedRedirect name="NotFoundPage" />
    )
  );
};

export default AIMatchingPage;
