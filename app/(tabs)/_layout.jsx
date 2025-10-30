import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        // reduce default tab bar padding/height so icons sit closer to the content
        // and to eliminate the small white gap that appears next to the Discover tab
        // and below the floating chat bubble.
        tabBarStyle: {
          height: 64,
          paddingTop: 6,
          paddingBottom: 6,
          paddingHorizontal: 6,
          borderTopWidth: 0,
          elevation: 8,
        },
        headerShown: false,
      }}>
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
          tabBarIcon: ({ color }) => <Ionicons name="add-circle" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="(tracker)"
        options={{
          title: 'Tracker',
          tabBarIcon: ({ color }) => <FontAwesome6 name="chart-simple" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="(discover)"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color }) => <MaterialIcons name="travel-explore" size={28} color={color} />,
        }}
      />
      {/* hide the chat/index route from the tab bar (it remains routable) */}
      <Tabs.Screen
        name="chat/index"
        options={{
          tabBarButton: () => null,
        }}
      />
    </Tabs>
  );
}
