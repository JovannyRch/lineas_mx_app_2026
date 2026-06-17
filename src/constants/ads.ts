import { Platform } from "react-native";
import { TestIds } from "react-native-google-mobile-ads";

const productionBannerAdUnitId = Platform.select({
  android:
    process.env.EXPO_PUBLIC_ADMOB_ANDROID_BANNER_UNIT_ID ??
    "ca-app-pub-4665787383933447/1522504220",
  ios: process.env.EXPO_PUBLIC_ADMOB_IOS_BANNER_UNIT_ID,
});

export const bannerAdUnitId = __DEV__
  ? TestIds.ADAPTIVE_BANNER
  : productionBannerAdUnitId;
