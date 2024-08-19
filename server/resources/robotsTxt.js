const fs = require('fs');
const { Transform, Writable } = require('stream');
const log = require('../log.js');
const { getRootURL } = require('../api-util/rootURL.js');
const sdkUtils = require('../api-util/sdk.js');

const dev = process.env.REACT_APP_ENV === 'development';

// Emulate feature that's part of sitemap dependency
const streamToPromise = stream => {
  return new Promise((resolve, reject) => {
    const drain = [];
    stream
      .pipe(
        new Writable({
          write(chunk, encoding, next) {
            drain.push(chunk);
            next();
          },
        })
      )
      .on('error', reject)
      .on('finish', () => {
        if (!drain.length) {
          reject(new EmptyStream());
        } else {
          resolve(Buffer.concat(drain));
        }
      });
  });
};

// Time-to-live (ttl) is set to one day aka 86400 seconds
const ttl = 86400; // seconds

// This creates simple (proxied) memory cache
const createCacheProxy = ttl => {
  const cache = {};
  return new Proxy(cache, {
    // Get data for the property together with timestamp
    get(target, property, receiver) {
      const cachedData = target[property];
      if (!!cachedData) {
        // Check if the cached data has expired
        if (Date.now() - cachedData.timestamp < ttl * 1000) {
          return cachedData;
        }
      }
      return { data: null, timestamp: cachedData?.timestamp || Date.now() };
    },
    // Set given value as data to property accompanied with timestamp
    set(target, property, value, receiver) {
      target[property] = { data: value, timestamp: Date.now() };
    },
  });
};

const cache = createCacheProxy(ttl);

// Fallback data if something failes with streams
const fallbackRobotsTxt = `
User-agent: *
Disallow: /profile-settings
Disallow: /l/new
Disallow: /l/*/checkout
Disallow: /l/*/draft
Disallow: /l/*/pending-approval
Disallow: /l/*/new
Disallow: /l/*/edit
Disallow: /inbox
Disallow: /order
Disallow: /sale
Disallow: /listings
Disallow: /account
Disallow: /reset-password
Disallow: /verify-email
Disallow: /preview
Disallow: /styleguide
Crawl-Delay: 5
`;

/**
 * This processes given robots.txt file (adds correct URL for the sitemap-index.xml)
 * and sends it as response.
 *
 * @param {Object} req
 * @param {Object} res
 * @param {String} robotsTxtPath
 */
const sendRobotsTxt = (req, res, robotsTxtPath) => {
  const sitemapIndexUrl = `${getRootURL({ useDevApiServerPort: true })}/sitemap-index.xml`;

  try {
    const modifiedStream = new Transform({
      transform(chunk, encoding, next) {
        // Replace https://my.marketplace.com/sitemap-index.xml with actual sitemap url
        let modifiedChunk = chunk
          .toString()
          .replace(/https:\/\/my\.marketplace\.com\/sitemap-index\.xml/g, sitemapIndexUrl);
        this.push(modifiedChunk);
        next();
      },
    });

    const readStream = fs.createReadStream(robotsTxtPath, { encoding: 'utf8' });
    const robotsStream = readStream.pipe(modifiedStream);

    // Save the data to a variable cache
    streamToPromise(robotsStream).then(rs => (cache.robotsTxt = rs));

    robotsStream.pipe(res).on('error', e => {
      throw e;
    });
  } catch (e) {
    log.error(e, 'robots-txt-render-failed');
    res.send(fallbackRobotsTxt);
  }
};
// Middleware to generate robots.txt
// This reads the accompanied robots.txt file and changes the sitemap url on the fly
module.exports = (req, res) => {
  res.set({
    'Content-Type': 'text/plain',
    'Cache-Control': `public, max-age=${ttl}`,
  });

  // If we have a cached content send it
  const { data, timestamp } = cache.robotsTxt;
  if (data && timestamp) {
    const age = Math.floor((Date.now() - timestamp) / 1000);
    res.set('Age', age);
    res.send(data);
    return;
  }

  const sdk = sdkUtils.getSdk(req, res);
  sdkUtils
    .fetchAccessControlAsset(sdk)
    .then(response => {
      const accessControlAsset = response.data.data[0];

      const { marketplace } =
        accessControlAsset?.type === 'jsonAsset' ? accessControlAsset.attributes.data : {};
      const isPrivateMarketplace = marketplace?.private === true;
      const robotsTxtPath = isPrivateMarketplace
        ? 'server/resources/robotsPrivateMarketplace.txt'
        : 'server/resources/robots.txt';

      sendRobotsTxt(req, res, robotsTxtPath);
    })
    .catch(e => {
      // Log error
      const is404 = e.status === 404;
      if (is404 && dev) {
        console.log('robots-txt-render-failed-no-asset-found');
      }
      // TODO: This defaults to more permissive robots.txt due to backward compatibility.
      // You might want to change that.
      sendRobotsTxt(req, res, 'server/resources/robots.txt');
    });
};
