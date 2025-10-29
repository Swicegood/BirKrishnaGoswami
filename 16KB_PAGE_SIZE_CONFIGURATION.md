# 16KB Memory Page Size Configuration

## Overview
This document outlines the changes made to configure your Android app for Google Play's new 16KB memory page size requirement, which takes effect on November 1, 2025.

## Changes Made

### 1. Updated Android SDK Versions
- **Target SDK Version**: Updated to 35 (Android 15)
- **Compile SDK Version**: Updated to 35 (Android 15)
- **Min SDK Version**: Set to 24 (Android 7.0)
- **Build Tools Version**: Updated to 35.0.0
- **NDK Version**: Updated to 28.0.12077973

### 2. Updated Android Gradle Plugin
- **AGP Version**: Updated to 8.5.1 (required for 16KB support)

### 3. Updated App Versions
- **Version Code**: Incremented to 35
- **Version Name**: Updated to 1.5.2

### 4. Added Gradle Properties
- Enabled R8 full mode for better optimization
- Disabled desugaring artifact transform for compatibility

## Files Modified

1. `app.json` - Updated expo-build-properties plugin configuration
2. `android/build.gradle` - Updated Android Gradle Plugin version
3. `android/app/build.gradle` - Updated version code and name
4. `android/gradle.properties` - Added 16KB support properties

## Testing Instructions

### 1. Build the App
```bash
# Clean and rebuild
cd android
./gradlew clean
cd ..
npx expo run:android
```

### 2. Test with 16KB Page Size
To test your app with 16KB memory page size:

1. **Using Android Emulator:**
   - Create an Android 15 (API 35) emulator
   - Configure it to use 16KB page size
   - Install and test your app

2. **Using Physical Device:**
   - Use a device running Android 15 with 16KB page size support
   - Install and test your app

### 3. Verify Native Libraries
After building, check that your native libraries support 16KB page size:
```bash
# Analyze the APK
aapt dump badging your-app.apk
```

## Important Notes

- **Deadline**: All new apps and updates targeting Android 15+ must support 16KB page sizes by November 1, 2025
- **Existing Apps**: Updates to existing apps must comply by May 1, 2026
- **Testing**: Thoroughly test your app in a 16KB environment before publishing

## Next Steps

1. Test your app thoroughly with the new configuration
2. Verify all native libraries are compatible with 16KB page size
3. Update any third-party dependencies that might need updates
4. Build and test your app in a 16KB environment
5. Submit your updated app to Google Play

## Resources

- [Google's 16KB Page Size Guide](https://developer.android.com/guide/practices/page-sizes)
- [Android Gradle Plugin Release Notes](https://developer.android.com/studio/releases/gradle-plugin)
