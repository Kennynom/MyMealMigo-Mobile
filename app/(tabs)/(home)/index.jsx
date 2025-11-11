// app/(tabs)/(home)/index.jsx - Add Features section
import { ThemeContext } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useContext, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

// 🔥 Firebase imports
import { db } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';

// Import components
import { AuthDebug } from '@/components/auth/AuthDebug'; // ← ADD DEBUG IMPORT

import NutritionalTipCard from '@/components/dashboard/NutritionalTipCard';
import PremiumGate from '@/components/ui/PremiumGate';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';


export default function HomeScreen() {
  const { theme } = useContext(ThemeContext);
  const styles = createStyle(theme);
  const [loading, setLoading] = useState(true);
  const [landingPageData, setLandingPageData] = useState(null);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const { isPremium } = usePremiumStatus();
  const [userWeight, setUserWeight] = useState(null);
  const [userHeight, setUserHeight] = useState(null);
  const [userBMI, setUserBMI] = useState(null);
  const [userName, setUserName] = useState('User');
  const [calorieChartData, setCalorieChartData] = useState({
    labels: ["7", "6", "5", "4", "3", "2", "1"],
    datasets: [
      { data: [0, 0, 0, 0, 0, 0, 0] }
    ]
  });

  // Create initials from user name for avatar
  const getInitials = (name) => {
    if (!name) return 'U';
    const nameParts = name.trim().split(' ');
    if (nameParts.length === 1) return nameParts[0][0].toUpperCase();
    return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
  };


  // Fetch user's weight and BMI for display on mobile dashboard
  useEffect(() => {
    let cancelled = false;
    const fetchUserHealthData = async () => {
      if (!user) return;
      try {
        console.log('🔍 [HOME] Fetching user health data for uid:', user.uid);
        // Fetch from users/{uid} document - profile object contains weightKg and currentBMI
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (cancelled) return;
        
        if (userSnap.exists()) {
          const userData = userSnap.data() || {};
          const profile = userData.profile || {};
          
          // Get user name for avatar
          if (userData.name) {
            setUserName(userData.name);
          }
          
          // Get weight and BMI directly from profile
          const weight = profile.weightKg;
          const bmi = profile.currentBMI;
          
          if (typeof weight === 'number') {
            setUserWeight(weight);
          }
          
          if (typeof bmi === 'number') {
            setUserBMI(bmi.toFixed(1));
          }
          console.log('✅ [HOME] Successfully fetched user health data');
        } else {
          console.log('⚠️ [HOME] User document does not exist');
        }
      } catch (err) {
        console.error('❌ [HOME] ERROR fetching user health data from users/' + user.uid + ':', err.code, err.message);
      }
    };

    fetchUserHealthData();
    return () => { cancelled = true; };
  }, [user]);

  // Fetch calorie logs for the chart (last 7 days)
  useEffect(() => {
    let cancelled = false;
    const fetchCalorieLogs = async () => {
      if (!user) return;
      try {
        console.log('🔍 [HOME] Fetching calorie logs for uid:', user.uid);
        const calorieLogRef = doc(db, 'users', user.uid, 'private', 'health_profile', 'calorie_logs', 'main');
        const calorieLogSnap = await getDoc(calorieLogRef);
        if (cancelled) return;

        if (calorieLogSnap.exists()) {
          const data = calorieLogSnap.data() || {};
          const dailyLogs = Array.isArray(data.dailyLogs) ? data.dailyLogs : [];
          
          // Get the last 7 days, oldest to newest (for left to right display)
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const last7Days = [];
          const dateLabels = [];
          
          // Loop from 6 days ago (i=6) to today (i=0) - oldest to newest
          for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0]; // Format: YYYY-MM-DD
            
            // Format date as MM/DD for display
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            dateLabels.push(`${month}/${day}`);
            
            // Find the log entry for this date
            const logEntry = dailyLogs.find(log => {
              if (log.dateStart) {
                const logDate = log.dateStart.split('T')[0];
                return logDate === dateStr;
              }
              return false;
            });
            
            // Get calories consumed or default to 0
            const caloriesConsumed = logEntry?.caloriesConsumed || 0;
            last7Days.push(caloriesConsumed);
          }
          
          // Update chart data with date labels
          setCalorieChartData({
            labels: dateLabels,
            datasets: [
              { data: last7Days }
            ]
          });
          console.log('✅ [HOME] Successfully fetched calorie logs');
        } else {
          console.log('⚠️ [HOME] Calorie logs document does not exist');
        }
      } catch (err) {
        console.error('❌ [HOME] ERROR fetching calorie logs from users/' + user.uid + '/private/health_profile/calorie_logs/main:', err.code, err.message);
      }
    };

    fetchCalorieLogs();
    return () => { cancelled = true; };
  }, [user]);

  return (
    <View style={styles.mobileContainer}>
      <AuthDebug />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => {
            if (isPremium) {
              router.push('/chat');
            } else {
              router.push('/(tabs)/(home)/(profile)/(subscription)');
            }
          }}
          style={styles.aiButtonContainer}
          accessibilityLabel="AI Assistant Button"
        >
          <View style={[styles.aiButton, !isPremium && styles.aiButtonDisabled]}>
            <Ionicons name={isPremium ? "sparkles" : "lock-closed"} size={20} color="#fff" />
          </View>
          <Text style={styles.aiButtonText}>AI</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <Text style={styles.headerSubtitle}>Your health overview</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('(profile)')}
          accessibilityLabel="Profile Button"
          style={styles.profileButtonContainer}
        >
          <View style={styles.avatarSmall}>
            <Text style={styles.avatarSmallText}>{getInitials(userName)}</Text>
          </View>
          <Text style={styles.profileButtonText}>Profile</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: theme.primary + '15' }]}>
            <Text style={styles.statLabel}>Weight</Text>
            <Text style={[styles.statValue, { color: theme.primary }]}>
              {userWeight != null ? userWeight : '—'}
            </Text>
            <Text style={styles.statUnit}>kg</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.altAccent + '15' }]}>
            <Text style={styles.statLabel}>BMI</Text>
            <Text style={[styles.statValue, { color: theme.altAccent }]}>
              {userBMI != null ? userBMI : '—'}
            </Text>
            <Text style={styles.statUnit}>index</Text>
          </View>
        </View>

        {/* Calorie Intake Chart */}
        <PremiumGate isPremium={isPremium} featureName="calorie intake analytics">
          <View style={styles.chartContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Calorie Intake</Text>
              <Text style={styles.sectionSubtitle}> • Last 7 days</Text>
            </View>
            <View style={styles.chartCard}>
              <LineChart
                data={calorieChartData}
                width={320}
                height={200}
                yAxisSuffix=" cal"
                chartConfig={{
                  backgroundColor: theme.background,
                  backgroundGradientFrom: theme.background,
                  backgroundGradientTo: theme.background,
                  decimalPlaces: 0,
                  color: (opacity = 1) => theme.background,
                  labelColor: (opacity = 1) => theme.text,
                  style: {
                    borderRadius: 16,
                  },
                  propsForDots: {
                    r: '5',
                    strokeWidth: '2',
                    stroke: theme.primary
                  },
                  propsForBackgroundLines: {
                    strokeDasharray: '',
                    stroke: theme.border || '#e0e0e0',
                  }
                }}
                style={styles.chart}
                fromZero={true}
                withInnerLines={true}
                withVerticalLabels={true}
                withHorizontalLabels={true}
                withVerticalLines={false}
              />
            </View>
          </View>
        </PremiumGate>

        {/* Nutritional Tip Card */}
        <View style={{ marginTop: 16 }}>
          <NutritionalTipCard />
        </View>

      </ScrollView>
    </View>
  );
}

// Theme-aware style creator
function createStyle(theme) {
  return StyleSheet.create({
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.background,
    },
    loadingText: {
      fontSize: 18,
      color: theme.primary,
      fontWeight: '500',
    },
    errorContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.background,
      padding: 20,
    },
    errorText: {
      fontSize: 18,
      color: theme.error,
      fontWeight: '600',
      marginBottom: 8,
    },
    errorDetail: {
      fontSize: 12,
      color: theme.textSecondary,
      textAlign: 'center',
      marginBottom: 16,
    },
    retryButton: {
      backgroundColor: theme.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },
    retryButtonText: {
      color: theme.buttonText,
      fontSize: 14,
      fontWeight: '500',
    },
    webContainer: {
      flex: 1,
      backgroundColor: theme.background,
    },
    sectionsPlaceholder: {
      backgroundColor: theme.sectionBackground,
      padding: 40,
      alignItems: 'center',
    },
    placeholderText: {
      fontSize: 18,
      color: theme.textSecondary,
      marginBottom: 30,
      textAlign: 'center',
    },
    pricingSection: {
      backgroundColor: theme.sectionBackground,
      padding: 40,
      alignItems: 'center',
    },
    pricingTitle: {
      fontSize: 32,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 16,
      textAlign: 'center',
    },
    pricingCardsContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems:'flex-start',
      flexWrap: 'wrap',
      gap: 20,
      maxWidth: 1200,
    },
    chartContainer: {
      marginTop: 8,
      marginBottom: 24,
    },
    chartCard: {
      backgroundColor: theme.background,
      borderRadius: 20,
      padding: 20,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    },
    chart: {
      borderRadius: 16,
      marginVertical: 0,
    },
    // Mobile styles
    mobileContainer: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 60,
      paddingBottom: 20,
      backgroundColor: theme.background,
    },
    aiButtonContainer: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    aiButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.primary,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    aiButtonDisabled: {
      backgroundColor: theme.textSecondary,
      opacity: 0.6,
    },
    aiButtonText: {
      fontSize: 10,
      fontWeight: '600',
      color: theme.primary,
      marginTop: 4,
    },
    headerCenter: {
      flex: 1,
      alignItems: 'center',
      paddingHorizontal: 12,
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
    profileButtonContainer: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarButton: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    avatarSmall: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.primary,
      borderWidth: 2,
      borderColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    avatarSmallText: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#fff',
      letterSpacing: 1,
    },
    profileButtonText: {
      fontSize: 10,
      fontWeight: '600',
      color: theme.primary,
      marginTop: 4,
    },
    profileImage: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 2,
      borderColor: theme.primary,
      backgroundColor: theme.surface,
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 100,
    },
    statsContainer: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 20,
    },
    statCard: {
      flex: 1,
      backgroundColor: theme.cardBackground,
      borderRadius: 16,
      padding: 16,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    statLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.textSecondary,
      marginBottom: 8,
    },
    statValue: {
      fontSize: 28,
      fontWeight: 'bold',
      marginBottom: 4,
    },
    statUnit: {
      fontSize: 12,
      color: theme.textSecondary,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
      gap: 8,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.text,
    },
    sectionSubtitle: {
      fontSize: 13,
      color: theme.textSecondary,
    },
  });
}