import { ThemeContext } from '@/context/ThemeContext';
import { router } from 'expo-router';
import { useContext } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function TrackerMainScreen() {
  const { theme } = useContext(ThemeContext);
  const styles = createStyles(theme);

  const trackers = [
    {
      id: 'calorie',
      title: 'Calorie Tracker',
      subtitle: 'Track daily intake',
      icon: 'restaurant',
      color: '#4ECDC4',
      route: 'calorie-tracker'
    },
    {
      id: 'progress',
      title: 'Progress Tracker',
      subtitle: 'Monitor weight goals',
      icon: 'trending-up',
      color: '#FF6B6B',
      route: '/(tabs)/(tracker)/(progress)'
    },
    {
      id: 'activity',
      title: 'Activity Tracker',
      subtitle: 'Log your workouts',
      icon: 'directions-run',
      color: '#95E1D3',
      route: '/(tabs)/(tracker)/(activity)'
    },
    {
      id: 'calculator',
      title: 'Health Calculator',
      subtitle: 'BMI, BMR & more',
      icon: 'calculate',
      color: '#F38181',
      route: '/(tabs)/(tracker)/(health-calculator)'
    }
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Tracker</Text>
          <Text style={styles.headerSubtitle}>Monitor your health journey</Text>
        </View>
      </View>

      {/* Tracker Cards */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.cardsContainer}>
          {trackers.map((tracker) => (
            <TouchableOpacity 
              key={tracker.id}
              style={styles.trackerCard}
              onPress={() => router.push(tracker.route)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconCircle, { backgroundColor: tracker.color + '20' }]}>
                <MaterialIcons name={tracker.icon} size={32} color={tracker.color} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{tracker.title}</Text>
                <Text style={styles.cardSubtitle}>{tracker.subtitle}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: theme.background,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: theme.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  cardsContainer: {
    gap: 16,
  },
  trackerCard: {
    backgroundColor: theme.cardBackground || theme.background,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: theme.textSecondary,
  },
});