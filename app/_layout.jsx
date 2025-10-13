import { DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import 'react-native-reanimated';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import BotChat from '../components/bot-chat';
import ChatButton from '../components/chat-button';
import TouchableClose from '../components/touchable-close';
import { ThemeProvider } from '../context/ThemeContext';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function RootLayout() {
  const [open, setOpen] = useState(false);
  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <NavigationThemeProvider value={DefaultTheme}>
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="+not-found" />
            </Stack>
            <StatusBar style="auto" />
            <Modal visible={open} transparent={true} animationType="slide" onRequestClose={() => setOpen(false)}>
              <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                  <BotChat
                    botpressUrl={process.env.EXPO_PUBLIC_BOTPRESS_URL || 'https://your-botpress-host'}
                    botId={process.env.EXPO_PUBLIC_BOT_ID || 'my-bot'}
                    onClose={() => setOpen(false)}
                  />
                </View>
                <View style={styles.closeOverlay} pointerEvents="box-none">
                  <View style={styles.closeWrapper} pointerEvents="box-none">
                    <TouchableClose onPress={() => setOpen(false)} />
                  </View>
                </View>
              </View>
            </Modal>
            {/** close button is rendered inside modal overlay to ensure touch events reach it */}
            <ChatButton onPress={() => setOpen((prev) => !prev)} />
          </NavigationThemeProvider>
        </SafeAreaView>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.05)' },
  modalContainer: { flex: 1, backgroundColor: '#fff', marginTop: 40 },
  closeOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  closeWrapper: { position: 'absolute', top: 8, right: 8, zIndex: 2000 },
});
