// app/(tabs)/_layout.jsx - Smart platform detection
import { ThemeContext } from '@/context/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Tabs } from 'expo-router';
import React, { useContext } from 'react';
import { View } from 'react-native';

// Simple Tab Icon Component
function TabIcon({ name, color, focused }) {
  return (
    <View style={{ transform: [{ scale: focused ? 1.5 : 1 }] }}>
      <MaterialIcons name={name} size={24} color={color} />
    </View>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { theme } = useContext(ThemeContext);

  // ON MOBILE: Keep your existing tab layout unchanged
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.altText,
        tabBarInactiveTintColor: theme.primary,
        headerShown: false,
        tabBarStyle: {
          paddingHorizontal: 5,
          height: 70,
          paddingTop: 5,
          justifyContent: 'center',
          backgroundColor: theme.primaryDark,
        },
      }}
      initialRouteName="(home)">
      <Tabs.Screen
        name="(home)"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => <TabIcon name="home" color={theme.altText} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="(logs)"
        options={{
          title: 'Logs',
          tabBarIcon: ({ color, focused }) => <TabIcon name="event-note" color={theme.altText} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="(add)"
        options={{
          title: 'Add',
          tabBarIcon: ({ color, focused }) => <TabIcon name="add-circle" color={theme.altText} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="(tracker)"
        options={{
          title: 'Tracker',
          tabBarIcon: ({ color, focused }) => <TabIcon name="bar-chart" color={theme.altText} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="(discover)"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color, focused }) => <TabIcon name="run-circle" color={theme.altText} focused={focused} />,
        }}
      />
    </Tabs>
  );
}