import { SignUpForm } from '@/components/auth/SignUpForm';
import { ThemeContext } from '@/context/ThemeContext';
import { useRouter } from 'expo-router';
import React, { useContext } from 'react';
import { StyleSheet, View } from 'react-native';

export default function SignUpScreen() {
  const { theme } = useContext(ThemeContext);
  const router = useRouter();

  const handleSuccess = () => {
    // After signup, navigate to profile setup before entering the app
    router.replace('/(auth)/profile-setup');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}> 
      <SignUpForm onSuccess={handleSuccess} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
});
