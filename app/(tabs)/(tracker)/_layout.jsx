import { Stack } from 'expo-router';

export default function TrackerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(calorie)/calorie-tracker" />
      <Stack.Screen name="(progress)/index" />
      <Stack.Screen name="(activity)/index" />
      <Stack.Screen name="(activity)/history" />
      <Stack.Screen name="(health-calculator)/index" /> 
    </Stack>
  );
}