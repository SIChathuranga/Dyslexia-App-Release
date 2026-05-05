# Building Production Android APK - Complete Guide

## Important: .env and Expo Apps

✅ **Good News:** Expo automatically includes `EXPO_PUBLIC_*` environment variables in the APK during build time. They are **embedded** in the app bundle, so users don't need a separate .env file.

### How it works:
- Variables starting with `EXPO_PUBLIC_` are automatically baked into the app binary
- They're accessible via `expo-constants` at runtime
- The `.env` file in your project is used **during the build process only**
- The `.env` file does NOT need to be in the APK

---

## Option 1: EAS Build (Recommended - Cloud Build)

### ✅ Advantages:
- No local dependencies needed
- Builds in the cloud (consistent environment)
- Automatically handles signing & optimization
- Fastest path to production

### ✅ Steps:

#### 1. Install EAS CLI
```bash
npm install -g eas-cli
```

#### 2. Login to Expo
```bash
eas login
# Opens browser to sign in with Expo account
```

#### 3. Configure EAS (first time)
```bash
cd e:\frontend\app
eas build:configure
# Selects platform (Android)
# Creates eas.json configuration
```

#### 4. Build APK
```bash
eas build --platform android --local
```

Or for release build:
```bash
eas build --platform android --local --release
```

#### 5. Output
- APK is created in your project directory
- Ready to upload to Play Store or distribute directly

---

## Option 2: Local Build with Gradle

### ⚠️ Requirements:
1. **Java Development Kit (JDK) 17+**
   ```bash
   choco install temurin17  # Windows with Chocolatey
   ```

2. **Android SDK** (if not installed)
   ```bash
   choco install android-sdk  # Windows
   ```

3. **Gradle** (usually included with Android SDK)

### ✅ Steps:

#### 1. Verify Java Installation
```bash
java -version
# Should show version 17 or higher
```

#### 2. Prebuild for Android
```bash
cd e:\frontend\app
npx expo prebuild --clean
```

This generates:
- `android/` folder with Gradle configuration
- `ios/` folder (not needed for APK)

#### 3. Build Release APK
```bash
cd android
./gradlew assembleRelease
# or on Windows:
gradlew.bat assembleRelease
```

#### 4. Signed APK
```bash
./gradlew bundleRelease
```

#### 5. Output Location
```
android/app/build/outputs/apk/release/app-release.apk
android/app/build/outputs/bundle/release/app-release.aab
```

---

## Step-by-Step: EAS Build Method (RECOMMENDED)

### Step 1: Install EAS CLI
```bash
npm install -g eas-cli
```

### Step 2: Authenticate
```bash
eas login
```
Creates `.easrc` file in your home directory with credentials

### Step 3: Configure EAS Build
```bash
cd e:\frontend\app
eas build:configure
```

Creates `eas.json`:
```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

### Step 4: Create Signing Certificate
```bash
eas credentials
# Select: Android
# Select: Production
# Let EAS manage signing keys
```

### Step 5: Build Locally
```bash
eas build --platform android --local
```

### Step 6: Test the Build
```bash
# After successful build, install on emulator/device
adb install app-release.apk
```

---

## Environment Variables in APK

### ✅ Included Automatically:
```
EXPO_PUBLIC_PHOTO_SPELLING_API_URL
EXPO_PUBLIC_WRITING_MATH_API_URL
EXPO_PUBLIC_MULTI_SKILL_API_URL
EXPO_PUBLIC_ACTION_DETECTION_API_URL
```

### ✅ Verified at Build Time:
```bash
# Check what's embedded
npx expo show:secrets
```

### ✅ Security Note:
- `EXPO_PUBLIC_*` vars are **visible in decompiled APK** (this is normal for Expo)
- If API URLs are sensitive, use API keys/tokens instead
- Never put secrets directly in `EXPO_PUBLIC_*` variables

---

## Quick Verification Before Building

### 1. Check .env is correct
```bash
cat e:\frontend\app\.env
```

### 2. Verify expo-constants reads the variables
```bash
cd e:\frontend\app
npm start
# Check console for API URLs being loaded
```

### 3. Check app.json for permissions
```bash
cat e:\frontend\app\app.json | grep -A 20 '"android"'
```

---

## Testing APK Before Release

### Install on Android Emulator
```bash
# Start emulator first
emulator -avd Pixel_5

# Install APK
adb install app-release.apk

# Test app opens
adb shell am start -n com.dyslearnapp/MainActivity
```

### Install on Physical Device
```bash
# Enable USB Debugging on device
# Connect device to computer

# Verify connection
adb devices

# Install APK
adb install app-release.apk
```

---

## Troubleshooting

### Issue: `.env` not included
**Solution:** Use `EXPO_PUBLIC_*` prefix (already done ✅)

### Issue: Build fails with Java error
**Solution:**
```bash
java -version  # Verify JDK 17+
set JAVA_HOME=C:\Program Files\temurin\jdk-17.x.x  # Set path
```

### Issue: API URLs not loading in APK
**Solution:** Verify variables in `.env` and rebuild

### Issue: Large APK size
**Solution:**
```bash
eas build --platform android --profile release --local
```

---

## Production Checklist

- [ ] `.env` file exists and has `EXPO_PUBLIC_*` variables
- [ ] `app.json` has correct app name, version, permissions
- [ ] All backend APIs URLs are correct
- [ ] No hardcoded secrets in code
- [ ] Tested on Android emulator
- [ ] Tested on physical device
- [ ] Version number incremented in `app.json`
- [ ] Icon and splash screen updated
- [ ] Play Store listing prepared (if uploading to store)

---

## Next Steps After Building

### Option A: Direct Distribution
1. Download APK from build output
2. Share via link (Dropbox, GitHub releases, etc.)
3. Users sideload onto device

### Option B: Google Play Store
1. Create Google Play Console account
2. Create app listing
3. Upload AAB (Android App Bundle) file
4. Set pricing & distribution
5. Submit for review

### Option C: Firebase App Distribution
```bash
eas build --platform android --release
# Upload to Firebase console
```

