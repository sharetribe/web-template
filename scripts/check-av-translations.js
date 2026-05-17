const fs = require('fs');
const path = require('path');

const translationDir = path.resolve(__dirname, '..', 'src', 'translations');
const files = {
  en: path.join(translationDir, 'en_av.json'),
  es: path.join(translationDir, 'es_av.json'),
};

const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const en = readJson(files.en);
const es = readJson(files.es);

const enKeys = Object.keys(en).sort();
const esKeys = Object.keys(es).sort();
const missingFromEs = enKeys.filter(key => !Object.prototype.hasOwnProperty.call(es, key));
const missingFromEn = esKeys.filter(key => !Object.prototype.hasOwnProperty.call(en, key));

const placeholderValues = [
  ...Object.entries(en).map(([key, value]) => ({ file: 'en_av.json', key, value })),
  ...Object.entries(es).map(([key, value]) => ({ file: 'es_av.json', key, value })),
]
  .filter(({ key, value }) => value === key || /^TODO|^FIXME/.test(value))
  .map(({ file, key }) => `${file}: ${key}`)
  .sort();

if (missingFromEs.length || missingFromEn.length || placeholderValues.length) {
  if (missingFromEs.length) {
    console.error('Keys in en_av.json missing from es_av.json:');
    missingFromEs.forEach(key => console.error(`  ${key}`));
  }

  if (missingFromEn.length) {
    console.error('Keys in es_av.json missing from en_av.json:');
    missingFromEn.forEach(key => console.error(`  ${key}`));
  }

  if (placeholderValues.length) {
    console.error('Placeholder-like AV translation values:');
    placeholderValues.forEach(key => console.error(`  ${key}`));
  }

  process.exit(1);
}

console.log(`AV translation check passed: ${enKeys.length} symmetric keys.`);
