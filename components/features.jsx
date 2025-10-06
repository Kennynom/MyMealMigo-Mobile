// components/features.jsx - Exact match to your MyMealMigo design
import { ThemeContext } from '@/context/ThemeContext';
import React, { useContext } from "react";
import { Platform, StyleSheet, Text, View } from 'react-native';

export function Features({ features = [] }) {
  const { theme } = useContext(ThemeContext);
  const styles = createStyles(theme);

  // Map icon names from Firebase to actual icons/emojis
  const getIconForFeature = (iconName) => {
    const iconMap = {
      'BarChart2': '📊',
      'ScanLine': '📱', 
      'Utensils': '🍽️',
      'MessageSquare': '💬',
      'Lightbulb': '💡',
      'BookOpen': '📖'
    };
    return iconMap[iconName] || '✨';
  };

  if (!features || features.length === 0) {
    return null;
  }

  return (
    <View style={styles.featuresContainer}>
      <View style={styles.featuresContent}>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.sectionLabel}>FEATURES</Text>
          <Text style={styles.sectionTitle}>
            Everything In One Place For Your Wellness Journey
          </Text>
          <Text style={styles.sectionDescription}>
            Smart tools designed to help you stay on top of your health and nutrition.
          </Text>
        </View>

        {/* Features Grid */}
        <View style={styles.featuresGrid}>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureCard}>
              {/* Icon */}
              <View style={styles.iconContainer}>
                <View style={styles.iconWrapper}>
                  <Text style={styles.featureIcon}>
                    {getIconForFeature(feature.icon)}
                  </Text>
                </View>
              </View>

              {/* Content */}
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const createStyles = (theme) => StyleSheet.create({
  featuresContainer: {
    backgroundColor: '#ffffff',
    paddingVertical: Platform.OS === 'web' ? 80 : 40,
    paddingHorizontal: 16,
  },
  
  featuresContent: {
    maxWidth: Platform.OS === 'web' ? 1200 : '100%',
    alignSelf: 'center',
    width: '100%',
  },
  
  // Header styles
  header: {
    alignItems: 'center',
    marginBottom: Platform.OS === 'web' ? 64 : 40,
  },
  
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  
  sectionTitle: {
    fontSize: Platform.OS === 'web' ? 48 : 32,
    fontWeight: '800',
    color: '#1f2937',
    textAlign: 'center',
    lineHeight: Platform.OS === 'web' ? 56 : 38,
    marginBottom: 24,
    maxWidth: Platform.OS === 'web' ? 800 : '100%',
  },
  
  sectionDescription: {
    fontSize: Platform.OS === 'web' ? 20 : 16,
    color: '#6b7280',
    textAlign: 'center',
    maxWidth: Platform.OS === 'web' ? 600 : '100%',
    lineHeight: Platform.OS === 'web' ? 30 : 24,
  },
  
  // Features grid
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Platform.OS === 'web' ? 32 : 24,
    justifyContent: 'center',
  },
  
  featureCard: {
    width: Platform.OS === 'web' ? 360 : '100%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    alignItems: Platform.OS === 'web' ? 'flex-start' : 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  
  // Icon styles
  iconContainer: {
    marginBottom: 24,
    alignSelf: Platform.OS === 'web' ? 'flex-start' : 'center',
  },
  
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#033928',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  
  featureIcon: {
    fontSize: 28,
    color: '#ffffff',
  },
  
  // Text styles
  featureTitle: {
    fontSize: Platform.OS === 'web' ? 24 : 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
    textAlign: Platform.OS === 'web' ? 'left' : 'center',
    lineHeight: Platform.OS === 'web' ? 32 : 28,
  },
  
  featureDescription: {
    fontSize: Platform.OS === 'web' ? 16 : 14,
    color: '#6b7280',
    lineHeight: Platform.OS === 'web' ? 24 : 22,
    textAlign: Platform.OS === 'web' ? 'left' : 'center',
  },
});