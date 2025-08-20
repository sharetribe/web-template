#!/usr/bin/env node

/**
 * Audit script to check for absolute self-host URLs that should be relative
 * Run with: npm run audit:urls
 */

const { execSync } = require('child_process');
const path = require('path');

// Patterns to search for absolute self-host URLs
const SELF_HOST_PATTERNS = [
  'https?://(web-template-1\\.onrender\\.com|sherbrt-test\\.onrender\\.com)',
  'https?://sherbrt\\.com'
];

// Files/directories to exclude from search
const EXCLUDE_PATTERNS = [
  'node_modules',
  '.git',
  'build',
  'dist',
  '*.md',
  '*.txt',
  '*.log',
  '*.zip',
  '*.backup'
];

console.log('🔍 Auditing for absolute self-host URLs...\n');

let foundIssues = false;

SELF_HOST_PATTERNS.forEach(pattern => {
  try {
    // Build grep command with exclusions
    const excludeArgs = EXCLUDE_PATTERNS.map(p => `--exclude=${p}`).join(' ');
    const command = `grep -r --include="*.{js,jsx,tsx,html,css}" ${excludeArgs} "${pattern}" . || true`;
    
    const output = execSync(command, { encoding: 'utf8', cwd: process.cwd() });
    
    if (output.trim()) {
      console.log(`❌ Found absolute self-host URLs matching pattern: ${pattern}`);
      console.log(output);
      foundIssues = true;
    } else {
      console.log(`✅ No issues found for pattern: ${pattern}`);
    }
  } catch (error) {
    console.log(`⚠️  Error checking pattern ${pattern}:`, error.message);
  }
});

console.log('\n' + '='.repeat(50));

if (foundIssues) {
  console.log('❌ AUDIT FAILED: Found absolute self-host URLs that should be relative');
  console.log('Fix these by converting to relative paths (e.g., /static/... instead of https://domain.com/static/...)');
  process.exit(1);
} else {
  console.log('✅ AUDIT PASSED: No absolute self-host URLs found');
  console.log('All asset references use relative paths as expected');
  process.exit(0);
}
