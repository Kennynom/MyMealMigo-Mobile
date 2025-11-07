// app/(tabs)/(home)/index.jsx - Add Features section
import { ThemeContext } from '@/context/ThemeContext';
import { router } from 'expo-router';
import React, { useContext, useEffect, useState } from 'react';
import { Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

// 🔥 Firebase imports
import { db } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';

// Import components
import { AuthDebug } from '@/components/auth/AuthDebug'; // ← ADD DEBUG IMPORT
import { Features } from '@/components/features'; // ← ADD THIS IMPORT
import { Footer } from '@/components/footer'; // ← ADD FOOTER IMPORT
import { Hero } from '@/components/hero';
import { HowItWorks } from '@/components/how-it-works'; // ← ADD HOW IT WORKS IMPORT
import { Pricing } from '@/components/pricing'; // ← ADD PRICING IMPORT
import { Testimonials } from '@/components/testimonials'; // ← ADD TESTIMONIALS IMPORT

import NutritionalTipCard from '@/components/dashboard/NutritionalTipCard';

import ChatButton from '@/components/chat-button';

export default function HomeScreen() {
  const { theme } = useContext(ThemeContext);
  const styles = createStyle(theme);
  const [loading, setLoading] = useState(true);
  const [landingPageData, setLandingPageData] = useState(null);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const [userWeight, setUserWeight] = useState(null);
  const [userHeight, setUserHeight] = useState(null);
  const [userBMI, setUserBMI] = useState(null);
  const [calorieChartData, setCalorieChartData] = useState({
    labels: ["7", "6", "5", "4", "3", "2", "1"],
    datasets: [
      { data: [0, 0, 0, 0, 0, 0, 0] }
    ]
  });

  // simple profile image URL (falls back to a generic avatar)
  const profileImageUrl =
    landingPageData?.profile?.photoURL ?? 'https://www.gravatar.com/avatar/?d=mp&s=200';

  // 🔥 FETCH DATA FROM FIREBASE WITH BETTER ERROR HANDLING
  useEffect(() => {
    if (Platform.OS === 'web') {
      fetchLandingPageData();
    } else {
      // Skip Firebase on mobile for now
      setLoading(false);
    }
  }, []);

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
          
          // Get the last 7 days (today = day 1, yesterday = day 2, etc.)
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const last7Days = [];
          const dateLabels = [];
          
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

  const fetchLandingPageData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('� [HOME] Fetching landing page data from landingPageContent/main...');
      
      // 🎯 FETCH FROM YOUR EXACT STRUCTURE: landingPageContent/main
      const landingPageDocRef = doc(db, 'landingPageContent', 'main');
      const landingPageSnapshot = await getDoc(landingPageDocRef);
      
      if (landingPageSnapshot.exists()) {
        const data = landingPageSnapshot.data();
        console.log('✅ [HOME] Landing page data found');
        setLandingPageData(data);
      } else {
        console.log('⚠️ [HOME] No landingPageContent/main document found');
        // Set fallback data
        setLandingPageData({
          hero: {
            title1: "Eat Smart,",
            title2: "Live Better.",
            description: "MyMealMigo is your all-in-one nutrition companion that makes healthy eating simple, personalized, and fun. Take our Quiz to get a personal meal plan.",
            imageURL: null,
            mediaType: "image"
          },
          features: []
        });
      }
      
    } catch (error) {
      console.error('❌ [HOME] ERROR fetching landingPageContent/main:', error.code, error.message);
      setError(error.message);
      // Fallback data on error
      setLandingPageData({
        hero: {
          title1: "Eat Smart,",
          title2: "Live Better.",
          description: "MyMealMigo nutrition companion",
          imageURL: null,
          mediaType: "image"
        },
        features: []
      });
    } finally {
      setLoading(false);
    }
  };

  // Create the Male/Female buttons as children for Hero
  const HeroButtons = () => (
    <View style={styles.heroButtonsContainer}>
      <TouchableOpacity 
        style={styles.heroButton}
        onPress={() => router.push('/(tabs)/(add)/?sex=male')}
      >
        <Text style={styles.heroButtonText}>Male</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.heroButton}
        onPress={() => router.push('/(tabs)/(add)/?sex=female')}
      >
        <Text style={styles.heroButtonText}>Female</Text>
      </TouchableOpacity>
    </View>
  );

  // Loading state
  if (loading && Platform.OS === 'web') {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>🔥 Loading... </Text>
      </View>
    );
  }

  // Error state
  if (error && Platform.OS === 'web') {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>⚠️ Error loading data</Text>
        <Text style={styles.errorDetail}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchLandingPageData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }



  // ON WEB: Show MyMealMigo website with real Firebase data
  if (Platform.OS === 'web') {
    return (
      <View style={{ flex: 1 }}>
        <AuthDebug />
        <ScrollView style={styles.webContainer} showsVerticalScrollIndicator={false}>
        {/* 🎯 HERO SECTION */}
        {landingPageData?.hero && (
          <Hero
            title1={landingPageData.hero.title1}
            title2={landingPageData.hero.title2}
            description={landingPageData.hero.description}
            imageURL={landingPageData.hero.imageURL}
            videoURL={landingPageData.hero.videoURL}
            mediaType={landingPageData.hero.mediaType}
          >
            <HeroButtons />
          </Hero>
        )}
        
        {/* 🎯 FEATURES SECTION - NEW! */}
        {landingPageData?.features && (
          <Features features={landingPageData.features} />
        )}

        {/* 🎯 PRICING SECTION */}
        {landingPageData?.pricing && (
          <View style={styles.pricingSection}>
            <Text style={styles.pricingTitle}>Choose Your Plan</Text>
            <View style={styles.pricingCardsContainer}>
            {landingPageData.pricing.map((plan, index) => (
              <Pricing
                key={index}
                name={plan.name}
                price={plan.price}
                buttonText={plan.buttonText}
                description={plan.description}
                featured={plan.featured}
                features={plan.features}
              />
            ))}
            </View>
          </View>
        )}

        {/* 🎯 TESTIMONIALS SECTION */}
        {landingPageData?.testimonial && (
          <Testimonials testimonials={landingPageData.testimonial} />
        )}
        
        {/* 🎯 HOW IT WORKS SECTION */}
        {landingPageData?.howItWorks && (
          <HowItWorks howItWorks={landingPageData.howItWorks} />
        )}

        {/* 🎯 FOOTER SECTION */}
        <Footer />

      </ScrollView>
      

      </View>
    );
  }

  // ON MOBILE: Keep existing mobile screen
  return (
    <View style={styles.mobileContainer}>
      <AuthDebug />
      <View style={styles.headerAI}>
        <TouchableOpacity
          onPress={() => router.push('/chat')}
          accessibilityLabel="AI Assistant Button"
          style={styles.buttonAI}
        >
          <ChatButton onPress={() => router.push('/chat')} />
          <Text> AI Assistant</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Smart Dashboard</Text>
        </View>
        {/* Profile */}
        <View>
          <TouchableOpacity
            onPress={() => router.push('(profile)')}
            accessibilityLabel="Profile Button"
          >
            <Image source={{ uri: profileImageUrl }} style={styles.profileImage} />
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.welcomeText}>Welcome!</Text>
        <Text style={styles.subtitle}>You are currently viewing smart dashboard</Text>

        {/* Mini islands */}
        <View style={styles.islandContainer}>
          <View style={styles.indIsland}>
            <Text style={styles.altText1}>Weight:</Text>
            <Text style={styles.altText2}>{userWeight != null ? `${userWeight} kg` : '— kg'}</Text>
          </View>
          <View style={styles.indIsland}>
            <Text style={styles.altText1}>BMI:</Text>
            <Text style={styles.altText2}>{userBMI != null ? userBMI : '—'}</Text>
          </View>
        </View>

        {/* Predictive graph */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Calories Consumed (Last 7 Days)</Text>
          <LineChart
            data={calorieChartData}
            width={360}
            height={220}
            chartConfig={{
              backgroundColor: "#fff",
              backgroundGradientFrom: "#fff",
              backgroundGradientTo: "#fff",
              color: (opacity = 1) => theme.primaryDark,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: { borderRadius: 18 },
              propsForDots: {
                r: "4",
                strokeWidth: "2",
                stroke: theme.primary
              }
            }}
            style={styles.chart}
            fromZero={true}
          />
        </View>

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
    heroButtonsContainer: {
      flexDirection: 'row',
      gap: 12,
    },
    heroButton: {
      backgroundColor: theme.primary,
      paddingHorizontal: 32,
      paddingVertical: 12,
      borderRadius: 25,
    },
    heroButtonText: {
      color: theme.buttonText,
      fontSize: 16,
      fontWeight: '500',
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
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 24,
      marginBottom: 40, // Add bottom margin for better spacing
      marginHorizontal: 16,
      paddingHorizontal: 12,
    },
    chartTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 12,
      textAlign: 'center',
    },
    chart: {
      backgroundColor: '#fff',
      borderRadius: 8,
      paddingVertical: 24,
      paddingHorizontal: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 2,
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
      padding: 20,
      paddingTop: 60,
    },
    headerLeft: {
      flex: 1,
    },
    headerRight: {
      marginLeft: 12,
      alignItems: 'flex-end',
      justifyContent: 'center',
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
    subtitle2: {
      fontSize: 16,
      color: theme.textSecondary,
      marginTop: 4,
      marginBottom: 12,
    },
    welcomeText: {
      fontSize: 24,
      color: theme.text,
      fontWeight: '600',
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      padding: 20,
      paddingBottom: 100, // Add extra bottom padding to prevent cropping
    },
    quickAction: {
      backgroundColor: theme.secondary,
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
    },
    quickActionText: {
      color: theme.altText,
      fontSize: 16,
      fontWeight: '600',
    },
    profileImage: {
      width: 48,
      height: 48,
      borderRadius: 999,
      borderWidth: 2,
      borderColor: theme.secondary ?? theme.secondaryGreen ?? '#059669',
      backgroundColor: theme.inactive,
    },
    highlight: { 
      color: theme.primary,
      fontWeight: '700',
      fontStyle: 'italic',
      textDecorationLine: 'underline',
      fontSize: 24,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 4,
    },
    islandContainer: {
      flexWrap: 'wrap',
      flexDirection: 'row',
      marginTop: 20,
      justifyContent: 'space-evenly',
    },
    indIsland: {
      alignItems: 'center',
      backgroundColor: theme.altBackground,
      padding: 10,
      margin: 10,
      borderRadius: 8,
      minWidth: 150,
      minHeight: 90,
      justifyContent: 'center',
    },
    altText1: {
      fontSize: 22,
      color: theme.altText,
      fontWeight: '600',
      paddingBottom: 4,
    },
    altText2: {
      fontSize: 16,
      color: theme.altText,
    },
    headerAI: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 15,
      backgroundColor: theme.background,
    },
    buttonAI: {
      backgroundColor: theme.primary,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 50,
    },
  });
}