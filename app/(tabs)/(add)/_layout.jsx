import { Stack } from 'expo-router';

export default function AddLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      {/* <Stack.Screen name="manual-entry" />
      <Stack.Screen name="scan-barcode" />
      <Stack.Screen name="photo-capture" />
      <Stack.Screen name="search-food" /> */}
    </Stack>
  );
}