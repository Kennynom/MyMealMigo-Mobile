// app/(tabs)/_layout.jsx - Smart platform detection
import WebLayout from '@/components/layouts/WebLayout';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { ThemeContext } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Tabs } from 'expo-router';
import React, { useContext } from 'react';
import { Platform } from 'react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { theme } = useContext(ThemeContext);

  // ON WEB: Use WebLayout wrapper + hide tabs
  if (Platform.OS === 'web') {
    return (
      <WebLayout>
        <Tabs
          screenOptions={{
            tabBarStyle: { display: 'none' }, // ← HIDE TABS ON WEB
            headerShown: false,
          }}
          initialRouteName='(home)'>
        </Tabs>
      </WebLayout>
    );
  }

  // ON MOBILE: Keep your existing tab layout unchanged
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
      }}
      initialRouteName="(home)">
      <Tabs.Screen
        name="(home)"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="(logs)"
        options={{
          title: 'Logs',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="book.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="(add)"
        options={{
          title: 'Add',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="plus.circle.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="(tracker)"
        options={{
          title: 'Tracker',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="chart.line.uptrend.xyaxis" color={color} />,
        }}
      />
      <Tabs.Screen
        name="(discover)"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="magnifyingglass.circle.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}