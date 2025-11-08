// app/(tabs)/(logs)/index.jsx
import { db } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';
import { ThemeContext } from '@/context/ThemeContext';
import { getUserMeals } from '@/utils/mealService';
import { router, useFocusEffect } from 'expo-router';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { useCallback, useContext, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function LogsMainScreen() {
  const { theme } = useContext(ThemeContext);
  const { user } = useAuth();
  const styles = createStyles(theme);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(true);

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Fetch recent activities when screen is focused
  useFocusEffect(
    useCallback(() => {
      const fetchRecentActivities = async () => {
        if (!user?.uid) {
          setLoadingActivities(false);
          return;
        }

        try {
          setLoadingActivities(true);
          const activities = [];

          // Fetch recent meals
          const meals = await getUserMeals(user.uid, 10); // Get last 10 meals
          meals.forEach(meal => {
            activities.push({
              type: 'meal',
              title: `${meal.mealCategory || 'Meal'} logged`,
              subtitle: meal.foodName,
              emoji: getMealEmoji(meal.mealCategory),
              timestamp: meal.timestamp,
            });
          });

          // Fetch recent journal entries
          try {
            const journalRef = collection(db, 'users', user.uid, 'private', 'health_profile', 'reflection_log');
            const journalQuery = query(journalRef, orderBy('createdAt', 'desc'), limit(10));
            const journalSnap = await getDocs(journalQuery);
            
            journalSnap.forEach(doc => {
              const data = doc.data();
              activities.push({
                type: 'reflection',
                title: 'Reflection added',
                subtitle: data.text?.substring(0, 40) + (data.text?.length > 40 ? '...' : '') || 'Journal entry',
                emoji: '📝',
                timestamp: data.createdAt?.toDate() || new Date(),
              });
            });
          } catch (journalError) {
            console.log('No journal entries found or error fetching:', journalError);
          }

          // Sort all activities by timestamp (newest first)
          activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

          // Take only the 3 most recent
          setRecentActivities(activities.slice(0, 3));
        } catch (error) {
          console.error('Error fetching recent activities:', error);
        } finally {
          setLoadingActivities(false);
        }
      };

      fetchRecentActivities();
    }, [user?.uid])
  );

  // Helper function to get emoji based on meal category
  const getMealEmoji = (category) => {
    const emojiMap = {
      breakfast: '🌅',
      lunch: '☀️',
      dinner: '🌙',
    };
    return emojiMap[category?.toLowerCase()] || '🍴';
  };

  // Helper function to format relative time
  const getRelativeTime = (timestamp) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffInMs = now - date;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Meal Logs</Text>
          <Text style={styles.subtitle}>Track and review your daily nutrition</Text>
        </View>
      </View>

      {/* Main Options */}
      <View style={styles.optionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        {/* View Meal Log → opens Meal tab */}
        <TouchableOpacity
          style={styles.optionCard}
          onPress={() => router.push('/(tabs)/(logs)/view-log')}
        >
          <View style={styles.optionIcon}>
            <Text style={styles.optionEmoji}>📋</Text>
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>View Meal Log</Text>
            <Text style={styles.optionSubtitle}>
              Review your daily meals and nutrition breakdown
            </Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        {/* View Reflections → opens Reflection tab */}
        <TouchableOpacity
          style={styles.optionCard}
          onPress={() =>
            router.push({
              pathname: '/(tabs)/(logs)/view-log',
              params: { tab: 'reflections' },
            })
          }
        >
          <View style={styles.optionIcon}>
            <Text style={styles.optionEmoji}>📝</Text>
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>View Reflections</Text>
            <Text style={styles.optionSubtitle}>
              Mental state, energy, mood across days
            </Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        {/* History */}
        <TouchableOpacity
          style={styles.optionCard}
          onPress={() => router.push('/(tabs)/(logs)/history')}
        >
          <View style={styles.optionIcon}>
            <Text style={styles.optionEmoji}>📅</Text>
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Meal History</Text>
            <Text style={styles.optionSubtitle}>
              Browse and analyze previous days
            </Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Activity */}
      <View style={styles.recentContainer}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>

        {loadingActivities ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={theme.primary} />
            <Text style={styles.loadingText}>Loading activities...</Text>
          </View>
        ) : recentActivities.length > 0 ? (
          recentActivities.map((activity, index) => (
            <View key={index} style={styles.activityCard}>
              <Text style={styles.activityEmoji}>{activity.emoji}</Text>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>{activity.title}</Text>
                <Text style={styles.activitySubtitle}>{activity.subtitle}</Text>
                <Text style={styles.activityTime}>{getRelativeTime(activity.timestamp)}</Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyText}>No recent activities</Text>
            <Text style={styles.emptySubtext}>Start logging meals or add reflections to see them here</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const createStyles = (theme) =>
  StyleSheet.create({
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
      shadowOpacity: 0.2,
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
    activitySubtitle: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 2,
    },
    activityTime: {
      fontSize: 11,
      color: theme.textSecondary,
      marginTop: 2,
      fontStyle: 'italic',
    },
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      backgroundColor: theme.surface,
      borderRadius: 8,
    },
    loadingText: {
      marginLeft: 10,
      fontSize: 14,
      color: theme.textSecondary,
    },
    emptyState: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: 30,
      alignItems: 'center',
    },
    emptyEmoji: {
      fontSize: 48,
      marginBottom: 12,
    },
    emptyText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 6,
    },
    emptySubtext: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: 'center',
    },
  });
