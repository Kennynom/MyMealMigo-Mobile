import { Stack } from 'expo-router';

export default function DiscoverLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Discover Home & other sections */}
      <Stack.Screen name="index" />
      <Stack.Screen name="meal-recommendations" />

      {/* Recipes section */}
      <Stack.Screen name="(recipes)/browse-recipes" options={{ headerShown: false }} />
      <Stack.Screen name="(recipes)/new" options={{ headerShown: true, title: 'Submit Recipe' }} />
      <Stack.Screen name="(recipes)/[id]" options={{ headerShown: true, title: 'Recipe Details' }} />

      {/* Foods section */}
      <Stack.Screen name="(foods)/browse-foods" options={{ headerShown: false }} />
      <Stack.Screen name="(foods)/[id]" options={{ headerShown: true, title: 'Food Details' }} />
    </Stack>
  );
}
