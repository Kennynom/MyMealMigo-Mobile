// app/(journal)/_layout.jsx
import { Stack } from "expo-router";

export default function JournalLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
