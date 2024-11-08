import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
import DynamicLoader from './DynamicLoader.js';
import { IconSpinner, LayoutComposer } from '../../components/index.js';
import TopbarContainer from '../TopbarContainer/TopbarContainer.js';
import FooterContainer from '../FooterContainer/FooterContainer.js';
import LandingPageSection from '../../components/LandingPageSection/LandingPageSection.js';
import Newsletter from '../../components/Newsletter/Newsletter.js';
import Counter from '../../components/Counter/Counter.js';
import ToDo from '../../components/ToDo/ToDo.js';
import { validProps } from './Field';

import SectionBuilder from './SectionBuilder/SectionBuilder.js';
import StaticPage from './StaticPage.js';

import css from './PageBuilder.module.css';

const getMetadata = (meta, schemaType, fieldOptions) => {
  const { pageTitle, pageDescription, socialSharing } = meta;

  // pageTitle is used for <title> tag in addition to page schema for SEO
  const title = validProps(pageTitle, fieldOptions)?.content;
  // pageDescription is used for different <meta> tags in addition to page schema for SEO
  const description = validProps(pageDescription, fieldOptions)?.content;
  // Data used when the page is shared in social media services
  const openGraph = validProps(socialSharing, fieldOptions);
  // We add OpenGraph image as schema image if it exists.
  const schemaImage = openGraph?.images1200?.[0]?.url;
  const schemaImageMaybe = schemaImage ? { image: [schemaImage] } : {};
  const isArticle = ['Article', 'NewsArticle', 'TechArticle'].includes(schemaType);
  const schemaHeadlineMaybe = isArticle ? { headline: title } : {};

  // Schema for search engines (helps them to understand what this page is about)
  // http://schema.org (This template uses JSON-LD format)
  //
  // In addition to this schema data for search engines, src/components/Page/Page.js adds some extra schemas
  // Read more about schema:
  // - https://schema.org/
  // - https://developers.google.com/search/docs/advanced/structured-data/intro-structured-data
  const pageSchemaForSEO = {
    '@context': 'http://schema.org',
    '@type': schemaType || 'WebPage',
    description,
    name: title,
    ...schemaHeadlineMaybe,
    ...schemaImageMaybe,
  };

  return {
    title,
    description,
    schema: pageSchemaForSEO,
    socialSharing: openGraph,
  };
};

function LoadingSpinner() {
  return (
    <div className={css.loading}>
      <IconSpinner delay={600} />
    </div>
  );
}
/// ///////////////
// Page Builder //
/// ///////////////

/**
 * PageBuilder can be used to build content pages using page-asset.json.
 *
 * Note: props can include a lot of things that depend on
 * - pageAssetsData: json asset that contains instructions how to build the page content
 *   - asset should contain an array of _sections_, which might contain _fields_ and an array of _blocks_
 *     - _blocks_ can also contain _fields_
 * - fallbackPage: component. If asset loading fails, this is used instead.
 * - options: extra mapping of 3 level of sub components
 *   - sectionComponents: { ['my-section-type']: { component: MySection } }
 *   - blockComponents: { ['my-component-type']: { component: MyBlock } }
 *   - fieldComponents: { ['my-field-type']: { component: MyField, pickValidProps: data => Number.isInteger(data.content) ? { content: data.content } : {} }
 *     - fields have this pickValidProps as an extra requirement for data validation.
 * - pageProps: props that are passed to src/components/Page/Page.js component
 *
 * @param {Object} props
 * @returns page component
 */
function PageBuilder(props) {
  const {
    pageAssetsData,
    inProgress,
    error,
    fallbackPage,
    schemaType,
    options,
    isLandingPage,
    pageId,
    currentPage,
    ...pageProps
  } = props;

  if (!pageAssetsData && fallbackPage && !inProgress && error) {
    return fallbackPage;
  }
  const isAbout = pageId === 'about';
  const isTeamBuilding = pageId === 'teambuilding';
  const isPadma = pageId === 'padma';

  useEffect(() => {
    if (isPadma) {
      window.location.href = 'https://www.clubjoy.it/u/668fb70a-dd46-44f6-94f0-eea88dd089a5';
    }
  }, [isPadma]);

  if (isPadma) {
    return null;
  }

  const { sections = [], meta = {} } = pageAssetsData || {};
  const pageMetaProps = getMetadata(meta, schemaType, options?.fieldComponents);

  const layoutAreas = `
    topbar
    main
    footer
  `;

  const [searchParams, setSearchParams] = useState({});
  const [offset, setOffset] = useState(0);

  const desktopClassName = classNames({
    [css.desktopTopbarLandingPage]: isLandingPage && offset <= 50,
    [css.desktopTopbarLandingPageWithScroll]: isLandingPage && offset >= 50,
    [css.desktopTopbar]: !isLandingPage,
  });

  const handleSearchSubmit = (params) => {
    setSearchParams(params);
  };

  useEffect(() => {
    if (window) {
      const handleScroll = () => {
        setOffset(window.scrollY);
      };
      window.addEventListener('scroll', handleScroll);
      return () => {
        window.removeEventListener('scroll', handleScroll);
      };
    }
  }, []);

  return (
    <StaticPage {...pageMetaProps} {...pageProps}>
      <LayoutComposer areas={layoutAreas} className={css.layout}>
        {(props) => {
          const { Topbar, Main, Footer } = props;
          return (
            <>
              <Topbar as="header" className={css.topbar}>
                <TopbarContainer currentPage={currentPage} />
              </Topbar>
              <Main as="main" className={css.main}>
                {DynamicLoader(pageId, {}) || (
                  <>
                    {sections.length === 0 && inProgress ? (
                      <LoadingSpinner />
                    ) : (
                      <div className={css.mainContentContainer}>
                        {isAbout ? (
                          <div style={{ marginTop: '30px' }}>
                            <SectionBuilder sections={sections} options={options} />
                          </div>
                        ) : isLandingPage ? (
                          <>
                            <LandingPageSection onSearchSubmit={handleSearchSubmit} />
                            <ToDo />
                            <Counter />
                            <SectionBuilder sections={sections} options={options} />
                            <Newsletter />
                          </>
                        ) : isTeamBuilding ? (
                          <>
                            <LandingPageSection
                              onSearchSubmit={handleSearchSubmit}
                              isTeamBuilding={isTeamBuilding}
                            />
                            <SectionBuilder sections={sections} options={options} />
                            <div className={css.subContainerWrapper}>
                              <div className={css.subContainer}>
                                <div>
                                  <div className={css.header}>Prenota online</div>
                                  <div>senza dover aspettare preventivi</div>
                                </div>
                                <div>
                                  <div className={css.header}>Cancella gratuitemente</div>
                                  <div>fino a 5 giorni dall'evento</div>
                                </div>
                                <div>
                                  <div className={css.header}>Supporto 24/24h</div>
                                  <div>comodamente su whatsapp</div>
                                </div>
                              </div>
                            </div>
                            <Newsletter />
                          </>
                        ) : (
                          <SectionBuilder sections={sections} options={options} />
                        )}
                      </div>
                    )}
                  </>
                )}
              </Main>
              <Footer>
                <FooterContainer />
              </Footer>
            </>
          );
        }}
      </LayoutComposer>
    </StaticPage>
  );
}

export { LayoutComposer, StaticPage, SectionBuilder };

export default PageBuilder;
