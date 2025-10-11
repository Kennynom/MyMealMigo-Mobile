import { Redirect } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

// On web: keep current behavior (redirect into tabs)
// On mobile: redirect to full-screen login route first
export default function RootIndex() {
  if (Platform.OS === 'web') {
    return <Redirect href='/(tabs)/(home)' />;
  }

  return <Redirect href='/(auth)/login' />;
}