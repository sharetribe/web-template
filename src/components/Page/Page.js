import React, { Component } from 'react';
import { any, array, arrayOf, bool, number, object, oneOfType, shape, string } from 'prop-types';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import classNames from 'classnames';

import { useConfiguration } from '../../context/configurationContext';
import { useRouteConfiguration } from '../../context/routeConfigurationContext';
import { getCustomCSSPropertiesFromConfig } from '../../util/style';
import { useIntl, intlShape } from '../../util/reactIntl';
import { metaTagProps } from '../../util/seo';
import { canonicalRoutePath } from '../../util/routes';
import { propTypes } from '../../util/types';
import { apiBaseUrl } from '../../util/api';

import css from './Page.module.css';

const preventDefault = e => {
  e.preventDefault();
};

const twitterPageURL = siteTwitterHandle => {
  if (siteTwitterHandle && siteTwitterHandle.charAt(0) === '@') {
    return `https://twitter.com/${siteTwitterHandle.substring(1)}`;
  } else if (siteTwitterHandle) {
    return `https://twitter.com/${siteTwitterHandle}`;
  }
  return null;
};

const webmanifestURL = marketplaceRootURL => {
  // Note: on localhost (when running "yarn run dev"), the webmanifest is running on apiServer port
  const baseUrl = apiBaseUrl(marketplaceRootURL);
  return `${baseUrl}/site.webmanifest`;
};

const getFaviconVariants = config => {
  // We add favicon through hosted configs
  // NOTE: There's no favicon.ico file. This is an imageAsset object which is used together with <meta> tags.
  const favicon = config.branding.favicon;
  return favicon?.type === 'imageAsset' ? Object.values(favicon.attributes.variants) : [];
};

const getAppleTouchIconURL = config => {
  // The appIcon is used to pick apple-touch-icon
  // We use 180x180. I.e. we follow the example set by realfavicongenerator
  const appIcon = config.branding.appIcon;
  const appIconVariants =
    appIcon?.type === 'imageAsset' ? Object.values(appIcon.attributes.variants) : [];
  const appleTouchIconVariant = appIconVariants.find(variant => {
    return variant.width === 180 && variant.height === 180;
  });
  return appleTouchIconVariant?.url;
};

class PageComponent extends Component {
  constructor(props) {
    super(props);
    // Keeping scrollPosition out of state reduces rendering cycles (and no bad states rendered)
    this.scrollPosition = 0;
    this.contentDiv = null;
    this.scrollingDisabledChanged = this.scrollingDisabledChanged.bind(this);
  }

  componentDidMount() {
    // By default a dropped file is loaded in the browser window as a
    // file URL. We want to prevent this since it might loose a lot of
    // data the user has typed but not yet saved. Preventing requires
    // handling both dragover and drop events.
    document.addEventListener('dragover', preventDefault);
    document.addEventListener('drop', preventDefault);

    // Remove duplicated server-side rendered page schema.
    // It's in <body> to improve initial rendering performance,
    // but after web app is initialized, react-helmet-async operates with <head>
    const pageSchema = document.getElementById('page-schema');
    if (pageSchema) {
      pageSchema.remove();
    }
  }

  componentWillUnmount() {
    document.removeEventListener('dragover', preventDefault);
    document.removeEventListener('drop', preventDefault);
  }

  scrollingDisabledChanged(currentScrollingDisabled) {
    if (currentScrollingDisabled && currentScrollingDisabled !== this.scrollingDisabled) {
      // Update current scroll position, if scrolling is disabled (e.g. modal is open)
      this.scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
      this.scrollingDisabled = currentScrollingDisabled;
    } else if (currentScrollingDisabled !== this.scrollingDisabled) {
      this.scrollingDisabled = currentScrollingDisabled;
    }
  }

  render() {
    const {
      className,
      rootClassName,
      children,
      location,
      intl,
      scrollingDisabled,
      referrer,
      author,
      openGraphType = 'website',
      description,
      facebookImages,
      published,
      schema,
      socialSharing,
      title,
      twitterHandle,
      twitterImages,
      updated,
      config,
      routeConfiguration,
    } = this.props;

    const classes = classNames(rootClassName || css.root, className, {
      [css.scrollingDisabled]: scrollingDisabled,
    });

    this.scrollingDisabledChanged(scrollingDisabled);

    const marketplaceRootURL = config.marketplaceRootURL;
    const shouldReturnPathOnly = referrer && referrer !== 'unsafe-url';
    const canonicalPath = canonicalRoutePath(routeConfiguration, location, shouldReturnPathOnly);
    const canonicalUrl = `${marketplaceRootURL}${canonicalPath}`;

    const marketplaceName = config.marketplaceName;
    const schemaTitle = intl.formatMessage({ id: 'Page.schemaTitle' }, { marketplaceName });
    const schemaDescription = intl.formatMessage({ id: 'Page.schemaDescription' });
    const pageTitle = title || schemaTitle;
    const pageDescription = description || schemaDescription;
    const {
      title: socialSharingTitle,
      description: socialSharingDescription,
      images1200: socialSharingImages1200,
      // Note: we use image with open graph's aspect ratio (1.91:1) also with Twitter
      images600: socialSharingImages600,
    } = socialSharing || {};

    // Images for social media sharing
    const defaultFacebookImageURL = config.branding.facebookImage;
    const openGraphFallbackImages = [
      {
        name: 'facebook',
        url: defaultFacebookImageURL,
        width: 1200,
        height: 630,
      },
    ];
    const defaultTwitterImageURL = config.branding.twitterImage;
    const twitterFallbackImages = [
      {
        name: 'twitter',
        url: defaultTwitterImageURL,
        width: 600,
        height: 314,
      },
    ];
    const facebookImgs = socialSharingImages1200 || facebookImages || openGraphFallbackImages;
    const twitterImgs = socialSharingImages600 || twitterImages || twitterFallbackImages;

    const metaToHead = metaTagProps(
      {
        author,
        openGraphType,
        socialSharingTitle: socialSharingTitle || pageTitle,
        socialSharingDescription: socialSharingDescription || pageDescription,
        description: pageDescription,
        facebookImages: facebookImgs,
        twitterImages: twitterImgs,
        twitterHandle,
        published,
        updated,
        url: canonicalUrl,
        locale: intl.locale,
      },
      config
    );

    const facebookPage = config.siteFacebookPage;
    const twitterPage = twitterPageURL(config.siteTwitterHandle);
    const instagramPage = config.siteInstagramPage;
    const sameOrganizationAs = [facebookPage, twitterPage, instagramPage].filter(v => v != null);

    // Schema for search engines (helps them to understand what this page is about)
    // http://schema.org
    // We are using JSON-LD format

    // Schema attribute can be either single schema object or an array of objects
    // This makes it possible to include several different items from the same page.
    // E.g. Product, Place, Video
    const hasSchema = schema != null;
    const schemaFromProps = hasSchema && Array.isArray(schema) ? schema : hasSchema ? [schema] : [];
    const addressMaybe = config.address?.streetAddress ? { address: config.address } : {};
    const schemaArrayJSONString = JSON.stringify({
      '@context': 'http://schema.org',
      '@graph': [
        ...schemaFromProps,
        {
          '@context': 'http://schema.org',
          '@type': 'Organization',
          '@id': `${marketplaceRootURL}#organization`,
          url: marketplaceRootURL,
          name: marketplaceName,
          sameAs: sameOrganizationAs,
          logo: config.branding.logoImageMobileURL,
          ...addressMaybe,
        },
        {
          '@context': 'http://schema.org',
          '@type': 'WebSite',
          url: marketplaceRootURL,
          description: schemaDescription,
          name: schemaTitle,
        },
      ],
    });

    const scrollPositionStyles = scrollingDisabled
      ? { marginTop: `${-1 * this.scrollPosition}px` }
      : {};

    // If scrolling is not disabled, but content element has still scrollPosition set
    // in style attribute, we scrollTo scrollPosition.
    const hasMarginTopStyle = this.contentDiv && this.contentDiv.style.marginTop;
    if (!scrollingDisabled && hasMarginTopStyle) {
      window.requestAnimationFrame(() => {
        window.scrollTo(0, this.scrollPosition);
      });
    }

    const faviconVariants = getFaviconVariants(config);
    const appleTouchIcon = getAppleTouchIconURL(config);

    // Marketplace color and the color for <PrimaryButton> come from configs
    // If set, we need to create those custom CSS Properties and set them for the app
    // Note: this is also set to <html> element in app.js to provide marketplace colors for modals/portals.
    const styles = getCustomCSSPropertiesFromConfig(config.branding);

    return (
      <div id="page" className={classes} style={styles}>
        <Helmet
          htmlAttributes={{
            lang: intl.locale,
          }}
        >
          <title>{pageTitle}</title>
          {referrer ? <meta name="referrer" content={referrer} /> : null}
          <link rel="canonical" href={canonicalUrl} />

          {faviconVariants.map(variant => {
            return (
              <link
                key={`icon_${variant.width}`}
                rel="icon"
                type="image/png"
                sizes={`${variant.width}x${variant.height}`}
                href={variant.url}
              />
            );
          })}

          {appleTouchIcon ? (
            <link rel="apple-touch-icon" sizes="180x180" href={appleTouchIcon} />
          ) : null}

          <link rel="manifest" href={webmanifestURL(marketplaceRootURL)} />

          <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
          <meta httpEquiv="Content-Language" content={intl.locale} />
          {metaToHead.map((metaProps, i) => (
            <meta key={i} {...metaProps} />
          ))}
          <script id="page-schema" type="application/ld+json">
            {schemaArrayJSONString.replace(/</g, '\\u003c')}
          </script>
        </Helmet>
        <div
          className={css.content}
          style={scrollPositionStyles}
          ref={c => {
            this.contentDiv = c;
          }}
        >
          {children}
        </div>
      </div>
    );
  }
}

/**
 * @typedef {Object} ImageConfig
 * @property {string} width - The width of the image
 * @property {string} height - The height of the image
 * @property {string} url - The URL of the image
 */
/**
 * @typedef {Object} SocialSharingConfig
 * @property {string} title - The title for the social sharing service
 * @property {string} description - The description for the social sharing service
 * @property {Array<ImageConfig>} images1200 - The images for social sharing (1200x630)
 * @property {Array<ImageConfig>} images600 - The images for social sharing (600x314)
 */
/**
 * A component that renders a page.
 *
 * @component
 * @param {Object} props
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} [props.rootClassName] - Custom class that overrides the default class for the root element
 * @param {ReactNode} props.children - The children to render
 * @param {boolean} props.scrollingDisabled - Whether the scrolling is disabled
 * @param {string} props.referrer - Handle referrer policy
 * @param {string} props.author - The author
 * @param {string} props.openGraphType - The open graph type (aka 'og:type')
 * @param {string} props.description - The description
 * @param {Array<ImageConfig>} props.facebookImages - The facebook images
 * @param {Array<ImageConfig>} props.twitterImages - The twitter images
 * @param {string} props.published - The published date (article:published_time)
 * @param {object|array} props.schema - The schema from
 * @param {SocialSharingConfig} props.socialSharing - The social sharing
 * @param {string} props.title - The page title
 * @param {string} props.twitterHandle - The twitter handle
 * @param {string} props.updated - The updated date article:modified_time
 * @returns {JSX.Element} Page component that handles SEO and social sharing
 */
const Page = props => {
  const config = useConfiguration();
  const routeConfiguration = useRouteConfiguration();
  const location = useLocation();
  const intl = useIntl();

  return (
    <PageComponent
      config={config}
      routeConfiguration={routeConfiguration}
      location={location}
      intl={intl}
      {...props}
    />
  );
};

export default Page;
