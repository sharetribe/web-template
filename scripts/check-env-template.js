const fs = require('fs');
const path = require('path');

const envTemplatePath = path.resolve(__dirname, '..', '.env-template');
const contents = fs.readFileSync(envTemplatePath, 'utf8');

const forbiddenPublicEnvNames = new Set(['REACT_APP_BREVO_API_KEY', 'REACT_APP_BREVO_LIST_ID']);
const secretLikePattern = /^REACT_APP_.*(?:SECRET|PRIVATE|PASSWORD)\s*=/;
const violations = contents
  .split(/\r?\n/)
  .map((line, index) => ({ line: line.trim(), number: index + 1 }))
  .filter(({ line }) => {
    const match = line.match(/^([A-Z0-9_]+)\s*=/);
    const name = match?.[1];
    return forbiddenPublicEnvNames.has(name) || secretLikePattern.test(line);
  });

if (violations.length > 0) {
  console.error('Public secret-like variables found in .env-template:');
  violations.forEach(({ line, number }) => {
    console.error(`  ${number}: ${line}`);
  });
  console.error('Use server-only env vars without the REACT_APP_ prefix for secrets.');
  process.exit(1);
}

console.log('.env-template public env check passed.');
