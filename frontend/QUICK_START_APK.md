# 🚀 Quick Start: Build APK in 5 Minutes

## What You Need to Know About `.env` 

✅ **YES, the .env is included in the APK!**
- Expo automatically embeds `EXPO_PUBLIC_*` variables into the APK at build time
- Variables become part of the app binary
- Users don't need a separate `.env` file
- Your current `.env` is perfect as-is

---

## 🎯 Quick Start (Fastest Path)

### Prerequisites (2 minutes)
```bash
# 1. Install EAS CLI (global)
npm install -g eas-cli

# 2. Login to Expo account
eas login
```

### Build APK (2 minutes)
```bash
# 3. Navigate to app
cd e:\frontend\app

# 4. Build
eas build --platform android --local

# 5. Wait for build to complete
# Download link will be shown in terminal
```

**Total time: ~4-10 minutes** ⏱️

---

## 📋 Pre-Flight Checklist

Before building, verify:

```bash
cd e:\frontend\app

# ✅ Check 1: .env exists and has backend URLs
cat .env

# ✅ Check 2: App version is set
grep '"version"' app.json

# ✅ Check 3: All backends are live
curl https://shadowbytex22-hf-diniru-photo-spelling-deploy.hf.space/
curl https://research-25-26j-333-chathuranga-backend.onrender.com/
curl https://savindunawarathne-dyslexia-backend.hf.space/
```

---

## 🏗️ Build Command Explained

```bash
eas build --platform android --local
#           └─ Android platform
#                           └─ Builds locally on your machine
#                              (not in Expo cloud)
```

### Alternative Options

```bash
# Production release (optimized)
eas build --platform android --local --release

# With verbose logging (if issues occur)
eas build --platform android --local --verbose

# Skip cache (fresh build)
eas build --platform android --local --clear
```

---

## 📱 After Build

### Download APK
```bash
# APK saved in your project directory
# Download location shown in terminal
# Or check: e:\frontend\app\app-release.apk
```

### Install on Device
```bash
# On Android device via USB
adb install app-release.apk

# Or send to device
# Share file via Dropbox/Google Drive
# Download on Android phone
# Tap to install
```

### Test on Emulator
```bash
# Start Android emulator first
emulator -avd Pixel_5

# Install APK
adb install app-release.apk

# Check it works
adb shell am start -n com.dyslearnapp/.MainActivity
```

---

## 🎮 What Gets Included in APK

✅ **Included (Auto-embedded from .env):**
```
✅ EXPO_PUBLIC_PHOTO_SPELLING_API_URL
✅ EXPO_PUBLIC_WRITING_MATH_API_URL
✅ EXPO_PUBLIC_MULTI_SKILL_API_URL
✅ EXPO_PUBLIC_ACTION_DETECTION_API_URL
```

✅ **Also Included:**
- All your React Native code
- All images/fonts/assets
- App permissions
- All dependencies compiled

❌ **NOT Included:**
- `.env` file itself (values are extracted and embedded)
- node_modules (compiled)
- Git history
- Development dependencies

---

## ⚠️ Common Issues & Quick Fixes

### "Build failed"
```bash
# Try clean build
eas build --platform android --local --clear
```

### "API URLs not found"
```bash
# Verify .env has EXPO_PUBLIC_ prefix
grep "EXPO_PUBLIC_" e:\frontend\app\.env
```

### "Not logged in"
```bash
eas login
# Sign in with Expo account
```

### APK too large (>250MB)
```bash
# Use release build
eas build --platform android --release --local

# Or use AAB for Play Store
eas build --platform android --release --local
```

---

## 📊 Build Workflow

```
1. eas build --platform android --local
        ↓
2. Build starts in Expo cloud
        ↓
3. Fetches .env variables ✅
        ↓
4. Embeds them in APK
        ↓
5. Compiles with Gradle
        ↓
6. Signs APK
        ↓
7. Ready for download! 🎉
        ↓
8. You download & install
```

---

## 🔐 Security Notes

- `EXPO_PUBLIC_*` variables **ARE visible** in decompiled APK (this is normal)
- API URLs are not sensitive (they're already in your app)
- Never put real secrets in `EXPO_PUBLIC_*`
- Use backend authentication for sensitive operations
- Your `.env` file is **local only** (don't commit to git)

---

## 📦 Distribution Options

### Quick Test
```bash
adb install app-release.apk  # Direct install
```

### Share with Users
```bash
# Upload APK to:
# - Dropbox
# - Google Drive
# - GitHub Releases
# - Your website
# Users download & install
```

### Google Play Store
```bash
# Build AAB instead of APK
eas build --platform android --local --release

# Upload to Google Play Console
# ~$25 one-time developer fee
# Review takes 24-48 hours
```

---

## 🎯 Next Steps

### If this is your first time:
1. Run `eas login`
2. Run `eas build:configure` (one-time setup)
3. Run `eas credentials` (one-time setup)
4. Run `eas build --platform android --local`

### If already set up:
```bash
cd e:\frontend\app
eas build --platform android --local
```

---

## 📞 Need Help?

Check the detailed guides:
- [`BUILD_APK_GUIDE.md`](./BUILD_APK_GUIDE.md) - Complete reference
- [`APK_PRODUCTION_CHECKLIST.md`](./APK_PRODUCTION_CHECKLIST.md) - Pre-build checklist
- Run `eas doctor` for diagnostics

---

## 💡 Pro Tips

1. **Version incrementing:** Update `app.json` version before each build
2. **Testing:** Always test APK on emulator/device before release
3. **Backends:** Keep `.env` URLs in sync with running services
4. **Size:** Release builds are smaller (~100MB vs ~150MB dev)
5. **Updates:** EAS can handle OTA updates without rebuilding

---

## Summary

```
✅ .env is embedded in APK automatically
✅ Build locally with: eas build --platform android --local
✅ Takes 5-10 minutes
✅ Download and install on device
✅ Ready for distribution!
```

🚀 **You're ready to build!**
