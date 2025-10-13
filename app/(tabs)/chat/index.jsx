import React from 'react';
import { StyleSheet, View } from 'react-native';
import BotChat from '../../../components/bot-chat';

const BOTPRESS_URL = process.env.EXPO_PUBLIC_BOTPRESS_URL || 'https://your-botpress-host';
const BOT_ID = process.env.EXPO_PUBLIC_BOT_ID || 'my-bot';

export default function ChatScreen() {
  return (
    <View style={styles.container}>
      <BotChat botpressUrl={BOTPRESS_URL} botId={BOT_ID} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
});
