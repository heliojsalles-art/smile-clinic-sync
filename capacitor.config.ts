import { CapacitorConfig } from '@capacitor/renovate';
 
const config: CapacitorConfig = {
  appId: 'com.smileclinic.sync',
  appName: 'Smile Clinic Sync',
  webDir: 'www',
  bundledWebRuntime: false,
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
    },
    StatusBar: {
      style: 'DARK',
    },
  },
  android: {
    minSdkVersion: 21,
    compileSdkVersion: 31,
    targetSdkVersion: 31,
    versionCode: 1,
    versionName: '1.0.0',
  },
};

export default config;