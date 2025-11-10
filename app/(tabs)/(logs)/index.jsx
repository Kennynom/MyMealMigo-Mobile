// app/(tabs)/(logs)/index.jsx
import { db } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';
import { ThemeContext } from '@/context/ThemeContext';
import { getUserMeals } from '@/utils/mealService';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
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
      breakfast: <MaterialCommunityIcons name="weather-sunset" size={28} color="orangered" />,
      lunch: <MaterialCommunityIcons name="weather-sunny" size={28} color="orange" />,
      dinner: <MaterialCommunityIcons name="weather-moonset" size={28} color="royalblue" />,
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
    <View style={styles.container}>
      {/* Header - Centered like Add */}
      <View style={styles.header}>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Meal Logs</Text>
          <Text style={styles.headerSubtitle}>Track and review your daily nutrition</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
      {/* Main Options */}
      <View style={styles.optionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        {/* View Meal Log → opens Meal tab */}
        <TouchableOpacity
          style={styles.optionCard}
          onPress={() => router.push('/(tabs)/(logs)/view-log')}
          activeOpacity={0.7}
        >
          <View style={[styles.optionIcon, { backgroundColor: theme.primary + '20' }]}>
            <MaterialIcons name="restaurant-menu" size={32} color={theme.primary} />
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
          activeOpacity={0.7}
        >
          <View style={[styles.optionIcon, { backgroundColor: '#F38181' + '20' }]}>
            <MaterialIcons name="edit-note" size={32} color='#F38181' />
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
          activeOpacity={0.7}
        >
          <View style={[styles.optionIcon, { backgroundColor: '#4ECDC4' + '20' }]}>
            <MaterialIcons name="history" size={32} color='#4ECDC4' />
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
    </View>
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
      textAlign: 'center',
    },
    scrollView: {
      flex: 1,
      paddingTop: 10,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 100,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 100,
    },
    optionsContainer: {
      marginBottom: 30,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 15,
    },
    optionCard: {
      backgroundColor: theme.background,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      flexDirection: 'row',
      alignItems: 'center',
    },
    optionIcon: {
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
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
      marginBottom: 30,
    },
    activityCard: {
      backgroundColor: theme.cardBackground || theme.background,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    activityEmoji: {
      fontSize: 20,
      marginRight: 20,
      marginLeft: 10,
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
      padding: 24,
      alignItems: 'center',
      backgroundColor: theme.cardBackground || theme.background,
      borderRadius: 16,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    loadingText: {
      marginLeft: 10,
      fontSize: 14,
      color: theme.textSecondary,
    },
    emptyState: {
      padding: 30,
      alignItems: 'center',
      backgroundColor: theme.cardBackground || theme.background,
      borderRadius: 16,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
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
