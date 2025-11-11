import { ThemeContext } from '@/context/ThemeContext';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { useRouter } from 'expo-router';
import React, { useContext } from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

export default function LandingScreen() {
  const { theme } = useContext(ThemeContext);
  const styles = createStyles(theme);
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      {/* Logo Section - Positioned at top */}
      <View style={styles.logoSection}>
        <Image
          source={require('@/assets/images/mmm-logo-transparent.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Main Content - Features and Button */}
      <View style={styles.content}>
        {/* Features Section */}
        <View style={styles.featuresSection}>
          <View style={[styles.featureItem, { backgroundColor: theme.primary + '10' }]}>
            <View style={[styles.iconContainer, { backgroundColor: theme.primary + '20' }]}>
              <FontAwesome6 name="utensils" size={20} color={theme.primary} />
            </View>
            <Text style={styles.featureText}>Track your meals & calories</Text>
          </View>
          <View style={[styles.featureItem, { backgroundColor: theme.secondary + '10' }]}>
            <View style={[styles.iconContainer, { backgroundColor: theme.secondary + '20' }]}>
              <FontAwesome6 name="camera" size={20} color={theme.secondary} />
            </View>
            <Text style={styles.featureText}>Scan food with AI recognition</Text>
          </View>
          <View style={[styles.featureItem, { backgroundColor: theme.altAccent + '10' }]}>
            <View style={[styles.iconContainer, { backgroundColor: theme.altAccent + '20' }]}>
              <FontAwesome6 name="chart-line" size={20} color={theme.altAccent} />
            </View>
            <Text style={styles.featureText}>Monitor your progress</Text>
          </View>
          <View style={[styles.featureItem, { backgroundColor: theme.coolAccent + '10' }]}>
            <View style={[styles.iconContainer, { backgroundColor: theme.coolAccent + '20' }]}>
              <FontAwesome6 name="bowl-food" size={20} color={theme.coolAccent} />
            </View>
            <Text style={styles.featureText}>Get personalized recommendations</Text>
          </View>
        </View>

        {/* CTA Button */}
        <View style={styles.buttonSection}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: theme.primary }]}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2025 MyMealMigo</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
  },
  logoSection: {
    alignItems: 'center',
    marginTop: SCREEN_HEIGHT > 700 ? -30 : -20,
    paddingBottom: 20,
  },
  logo: {
    width: SCREEN_WIDTH * 0.7,
    height: SCREEN_WIDTH * 0.7,
    maxWidth: 320,
    maxHeight: 320,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    marginTop: -60, // Overlap logo
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  featuresSection: {
    gap: 12,
    paddingTop: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  featureText: {
    fontSize: 16,
    color: theme.text,
    flex: 1,
    fontWeight: '600',
  },
  buttonSection: {
    marginTop: 20,
    marginBottom: 12,
  },
  primaryButton: {
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryButtonText: {
    color: theme.altText,
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingTop: 20,
  },
  footerText: {
    fontSize: 11,
    color: theme.textSecondary,
    opacity: 0.6,
  },
});
