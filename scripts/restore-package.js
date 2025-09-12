#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Restore original package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageBackupPath = path.join(__dirname, '..', 'package.json.backup');

// Restore original babel.config.js
const babelConfigPath = path.join(__dirname, '..', 'babel.config.js');
const babelBackupPath = path.join(__dirname, '..', 'babel.config.js.backup');

// Restore original gradle.properties
const gradlePropertiesPath = path.join(__dirname, '..', 'android', 'gradle.properties');
const gradleBackupPath = path.join(__dirname, '..', 'android', 'gradle.properties.backup');

let restored = false;

if (fs.existsSync(packageBackupPath)) {
  const originalPackageJson = fs.readFileSync(packageBackupPath, 'utf8');
  fs.writeFileSync(packageJsonPath, originalPackageJson);
  fs.unlinkSync(packageBackupPath);
  console.log('✅ Original package.json restored');
  restored = true;
}

if (fs.existsSync(babelBackupPath)) {
  const originalBabelConfig = fs.readFileSync(babelBackupPath, 'utf8');
  fs.writeFileSync(babelConfigPath, originalBabelConfig);
  fs.unlinkSync(babelBackupPath);
  console.log('✅ Original babel.config.js restored');
  restored = true;
}

if (fs.existsSync(gradleBackupPath)) {
  const originalGradleProperties = fs.readFileSync(gradleBackupPath, 'utf8');
  fs.writeFileSync(gradlePropertiesPath, originalGradleProperties);
  fs.unlinkSync(gradleBackupPath);
  console.log('✅ Original gradle.properties restored');
  restored = true;
}

if (!restored) {
  console.log('⚠️  No backup files found, no changes made');
}
