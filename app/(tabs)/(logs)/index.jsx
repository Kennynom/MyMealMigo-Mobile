import { Image } from 'expo-image';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useContext } from 'react';
import { ThemeContext } from '@/context/ThemeContext';
import { router } from 'expo-router';

export default function LogsMainScreen() {
  const { colorScheme, setColorScheme, theme } = useContext(ThemeContext);
  const styles = createStyles(theme, colorScheme);

  const toggleTheme = () => {
    setColorScheme(colorScheme === 'dark' ? 'light' : 'dark');
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Meal Logs</Text>
          <Text style={styles.subtitle}>Track and review your daily nutrition</Text>
        </View>
        <TouchableOpacity style={styles.themeButton} onPress={toggleTheme}>
          <Text style={styles.themeIcon}>{colorScheme === 'dark' ? '☀️' : '🌙'}</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>3</Text>
          <Text style={styles.statLabel}>Meals Today</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>1,850</Text>
          <Text style={styles.statLabel}>Calories</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>85%</Text>
          <Text style={styles.statLabel}>Goal Progress</Text>
        </View>
      </View>

      {/* Main Options */}
      <View style={styles.optionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <TouchableOpacity 
          style={styles.optionCard}
          onPress={() => router.push('/(tabs)/(logs)/view-log')}
        >
          <View style={styles.optionIcon}>
            <Text style={styles.optionEmoji}>📋</Text>
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>View Meal Log</Text>
            <Text style={styles.optionSubtitle}>Review your daily meals and nutrition breakdown</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.optionCard}
          onPress={() => router.push('/(tabs)/(logs)/add-meal')}
        >
          <View style={styles.optionIcon}>
            <Text style={styles.optionEmoji}>➕</Text>
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Add New Meal</Text>
            <Text style={styles.optionSubtitle}>Log a new meal or snack with photos</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.optionCard}
          onPress={() => router.push('/(tabs)/(logs)/history')}
        >
          <View style={styles.optionIcon}>
            <Text style={styles.optionEmoji}>📅</Text>
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Meal History</Text>
            <Text style={styles.optionSubtitle}>Browse and analyze previous days</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.optionCard}
          onPress={() => router.push('/(tabs)/(logs)/favorites')}
        >
          <View style={styles.optionIcon}>
            <Text style={styles.optionEmoji}>⭐</Text>
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Favorite Meals</Text>
            <Text style={styles.optionSubtitle}>Quick access to your go-to meals</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Activity */}
      <View style={styles.recentContainer}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        
        <View style={styles.activityCard}>
          <Text style={styles.activityEmoji}>🍳</Text>
          <View style={styles.activityContent}>
            <Text style={styles.activityTitle}>Breakfast logged</Text>
            <Text style={styles.activityTime}>2 hours ago</Text>
          </View>
        </View>

        <View style={styles.activityCard}>
          <Text style={styles.activityEmoji}>🥗</Text>
          <View style={styles.activityContent}>
            <Text style={styles.activityTitle}>Lunch logged</Text>
            <Text style={styles.activityTime}>Yesterday</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const createStyles = (theme, colorScheme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingTop: 60,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: theme.textSecondary,
  },
  themeButton: {
    width: 40,
    height: 40,
    backgroundColor: theme.surface,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeIcon: {
    fontSize: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 30,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: theme.textSecondary,
    textAlign: 'center',
  },
  optionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 15,
  },
  optionCard: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  optionIcon: {
    width: 44,
    height: 44,
    backgroundColor: theme.primary,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionEmoji: {
    fontSize: 20,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 18,
  },
  arrow: {
    fontSize: 20,
    color: theme.textSecondary,
    marginLeft: 8,
  },
  recentContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  activityCard: {
    backgroundColor: theme.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.text,
  },
  activityTime: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 2,
  },
});
