import { LoginForm } from '@/components/auth/LoginForm';
import { ThemeContext } from '@/context/ThemeContext';
import { useRouter } from 'expo-router';
import React, { useContext } from 'react';
import { Dimensions, Image, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

export default function LoginScreen() {
  const { theme } = useContext(ThemeContext);
  const styles = createStyles(theme);
  const router = useRouter();

  const handleSuccess = () => {
    // After successful login, go into the app tabs
    router.replace('/(tabs)/(home)');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <View style={styles.logoContainer}>
        <Image 
          source={require('@/assets/images/mmm-text-transparent.png')} 
          style={styles.backgroundImage}
          resizeMode="contain"
        />
      </View>
      <View style={styles.formContainer}>
        <LoginForm onSuccess={handleSuccess} />
      </View>
    </SafeAreaView>
  );
}

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: 'center',
    paddingTop: SCREEN_HEIGHT > 700 ? 50 : 30,
    paddingBottom: 30,
  },
  backgroundImage: {
    width: SCREEN_WIDTH * 0.5, 
    height: SCREEN_WIDTH * 0.5, 
    maxWidth: 300, 
    maxHeight: 300,
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
  },
});
