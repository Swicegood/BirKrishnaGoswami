#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Backup original package.json
const backupPath = path.join(__dirname, '..', 'package.json.backup');
fs.writeFileSync(backupPath, JSON.stringify(packageJson, null, 2));

// Update dependencies for iOS compatibility
packageJson.dependencies['react-native-reanimated'] = '~3.15.0';
packageJson.dependencies['react-native-worklets'] = '0.3.0';

// Remove deprecated Babel plugins that cause build issues
if (packageJson.devDependencies) {
  delete packageJson.devDependencies['@babel/plugin-proposal-optional-chaining'];
  
  // Ensure we have the correct Babel plugin
  if (!packageJson.devDependencies['@babel/plugin-transform-optional-chaining']) {
    packageJson.devDependencies['@babel/plugin-transform-optional-chaining'] = '^7.24.0';
  }
}

// Write updated package.json
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

console.log('✅ iOS build preparation complete:');
console.log('  - react-native-reanimated: ~3.15.0');
console.log('  - react-native-worklets: 0.3.0');
console.log('  - Removed deprecated Babel plugins');
console.log('  - Original package.json backed up to package.json.backup');
