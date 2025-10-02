import { Stack } from 'expo-router';

export default function TrackerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="calorie-tracker" />
      <Stack.Screen name="progress-tracker" />
      <Stack.Screen name="activity-tracker" />
      <Stack.Screen name="bmi-calculator" />
      <Stack.Screen name="bmr-calculator" /> 
    </Stack>
  );
}