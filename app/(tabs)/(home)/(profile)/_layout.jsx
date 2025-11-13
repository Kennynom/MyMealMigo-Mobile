import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(personal)/index" />
      <Stack.Screen name="(health)/index" />
      <Stack.Screen name="(subscription)/index" />
    </Stack>
  );
}