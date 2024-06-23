// plugins/withExifInterface.js
const { createRunOncePlugin, withAndroidManifest, withGradleProperties, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withExifInterface = (config) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const filePath = path.join(config.modRequest.platformProjectRoot, 'app', 'build.gradle');
      let fileContents = await fs.promises.readFile(filePath, 'utf-8');
      
      if (!fileContents.includes('androidx.exifinterface:exifinterface')) {
        const depString = 'implementation "androidx.exifinterface:exifinterface:1.3.3"';
        // Insert the dependency before the end of the dependencies block
        fileContents = fileContents.replace(/dependencies \{/, `dependencies {\n    ${depString}`);
        await fs.promises.writeFile(filePath, fileContents, 'utf-8');
      }

      return config;
    },
  ]);
};

module.exports = createRunOncePlugin(
  withExifInterface,
  'with-exif-interface',
  '1.0.0'
);