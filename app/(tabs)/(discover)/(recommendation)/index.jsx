// app/(tabs)/(discover)/(recommendation)/index.jsx
import { ThemeContext } from '@/context/ThemeContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import React, { useContext } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function MealRecommendationsScreen() {
  const { theme } = useContext(ThemeContext);
  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meal Recommendations</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.comingSoonContainer}>
          <Ionicons name="restaurant" size={80} color={theme.primary} />
          <Text style={styles.comingSoonTitle}>Coming Soon!</Text>
          <Text style={styles.comingSoonText}>
            Personalized meal recommendations based on your dietary preferences, health goals, and nutritional needs.
          </Text>
          
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={24} color={theme.primary} />
              <Text style={styles.featureText}>AI-powered meal suggestions</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={24} color={theme.primary} />
              <Text style={styles.featureText}>Tailored to your dietary needs</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={24} color={theme.primary} />
              <Text style={styles.featureText}>Balanced nutrition plans</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={24} color={theme.primary} />
              <Text style={styles.featureText}>Local cuisine recommendations</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 56,
      paddingBottom: 16,
      backgroundColor: theme.background,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.surface,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: theme.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    backText: {
    color: theme.text,
    fontSize: 20,
    fontWeight: '600',
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.text,
    },
    content: {
      flex: 1,
    },
    contentContainer: {
      padding: 16,
    },
    comingSoonContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
    },
    comingSoonTitle: {
      fontSize: 28,
      fontWeight: '800',
      color: theme.text,
      marginTop: 24,
      marginBottom: 12,
    },
    comingSoonText: {
      fontSize: 16,
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
      maxWidth: 320,
      marginBottom: 40,
    },
    featuresList: {
      width: '100%',
      maxWidth: 400,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.surface,
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    featureText: {
      fontSize: 15,
      color: theme.text,
      fontWeight: '600',
      marginLeft: 12,
      flex: 1,
    },
  });
}
