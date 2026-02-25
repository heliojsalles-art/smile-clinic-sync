# Smile Clinic Sync - Android APK Build Guide

## Prerequisites Installation

### 1. Install Java Development Kit (JDK 11 or higher)
- Download: https://www.oracle.com/java/technologies/downloads/
- After installation, verify:
```bash
java -version
```

### 2. Install Android Studio
- Download: https://developer.android.com/studio
- During installation, select:
  - Android SDK
  - Android SDK Platform
  - Performance (Intel ® HAXM)

### 3. Configure Environment Variables

**Windows:**
```bash
set JAVA_HOME=C:\Program Files\Java\jdk-11.x.x
set ANDROID_HOME=%USERPROFILE%\AppData\Local\Android\Sdk
```

**macOS/Linux:**
```bash
export JAVA_HOME=/path/to/jdk
export ANDROID_HOME=$HOME/Library/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

### 4. Verify Android SDK
Open Android Studio → SDK Manager and install:
- Android SDK Platform 34
- Google APIs
- Build Tools 34.0.0

## Building the APK

### Step 1: Install Dependencies
```bash
cd smile-clinic-sync
npm install
```

### Step 2: Prepare Android Project
```bash
npm run build
npm run prepare:android
npm run build:android
```

### Step 3: Open in Android Studio
```bash
npm run open:android
```

### Step 4: Build APK
In Android Studio:
1. Go to **Build** menu
2. Select **Build Bundle(s) / APK(s)**
3. Choose **Build APK(s)**
4. Wait for completion

APK location: `android/app/build/outputs/apk/debug/app-debug.apk`

## Alternative: Command Line Build

### Build Debug APK
```bash
cd android
./gradlew assembleDebug
```

### Build Release APK
```bash
cd android
./gradlew assembleRelease
```

## Install on Device

### Prerequisites
- Enable Developer Mode on Android device
- Enable USB Debugging
- Connect via USB

### Install APK
```bash
# List connected devices
adb devices

# Install APK
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

## Testing

### Run on Emulator
1. Open Android Studio
2. Launch AVD Manager
3. Create or start a virtual device
4. From Android Studio: Run → Run 'app'

### Run on Physical Device
```bash
# From Android Studio: Run → Run 'app'
# Or via command line:
adb install app-debug.apk
```

## Troubleshooting

### "JAVA_HOME not set"
```bash
# Check JAVA_HOME
echo %JAVA_HOME%  # Windows
echo $JAVA_HOME   # macOS/Linux

# Set if not configured (Windows)
set JAVA_HOME=C:\Program Files\Java\jdk-11.x.x

# Set if not configured (macOS/Linux)
export JAVA_HOME=/usr/libexec/java_home
```

### "SDK not found"
- Open Android Studio → Tools → SDK Manager
- Install API Level 34 and Build Tools

### "Gradle sync failed"
```bash
cd android
./gradlew clean
./gradlew build
```

### "App crashes on startup"
1. Check logcat: `adb logcat | grep Smile`
2. Ensure `dist` folder exists: `npm run build`
3. Sync files: `npm run build:android`

## APK Distribution

### Using Google Play Store
1. Create signed release APK:
```bash
cd android
./gradlew bundleRelease
```
2. Upload to Google Play Console

### Direct Distribution
1. Generate signed APK
2. Share `.apk` file
3. Users can install via: Settings → Apps → Install Unknown Apps

## Production Checklist

- [ ] Test on multiple Android versions
- [ ] Test on phones and tablets
- [ ] Create app icon (192x192 PNG)
- [ ] Create signed release APK
- [ ] Test signed APK on devices
- [ ] Update version number for releases
- [ ] Create privacy policy
- [ ] Prepare Google Play Store listing

---
For more info: https://capacitorjs.com/docs/android
