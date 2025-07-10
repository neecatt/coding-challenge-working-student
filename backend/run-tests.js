#!/usr/bin/env node

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 Running Authentication and Ticket Tests...\n');

try {
  // Run the tests
  execSync('npm test', { 
    stdio: 'inherit',
    cwd: __dirname 
  });
  
  console.log('\n✅ All tests completed successfully!');
} catch (error) {
  console.error('\n❌ Tests failed:', error.message);
  process.exit(1);
} 