import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="personal" />
      <Stack.Screen name="health" />
      <Stack.Screen name="par-q" />
      <Stack.Screen name="subscription" />
      <Stack.Screen name="delete" />
    </Stack>
  );
}