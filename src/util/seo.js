const ensureOpenGraphLocale = locale => {
  switch (locale) {
    case 'en':
      return 'en_US';
    default:
      return locale;
  }
};

/**
 * These will be used with Helmet <meta {...openGraphMetaProps} />
 */
export const openGraphMetaProps = data => {
  const {
    marketplaceRootURL,
    contentType,
    description,
    facebookAppId,
    facebookImages,
    locale,
    published,
    marketplaceName,
    tags,
    title,
    updated,
    url,
  } = data;

  if (!(title && description && contentType && url && facebookImages && marketplaceRootURL)) {
    /* eslint-disable no-console */
    if (console && console.warn) {
      console.warn(
        `Can't create Open Graph meta tags:
        title, description, contentType, url, facebookImages, and marketplaceRootURL are needed.`
      );
    }
    /* eslint-enable no-console */
    return [];
  }

  const openGraphMeta = [
    { property: 'og:description', content: description },
    { property: 'og:title', content: title },
    { property: 'og:type', content: contentType },
    { property: 'og:url', content: url },
    { property: 'og:locale', content: ensureOpenGraphLocale(locale) },
  ];

  if (facebookImages && facebookImages.length > 0) {
    facebookImages.forEach(i => {
      openGraphMeta.push({
        property: 'og:image',
        content: i.url,
      });

      if (i.width && i.height) {
        openGraphMeta.push({ property: 'og:image:width', content: i.width });
        openGraphMeta.push({ property: 'og:image:height', content: i.height });
      }
    });
  }

  if (marketplaceName) {
    openGraphMeta.push({ property: 'og:site_name', content: marketplaceName });
  }

  if (facebookAppId) {
    openGraphMeta.push({ property: 'fb:app_id', content: facebookAppId });
  }

  if (published) {
    openGraphMeta.push({ property: 'article:published_time', content: published });
  }

  if (updated) {
    openGraphMeta.push({ property: 'article:modified_time', content: updated });
  }

  if (tags) {
    openGraphMeta.push({ property: 'article:tag', content: tags });
  }

  return openGraphMeta;
};

/**
 * These will be used with Helmet <meta {...twitterMetaProps} />
 */
export const twitterMetaProps = data => {
  const {
    marketplaceRootURL,
    description,
    siteTwitterHandle,
    title,
    twitterHandle,
    twitterImages,
    url,
  } = data;

  if (!(title && description && url)) {
    /* eslint-disable no-console */
    if (console && console.warn) {
      console.warn(
        `Can't create twitter card meta tags:
        title, description, and url are needed.`
      );
    }
    /* eslint-enable no-console */
    return [];
  }

  const twitterMeta = [
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:url', content: url },
  ];

  if (siteTwitterHandle) {
    twitterMeta.push({ name: 'twitter:site', content: siteTwitterHandle });
  }

  if (marketplaceRootURL && twitterImages && twitterImages.length > 0) {
    twitterImages.forEach(i => {
      twitterMeta.push({
        name: 'twitter:image',
        content: i.url,
      });
    });
  }

  if (twitterHandle) {
    // TODO: If we want to connect providers twitter account on ListingPage
    // we needs to get this info among listing data (API support needed)
    twitterMeta.push({ name: 'twitter:creator', content: twitterHandle });
  }

  if (marketplaceRootURL) {
    twitterMeta.push({ name: 'twitter:domain', content: marketplaceRootURL });
  }

  return twitterMeta;
};

/**
 * These will be used with Helmet <meta {...metaTagProps} />
 * Creates data for Open Graph and Twitter meta tags.
 */
export const metaTagProps = (tagData, config) => {
  const { marketplaceRootURL, facebookAppId, marketplaceName, siteTwitterHandle } = config;

  const author = tagData.author || marketplaceName;
  const defaultMeta = [
    { name: 'description', content: tagData.description },
    { name: 'author', content: author },
  ];

  const openGraphMeta = openGraphMetaProps({
    ...tagData,
    marketplaceRootURL,
    facebookAppId,
    marketplaceName,
  });

  const twitterMeta = twitterMetaProps({
    ...tagData,
    marketplaceRootURL,
    siteTwitterHandle,
  });

  return [...defaultMeta, ...openGraphMeta, ...twitterMeta];
};
