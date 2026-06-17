import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform, useColorScheme } from 'react-native';
import mobileAds, { MaxAdContentRating } from 'react-native-google-mobile-ads';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }

    void mobileAds()
      .setRequestConfiguration({
        maxAdContentRating: MaxAdContentRating.PG,
        testDeviceIdentifiers: ['EMULATOR'],
      })
      .then(() => mobileAds().initialize())
      .catch((error) => {
        console.warn('Unable to initialize Google Mobile Ads:', error);
      });
  }, []);

  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colorScheme === 'dark' ? '#0A0A0F' : '#F8F9FC' },
        }}
      />
    </>
  );
}
