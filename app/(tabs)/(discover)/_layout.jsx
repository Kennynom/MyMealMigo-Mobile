import { Stack } from 'expo-router';

export default function DiscoverLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="food-dictionary" />
      <Stack.Screen name="browse-recipes" />
      <Stack.Screen name="meal-recommendations" />
    </Stack>
  );
}