#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Read babel.config.js
const babelConfigPath = path.join(__dirname, '..', 'babel.config.js');
const babelConfigContent = fs.readFileSync(babelConfigPath, 'utf8');

// Read android/gradle.properties
const gradlePropertiesPath = path.join(__dirname, '..', 'android', 'gradle.properties');
const gradlePropertiesContent = fs.readFileSync(gradlePropertiesPath, 'utf8');

// Backup original files
const packageBackupPath = path.join(__dirname, '..', 'package.json.backup');
const babelBackupPath = path.join(__dirname, '..', 'babel.config.js.backup');
const gradleBackupPath = path.join(__dirname, '..', 'android', 'gradle.properties.backup');
fs.writeFileSync(packageBackupPath, JSON.stringify(packageJson, null, 2));
fs.writeFileSync(babelBackupPath, babelConfigContent);
fs.writeFileSync(gradleBackupPath, gradlePropertiesContent);

// Update dependencies for Android compatibility
packageJson.dependencies['react-native-reanimated'] = '~3.16.1';
// Temporarily remove react-native-worklets for Android builds due to compatibility issues
delete packageJson.dependencies['react-native-worklets'];

// Add required Babel plugins for React Native Reanimated 3.16.1
if (!packageJson.devDependencies) {
  packageJson.devDependencies = {};
}
// Remove deprecated plugin if it exists to avoid conflicts
delete packageJson.devDependencies['@babel/plugin-proposal-optional-chaining'];
packageJson.devDependencies['@babel/plugin-transform-optional-chaining'] = '^7.24.0';
packageJson.devDependencies['@babel/plugin-proposal-nullish-coalescing-operator'] = '^7.18.6';
packageJson.devDependencies['@babel/plugin-transform-template-literals'] = '^7.24.0';

// Update babel.config.js to add required plugins for React Native Reanimated 3.16.1
let updatedBabelConfig = babelConfigContent.replace(
  /plugins: \[([\s\S]*?)\]/,
  `plugins: [
      '@babel/plugin-transform-optional-chaining',
      '@babel/plugin-proposal-nullish-coalescing-operator',
      '@babel/plugin-transform-template-literals',
      $1
    ]`
);

// Update gradle.properties to enable new architecture for Android
let updatedGradleProperties = gradlePropertiesContent
  .replace(/newArchEnabled=false/g, 'newArchEnabled=true')
  .replace(/RCT_NEW_ARCH_ENABLED=false/g, 'RCT_NEW_ARCH_ENABLED=true');

// Write updated files
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
fs.writeFileSync(babelConfigPath, updatedBabelConfig);
fs.writeFileSync(gradlePropertiesPath, updatedGradleProperties);

console.log('✅ Android build preparation complete:');
console.log('  - react-native-reanimated: ~3.16.1');
console.log('  - react-native-worklets: REMOVED (incompatible with RN 0.79.5)');
console.log('  - @babel/plugin-transform-optional-chaining: ADDED');
console.log('  - @babel/plugin-proposal-nullish-coalescing-operator: ADDED');
console.log('  - @babel/plugin-transform-template-literals: ADDED');
console.log('  - babel.config.js: updated with required plugins');
console.log('  - gradle.properties: new architecture ENABLED');
console.log('  - Original files backed up to *.backup');
