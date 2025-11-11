import { Redirect } from 'expo-router';
import React from 'react';

// On web: keep current behavior (redirect into tabs)
// On mobile: redirect to landing page first
export default function RootIndex() {

  return <Redirect href='/(auth)/landing' />;
}