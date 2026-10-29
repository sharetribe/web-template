/**
 * Checks that translation keys in en.json are sorted alphabetically
 * in a case-sensitive manner (default String comparison / Unicode code points).
 *
 * Exit codes:
 *   0 – keys are sorted
 *   1 – keys are out of order (or file could not be read)
 */

const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '../src/translations/en.json');

const main = () => {
  let translations;
  try {
    translations = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch (err) {
    console.error(`Failed to read ${FILE}: ${err.message}`);
    process.exit(1);
  }

  const keys = Object.keys(translations);
  const sortedKeys = [...keys].sort();

  for (let i = 0; i < keys.length; i++) {
    if (keys[i] !== sortedKeys[i]) {
      console.error(`Translation keys in ${FILE} are not sorted alphabetically (case-sensitive).`);
      console.error(`First mismatch at index ${i}:`);
      console.error(`  found:    ${keys[i]}`);
      console.error(`  expected: ${sortedKeys[i]}`);
      process.exit(1);
    }
  }

  console.log(`OK: ${keys.length} keys in ${FILE} are sorted alphabetically (case-sensitive).`);
};

main();
