# Production Readiness Checklist

## Pre-Build Verification

### 1. Environment Variables
- [ ] `.env` file exists in `e:\frontend\app`
- [ ] All `EXPO_PUBLIC_*` variables are set:
  - [ ] `EXPO_PUBLIC_PHOTO_SPELLING_API_URL`
  - [ ] `EXPO_PUBLIC_WRITING_MATH_API_URL`
  - [ ] `EXPO_PUBLIC_MULTI_SKILL_API_URL`
  - [ ] `EXPO_PUBLIC_ACTION_DETECTION_API_URL`
- [ ] All backend API URLs are production URLs (not localhost)
- [ ] No sensitive secrets in `.env` (if needed, use secure backend instead)

### 2. App Configuration (`app.json`)
- [ ] App name: "DysLearn" or desired name
- [ ] Version: Incremented (currently 1.0.0)
- [ ] Slug: "dyslexia-app" is correct
- [ ] Permissions for Android included:
  - [ ] `android.permission.CAMERA`
  - [ ] `android.permission.RECORD_AUDIO`
  - [ ] `android.permission.VIBRATE`
- [ ] Icon and splash screen paths correct
- [ ] Adaptive icon configured

### 3. Code Verification
- [ ] No hardcoded API URLs in code
- [ ] No console.log statements with sensitive data
- [ ] No test/debug code left in
- [ ] All imports are correct

### 4. Backend Services
- [ ] Photo Spelling API is running and accessible
- [ ] Writing & Math API is running and accessible
- [ ] Multi-Skill API is running and accessible
- [ ] Action Detection API is running and accessible
- [ ] Test all endpoints respond correctly

### 5. Dependencies
- [ ] All packages are production-ready
- [ ] No deprecated packages
- [ ] Check for security vulnerabilities:
  ```bash
  npm audit
  ```

---

## Verification Commands

### Check Environment Variables
```bash
cd e:\frontend\app
cat .env
```

### Verify Expo Configuration
```bash
npx expo doctor
```

### Test App Locally Before Building
```bash
# Start Expo development server
npm start

# Run on Android emulator
npm run android
```

### Check What's in the Built APK
```bash
# After prebuild, check Android configuration
cd android
cat local.properties
```

---

## Building APK - Step by Step

### Step 1: Global Setup (One-time)
```bash
npm install -g eas-cli
eas login
```

### Step 2: Project Setup
```bash
cd e:\frontend\app

# Verify .env is correct
cat .env

# Install dependencies
npm install
```

### Step 3: Configure EAS (First time only)
```bash
eas build:configure
```

This creates `eas.json` - review it:
```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "apk"
      }
    },
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "development": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

### Step 4: Create Build Credentials (First time)
```bash
eas credentials
# Select: Android
# Select: production
# Let EAS manage credentials (recommended)
```

### Step 5: Build APK
```bash
eas build --platform android --local
```

Expected output:
```
✅ Build complete!
📱 APK ready for download
📊 Build ID: xxxxxxxx
🔗 Dashboard: https://expo.dev/accounts/@yourname/builds/xxxxxxxx
```

### Step 6: Download APK
- Go to EAS dashboard link provided
- Or download from:
  ```bash
  # Build files are in your project directory after completion
  ls -la app-*.apk
  ```

---

## Testing APK

### On Android Emulator
```bash
# Start emulator
emulator -avd Pixel_5

# Wait for boot
# Then install
adb install app-release.apk

# Check installation
adb shell pm list packages | grep dyslexia

# Launch app
adb shell am start -n com.dyslearnapp/.MainActivity
```

### On Physical Device
```bash
# Enable USB Debugging on device
# Connect device via USB

# Verify connection
adb devices

# Install APK
adb install app-release.apk

# View logs
adb logcat | grep DysLearn
```

### Manual Testing Checklist
- [ ] App starts without crashes
- [ ] Login/SignUp screen appears
- [ ] Can navigate to all 4 modules
- [ ] Photo Spelling: Can access camera
- [ ] Writing & Math: Can draw on canvas
- [ ] Fun Games: Can start game
- [ ] Actions: Can start assessment
- [ ] Settings screen works
- [ ] Backend status dots show green (online)
- [ ] All APIs are reachable

---

## Common Issues & Solutions

### Issue: .env variables not loaded
**Symptom:** API calls fail with undefined URLs
**Solution:**
```bash
# Verify .env syntax
cat .env

# Rebuild
eas build --platform android --local --clear
```

### Issue: API timeouts in APK
**Symptom:** "Backend offline" error
**Solution:**
```bash
# Check backend URLs in .env are correct
# Verify production backends are running
# Test URLs manually:
curl https://your-api-url/health
```

### Issue: App crashes on startup
**Symptom:** Immediate crash after install
**Solution:**
```bash
# View crash logs
adb logcat | grep -i "crash\|error"

# Rebuild with verbose logging
eas build --platform android --local --verbose
```

### Issue: Large APK size (>200MB)
**Symptom:** Slow download/install
**Solution:**
```bash
# Use release build (smaller)
eas build --platform android --profile production --local

# Or build AAB instead (recommended for Play Store)
eas build --platform android --release --local
```

### Issue: Signing errors
**Symptom:** "Failed to sign APK"
**Solution:**
```bash
# Recreate signing credentials
eas credentials --clear
eas credentials
eas build --platform android --local
```

---

## Distribution Options

### Option 1: Direct APK Distribution
✅ **Pros:** Simple, no store submission
❌ **Cons:** No automatic updates, limited reach

**Steps:**
1. Build APK
2. Upload to cloud (Dropbox, GitHub, Google Drive)
3. Share link with users
4. Users download and install

### Option 2: Google Play Store
✅ **Pros:** Official store, automatic updates, wide reach
❌ **Cons:** Requires account, review process, fees

**Steps:**
1. Create Google Play Console account ($25)
2. Build AAB (Android App Bundle):
   ```bash
   eas build --platform android --release --local
   ```
3. Create app listing in Play Console
4. Upload AAB
5. Set pricing & distribution
6. Submit for review (24-48 hours)

### Option 3: Firebase App Distribution
✅ **Pros:** Easy testing distribution, no store needed
❌ **Cons:** Limited to testers

**Steps:**
1. Create Firebase project
2. Build APK
3. Upload to Firebase Console
4. Invite testers
5. Testers download from Firebase app

---

## Post-Build Steps

### Version Management
Update `app.json` for next build:
```json
{
  "expo": {
    "version": "1.0.1",  // Increment this
    "build": {
      "releaseChannel": "production"  // Add this
    }
  }
}
```

### Monitor Crashes
```bash
# After launch, monitor app crashes
adb logcat | grep -E "ANR|FATAL|CRASH|Exception"
```

### Update Procedures
For next version:
```bash
# Update version in app.json
# Update .env if backend URLs change
# Rebuild
eas build --platform android --local
```

---

## Security Checklist

- [ ] No API keys in code (only in `.env`)
- [ ] `EXPO_PUBLIC_*` variables are safe to expose
- [ ] Sensitive data (passwords) stored server-side
- [ ] HTTPS for all API calls
- [ ] No hardcoded secrets in git repo
- [ ] `.env` is in `.gitignore` (don't commit)
- [ ] User data encrypted in transit
- [ ] Permissions are minimal and necessary

---

## Troubleshooting Resources

- **EAS Build Docs:** https://docs.expo.dev/build/setup/
- **Expo Environment Variables:** https://docs.expo.dev/build-reference/variables/
- **Android Build Troubleshooting:** https://developer.android.com/studio/build/troubleshoot
- **Stack Overflow:** Tag `expo` + `android` + `build`

---

## Quick Start Command

```bash
# All-in-one (assumes setup done before)
cd e:\frontend\app
eas build --platform android --local
```

That's it! The APK will be built and downloaded. 🎉
