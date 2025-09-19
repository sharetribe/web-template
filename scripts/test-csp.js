#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const path = require('path');

const SERVER_FILE = path.join(__dirname, '..', 'server', 'index.js');
const PORT = 3001;

console.log('🔍 CSP Header Test Script');
console.log('========================');

function run(mode, options = {}) {
  return new Promise((resolve) => {
    const env = { 
      ...process.env, 
      CSP_MODE: mode,
      REACT_APP_CSP: mode === 'report' ? 'report' : 'block',
      PORT: PORT,
      ...options 
    };
    
    console.log(`\n🚀 Starting server in ${mode.toUpperCase()} mode...`);
    if (options.CSP_DUAL_REPORT) {
      console.log(`   CSP_DUAL_REPORT: ${options.CSP_DUAL_REPORT}`);
    }
    if (options.CSP_EXCLUDE_API) {
      console.log(`   CSP_EXCLUDE_API: ${options.CSP_EXCLUDE_API}`);
    }
    
    const proc = spawn('node', [SERVER_FILE], { 
      env, 
      stdio: ['ignore', 'pipe', 'pipe'] 
    });
    
    let serverOutput = '';
    proc.stdout.on('data', (data) => {
      serverOutput += data.toString();
    });
    proc.stderr.on('data', (data) => {
      serverOutput += data.toString();
    });
    
    setTimeout(() => {
      try {
        // Test main page
        const mainHeaders = execSync(`curl -sI http://localhost:${PORT}/ | tr -d "\\r" | grep -i content-security-policy || echo "No CSP headers found"`, { stdio: 'pipe' }).toString();
        
        // Test API endpoint
        const apiHeaders = execSync(`curl -sI http://localhost:${PORT}/api/qr/test | tr -d "\\r" | grep -i content-security-policy || echo "No CSP headers found"`, { stdio: 'pipe' }).toString();
        
        console.log(`\n=== ${mode.toUpperCase()} MODE RESULTS ===`);
        console.log('Main page (/) headers:');
        console.log(mainHeaders.trim() || 'No CSP headers found');
        console.log('\nAPI endpoint (/api/qr/test) headers:');
        console.log(apiHeaders.trim() || 'No CSP headers found');
        
        // Show server startup logs
        const cspLogLine = serverOutput.split('\n').find(line => line.includes('CSP mode:'));
        if (cspLogLine) {
          console.log('\nServer startup log:');
          console.log(cspLogLine.trim());
        }
        
      } catch (error) {
        console.log(`❌ Error testing ${mode} mode:`, error.message);
      }
      
      proc.kill();
      setTimeout(resolve, 500); // Wait for cleanup
    }, 2000);
  });
}

async function main() {
  try {
    // Test 1: Report mode
    await run('report');
    
    // Test 2: Block mode  
    await run('block');
    
    // Test 3: Block mode with dual reporting
    await run('block', { CSP_DUAL_REPORT: 'true' });
    
    // Test 4: Report mode with API exclusion
    await run('report', { CSP_EXCLUDE_API: 'true' });
    
    console.log('\n✅ CSP testing complete!');
    console.log('\nExpected behavior:');
    console.log('- Report mode: Only Content-Security-Policy-Report-Only header');
    console.log('- Block mode: Only Content-Security-Policy header');  
    console.log('- Block + dual: Both Content-Security-Policy AND Content-Security-Policy-Report-Only');
    console.log('- API exclusion: No CSP headers on /api/* endpoints when CSP_EXCLUDE_API=true');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

main();
