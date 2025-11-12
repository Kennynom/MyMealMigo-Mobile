// components/ui/PremiumGate.jsx
import { ThemeContext } from '@/context/ThemeContext';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useContext } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

/**
 * Component that overlays content with an upgrade prompt for free users
 * @param {boolean} isPremium - Whether the user has premium access
 * @param {React.ReactNode} children - Content to dim if not premium
 * @param {string} featureName - Name of the feature being gated (optional)
 */
export default function PremiumGate({ isPremium, children, featureName = 'this feature' }) {
  const { theme } = useContext(ThemeContext);
  const router = useRouter();
  const styles = createStyles(theme);
 
  if (isPremium) {
    return <>{children}</>;
  }

  return (
    <View style={styles.container}>
      {/* Original content (will be dimmed) */}
      <View style={styles.contentWrapper}>
        {children}
      </View>

      {/* Overlay with semi-transparent background */}
      <View style={styles.overlay}>
        <View style={styles.upgradePrompt}>
          <View style={styles.iconCircle}>
            <MaterialIcons name="diamond" size={32} color={theme.primary} />
          </View>
          <Text style={styles.upgradeTitle}>Premium Feature</Text>
          <Text style={styles.upgradeMessage}>
            Upgrade to Premium to unlock {featureName}
          </Text>
          <Pressable
            style={styles.upgradeButton}
            onPress={() => router.push('/(tabs)/(home)/(profile)/(subscription)')}
          >
            <MaterialIcons name="arrow-upward" size={18} color={theme.altText} style={{ marginRight: 6 }} />
            <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    container: {
      position: 'relative',
      flex: 1,
      overflow: 'hidden',
    },
    contentWrapper: {
      flex: 1,
      opacity: 0.3,
    },
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
      backgroundColor: theme.background,
    },
    upgradePrompt: {
      paddingHorizontal: 24,
      paddingVertical: 32,
      borderRadius: 20,
      alignItems: 'center',
      maxWidth: 320,
      backgroundColor: theme.surface,
      borderColor: theme.border,
      borderWidth: 1,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
    },
    iconCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
      backgroundColor: theme.primary + '20',
    },
    upgradeTitle: {
      fontSize: 20,
      fontWeight: '700',
      marginBottom: 8,
      textAlign: 'center',
      color: theme.text,
    },
    upgradeMessage: {
      fontSize: 14,
      textAlign: 'center',
      marginBottom: 24,
      lineHeight: 20,
      color: theme.textSecondary,
    },
    upgradeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: theme.primary,
    },
    upgradeButtonText: {
      color: theme.altText,
      fontSize: 16,
      fontWeight: '600',
    },
  });
}
