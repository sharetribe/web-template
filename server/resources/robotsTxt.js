const fs = require('fs');
const { Transform, Writable } = require('stream');
const log = require('../log.js');
const { getRootURL } = require('../api-util/rootURL.js');

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

// Simple variable cache
// This assumes that robots.txt does not change after first initialization
let cachedRobotsTxt = null;

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
Crawl-Delay: 5
`;

// Middleware to generate robots.txt
// This reads the accompanied robots.txt file and changes the sitemap url on the fly
module.exports = (req, res) => {
  res.header('Content-Type', 'text/plain');

  // If we have a cached content send it
  if (cachedRobotsTxt) {
    res.send(cachedRobotsTxt);
    return;
  }

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

    const readStream = fs.createReadStream('server/resources/robots.txt', { encoding: 'utf8' });
    const robotsStream = readStream.pipe(modifiedStream);

    // Save the data to a variable cache
    streamToPromise(robotsStream).then(rs => (cachedRobotsTxt = rs));

    robotsStream.pipe(res).on('error', e => {
      throw e;
    });
  } catch (e) {
    log.error(e, 'robots-txt-render-failed');
    res.send(fallbackRobotsTxt);
  }
};
