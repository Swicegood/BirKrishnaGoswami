#!/bin/bash

# Script to verify and fix 16KB alignment for Android APK
# Usage: ./scripts/verify-16kb-alignment.sh [path-to-apk]

APK_PATH=${1:-"android/app/build/outputs/apk/release/app-release.apk"}

echo "🔍 Verifying 16KB alignment for APK: $APK_PATH"

if [ ! -f "$APK_PATH" ]; then
    echo "❌ APK file not found: $APK_PATH"
    echo "Please build your app first or provide the correct APK path"
    exit 1
fi

echo "📱 Checking page size on device/emulator..."
PAGE_SIZE=$(adb shell getconf PAGE_SIZE 2>/dev/null)
if [ "$PAGE_SIZE" = "16384" ]; then
    echo "✅ Device is using 16KB page size"
else
    echo "⚠️  Device page size: $PAGE_SIZE (expected: 16384)"
    echo "Make sure you're testing on a 16KB device or emulator"
fi

echo "🔧 Checking APK alignment..."
if zipalign -c -P 16 -v 4 "$APK_PATH"; then
    echo "✅ APK is properly aligned for 16KB page size"
else
    echo "❌ APK is not properly aligned for 16KB page size"
    echo "🔧 Attempting to fix alignment..."
    
    # Create a backup
    cp "$APK_PATH" "${APK_PATH}.backup"
    
    # Realign the APK
    zipalign -f -p 16 "$APK_PATH" "${APK_PATH}.aligned"
    
    if [ $? -eq 0 ]; then
        mv "${APK_PATH}.aligned" "$APK_PATH"
        echo "✅ APK has been realigned for 16KB page size"
        
        # Verify the fix
        if zipalign -c -P 16 -v 4 "$APK_PATH"; then
            echo "✅ Verification successful - APK is now 16KB aligned"
        else
            echo "❌ Realignment failed"
            exit 1
        fi
    else
        echo "❌ Failed to realign APK"
        exit 1
    fi
fi

echo "🎉 16KB alignment verification complete!"
echo ""
echo "Next steps:"
echo "1. Install the APK on your 16KB device/emulator"
echo "2. Launch the app and verify no backcompat mode warning appears"
echo "3. Test all app functionality to ensure it works correctly"


