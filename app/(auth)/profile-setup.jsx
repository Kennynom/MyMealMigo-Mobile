import ProfileSetup from '@/components/forms/ProfileSetup';
import { ThemeContext } from '@/context/ThemeContext';
import { useRouter } from 'expo-router';
import React, { useContext } from 'react';
import { StyleSheet, View } from 'react-native';

export default function ProfileSetupScreen() {
  const { theme } = useContext(ThemeContext);
  const router = useRouter();

  const handleComplete = () => {
    // After profile setup, send user into the app (tabs/home)
    router.replace('/(tabs)/(home)');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}> 
      <ProfileSetup onComplete={handleComplete} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 16 },
});
