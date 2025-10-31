import { Stack } from 'expo-router';

export default function DiscoverLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Discover home & other pages */}
      <Stack.Screen name="index" />
      <Stack.Screen name="food-dictionary" />
      <Stack.Screen name="meal-recommendations" />
      <Stack.Screen name="(recipes)/browse-recipes" options={{ headerShown: false }} />
      <Stack.Screen name="(recipes)/new" options={{ headerShown: true, title: 'Submit Recipe' }} />
      <Stack.Screen name="(recipes)/[id]" options={{ headerShown: true, title: 'Recipe Details' }} />
    </Stack>
  );
}
