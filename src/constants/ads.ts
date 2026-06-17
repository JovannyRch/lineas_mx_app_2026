import { Platform } from "react-native";
import { TestIds } from "react-native-google-mobile-ads";

const productionBannerAdUnitId = Platform.select({
  android: process.env.EXPO_PUBLIC_ADMOB_ANDROID_BANNER_UNIT_ID,
  ios: process.env.EXPO_PUBLIC_ADMOB_IOS_BANNER_UNIT_ID,
});

export const bannerAdUnitId = __DEV__
  ? TestIds.ADAPTIVE_BANNER
  : productionBannerAdUnitId;
