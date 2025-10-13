import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

type Props = { onPress: () => void };

export default function TouchableClose({ onPress }: Props) {
  return (
    <TouchableOpacity
      style={styles.btn}
      onPress={onPress}
      accessibilityLabel="Close chat"
      activeOpacity={0.7}
    >
      <Text style={styles.text}>✕</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: { padding: 14, minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.9)' },
  text: { fontSize: 20, color: '#333' },
});
