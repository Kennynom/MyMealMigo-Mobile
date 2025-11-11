import { JournalProvider } from '@/context/JournalContext';
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useContext } from 'react';
import { Platform, useColorScheme, View } from 'react-native';
import 'react-native-reanimated';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { PlatformGuard } from '../components/auth/PlatformGuard';
import { AuthProvider } from '../context/AuthContext';
import { ThemeContext, ThemeProvider } from '../context/ThemeContext';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

function RootLayoutContent() {
  const colorScheme = useColorScheme();
  const { theme } = useContext(ThemeContext);
  const insets = useSafeAreaInsets();
  
  if (Platform.OS === 'android') {
    // Android: Custom safe area handling with different colors for top and bottom
    return (
      <>
        {/* Top safe area - matches screen background */}
        <View style={{ height: insets.top, backgroundColor: theme.background }} />
        
        <View style={{ flex: 1, backgroundColor: theme.background }}>
          <PlatformGuard>
            <NavigationThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="+not-found" />
              </Stack>
              <StatusBar style="auto" />
            </NavigationThemeProvider>
          </PlatformGuard>
        </View>
        
        {/* Bottom safe area - matches tab bar */}
        <View style={{ height: insets.bottom, backgroundColor: theme.primaryDark }} />
      </>
    );
  }
  
  // iOS: Use standard SafeAreaView with top only
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top']}>
      <PlatformGuard>
        <NavigationThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="auto" />
        </NavigationThemeProvider>
      </PlatformGuard>
    </SafeAreaView>
  );
}

function RootLayoutWithProvider() {
  return (
    <SafeAreaProvider>
      <RootLayoutContent />
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <JournalProvider>
          <RootLayoutWithProvider />
        </JournalProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
