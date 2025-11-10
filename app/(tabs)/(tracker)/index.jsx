import { ThemeContext } from '@/context/ThemeContext';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { router } from 'expo-router';
import { useContext } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function TrackerMainScreen() {
  const { theme } = useContext(ThemeContext);
  const { isPremium } = usePremiumStatus();
  const styles = createStyles(theme);

  const trackers = [
    {
      id: 'calorie',
      title: 'Calorie Tracker',
      subtitle: 'Track daily intake',
      icon: 'restaurant',
      color: '#4ECDC4',
      route: '/(tabs)/(tracker)/(calorie)/calorie-tracker',
      premium: false,
    },
    {
      id: 'progress',
      title: 'Progress Tracker',
      subtitle: 'Monitor weight goals',
      icon: 'trending-up',
      color: theme.altAccent,
      route: '/(tabs)/(tracker)/(progress)',
      premium: true,
    },
    {
      id: 'activity',
      title: 'Activity Tracker',
      subtitle: 'Log your workouts',
      icon: 'directions-run',
      color: '#F38181',
      route: '/(tabs)/(tracker)/(activity)',
      premium: false,
    },
    {
      id: 'calculator',
      title: 'Health Calculator',
      subtitle: 'BMI, BMR & more',
      icon: 'calculate',
      color: theme.primary,
      route: '/(tabs)/(tracker)/(health-calculator)',
      premium: false,
    }
  ];

  const handleTrackerPress = (tracker) => {
    if (tracker.premium && !isPremium) {
      Alert.alert(
        '🔒 Premium Feature',
        'Progress Tracker is a premium feature. Upgrade to monitor your weight goals and track your progress over time!',
        [
          {
            text: 'Upgrade Now',
            onPress: () => router.push('/(tabs)/(home)/(profile)/(subscription)')
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
      return;
    }
    router.push(tracker.route);
  };

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
        scrollEnabled={false}
      >
        <View style={styles.cardsContainer}>
          {trackers.map((tracker) => (
            <TouchableOpacity 
              key={tracker.id}
              style={[
                styles.trackerCard,
                tracker.premium && !isPremium && styles.trackerCardLocked
              ]}
              onPress={() => handleTrackerPress(tracker)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconCircle, { backgroundColor: tracker.color + '20' }]}>
                <MaterialIcons 
                  name={tracker.premium && !isPremium ? 'lock' : tracker.icon} 
                  size={32} 
                  color={tracker.premium && !isPremium ? theme.textSecondary : tracker.color} 
                />
              </View>
              <View style={styles.cardContent}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={[
                    styles.cardTitle,
                    tracker.premium && !isPremium && styles.cardTitleLocked
                  ]}>
                    {tracker.title}
                  </Text>
                  {tracker.premium && !isPremium && (
                    <View style={styles.premiumBadge}>
                      <Text style={styles.premiumBadgeText}>Premium</Text>
                    </View>
                  )}
                </View>
                <Text style={[
                  styles.cardSubtitle,
                  tracker.premium && !isPremium && styles.cardSubtitleLocked
                ]}>
                  {tracker.subtitle}
                </Text>
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
    paddingTop: 10,
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
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  trackerCardLocked: {
    opacity: 0.5,
    backgroundColor: theme.surface,
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
  cardTitleLocked: {
    color: theme.textSecondary,
  },
  cardSubtitle: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  cardSubtitleLocked: {
    opacity: 0.7,
  },
  premiumBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: theme.primary + '20',
    borderRadius: 8,
  },
  premiumBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.primary,
    letterSpacing: 0.5,
  },
});