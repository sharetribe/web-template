const fs = require('fs');
const handlebars = require('handlebars');
const path = require('path');

const { getSdk } = require('./sdk');

const sdk = getSdk();

const assets = new Map();
sdk.assetByAlias({ path: 'design/branding.json', alias: 'latest' }).then(({ data }) => assets.set('design/branding.json', data));
sdk.assetByAlias({ path: 'content/email-texts.json', alias: 'latest' }).then(({ data }) => assets.set('content/email-texts.json', data));

const t = (key, defaultText, options) => {
  return (assets.get('content/email-texts.json')?.data?.[key] || defaultText)
  .replace(/\{([^}]+)\}/g, (match, p1) => options.hash[p1]);
};

handlebars.registerHelper('t', t);
handlebars.registerPartial('logo', fs.readFileSync(path.join(__dirname, '../templates/_logo.html'), 'utf8').toString());
handlebars.registerHelper('json', (value) => JSON.stringify(value));
handlebars.registerHelper('eq', (a, b, options) => a === b ? options.fn(options.data.root.message) : null);
handlebars.registerHelper('url-encode', (key, context) => {
  const parts = key.split('.');
  let value = context.data.root.message;
  for (let i = 0; i < parts.length; i++) value = value[parts[i]];
  return encodeURIComponent(value ?? key);
});

handlebars.registerHelper('asset', (path, key, defaultValue) => {
  let assetData = assets.get(path)?.data;
  if (!assetData) return defaultValue;
  const parts = key.split('.');
  for (let i = 0; i < parts.length; i++) assetData = assetData[parts[i]];
  return assetData ?? defaultValue;
});

module.exports = { t };
