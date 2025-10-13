import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Props = {
  onPress: () => void;
};

export default function ChatButton({ onPress }: Props) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.button} accessibilityLabel="Open chat">
      <View style={styles.inner}>
        <Text style={styles.icon}>💬</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#007aff',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    zIndex: 1000,
  },
  inner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  icon: { color: '#fff', fontSize: 28 },
});
