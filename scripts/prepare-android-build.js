#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Read babel.config.js
const babelConfigPath = path.join(__dirname, '..', 'babel.config.js');
const babelConfigContent = fs.readFileSync(babelConfigPath, 'utf8');

// Backup original files
const packageBackupPath = path.join(__dirname, '..', 'package.json.backup');
const babelBackupPath = path.join(__dirname, '..', 'babel.config.js.backup');
fs.writeFileSync(packageBackupPath, JSON.stringify(packageJson, null, 2));
fs.writeFileSync(babelBackupPath, babelConfigContent);

// Update dependencies for Android compatibility
packageJson.dependencies['react-native-reanimated'] = '~2.17.0';
// Temporarily remove react-native-worklets for Android builds due to compatibility issues
delete packageJson.dependencies['react-native-worklets'];

// Add required Babel plugins for React Native Reanimated 2.17.0
if (!packageJson.devDependencies) {
  packageJson.devDependencies = {};
}
packageJson.devDependencies['@babel/plugin-proposal-optional-chaining'] = '^7.18.6';
packageJson.devDependencies['@babel/plugin-proposal-nullish-coalescing-operator'] = '^7.18.6';
packageJson.devDependencies['@babel/plugin-transform-template-literals'] = '^7.24.0';

// Update babel.config.js to add required plugins for React Native Reanimated 2.17.0
let updatedBabelConfig = babelConfigContent.replace(
  /plugins: \[([\s\S]*?)\]/,
  `plugins: [
      '@babel/plugin-proposal-optional-chaining',
      '@babel/plugin-proposal-nullish-coalescing-operator',
      '@babel/plugin-transform-template-literals',
      $1
    ]`
);

// Write updated files
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
fs.writeFileSync(babelConfigPath, updatedBabelConfig);

console.log('✅ Android build preparation complete:');
console.log('  - react-native-reanimated: ~2.17.0');
console.log('  - react-native-worklets: REMOVED (incompatible with RN 0.79.5)');
console.log('  - @babel/plugin-proposal-optional-chaining: ADDED');
console.log('  - @babel/plugin-proposal-nullish-coalescing-operator: ADDED');
console.log('  - @babel/plugin-transform-template-literals: ADDED');
console.log('  - babel.config.js: updated with required plugins');
console.log('  - Original files backed up to *.backup');
