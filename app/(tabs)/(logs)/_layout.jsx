import { Stack } from 'expo-router';

export default function LogsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="view-log" />
      {/* <Stack.Screen name="add-meal" />
      <Stack.Screen name="history" />
      <Stack.Screen name="favorites" /> */}
    </Stack>
  );
}