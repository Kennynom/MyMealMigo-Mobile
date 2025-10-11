import { LoginForm } from '@/components/auth/LoginForm';
import { ThemeContext } from '@/context/ThemeContext';
import { useRouter } from 'expo-router';
import React, { useContext } from 'react';
import { StyleSheet, View } from 'react-native';

export default function LoginScreen() {
  const { theme } = useContext(ThemeContext);
  const router = useRouter();

  const handleSuccess = () => {
    // After successful login, go into the app tabs
    router.replace('/(tabs)/(home)');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}> 
      <LoginForm onSuccess={handleSuccess} />
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
