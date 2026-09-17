import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
} from '@expo-google-fonts/poppins';

import { Platform } from 'react-native';

if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const styleTagId = 'digilocal-global-focus-theme';
  let styleEl = document.getElementById(styleTagId) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleTagId;
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = `
    *, *::before, *::after {
      -webkit-tap-highlight-color: transparent !important;
    }
    input, textarea, select, [contenteditable], [tabindex], [data-focusable="true"], .css-textinput-11aywtz {
      outline: none !important;
      outline-width: 0 !important;
      outline-style: none !important;
      outline-color: transparent !important;
      -webkit-tap-highlight-color: transparent !important;
      -webkit-focus-ring-color: transparent !important;
      box-shadow: none !important;
    }
    input:focus, textarea:focus, select:focus, [contenteditable]:focus, [tabindex]:focus,
    input:focus-visible, textarea:focus-visible, select:focus-visible, [contenteditable]:focus-visible, [tabindex]:focus-visible,
    [data-focusable="true"]:focus, [data-focusable="true"]:focus-visible, .css-textinput-11aywtz:focus {
      outline: none !important;
      outline-width: 0 !important;
      outline-style: none !important;
      outline-color: transparent !important;
      -webkit-tap-highlight-color: transparent !important;
      -webkit-focus-ring-color: transparent !important;
      box-shadow: none !important;
    }
    ::selection {
      background-color: rgba(84, 29, 38, 0.25) !important;
    }
    ::-moz-selection {
      background-color: rgba(84, 29, 38, 0.25) !important;
    }
  `;
}

export default function Layout() {
  const [fontsLoaded] = useFonts({
    Poppins: Poppins_400Regular,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800Bold: Poppins_800ExtraBold,
    Poppins_800ExtraBold,
    'Poppins-Regular': Poppins_400Regular,
    'Poppins-Medium': Poppins_500Medium,
    'Poppins-SemiBold': Poppins_600SemiBold,
    'Poppins-Bold': Poppins_700Bold,
    'Poppins-ExtraBold': Poppins_800ExtraBold,
  });

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
