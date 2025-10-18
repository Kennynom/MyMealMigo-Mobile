// app/(tabs)/(home)/index.jsx - Add Features section
import { ThemeContext } from '@/context/ThemeContext';
import { router } from 'expo-router';
import { useContext, useEffect, useState } from 'react';
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


export default function HomeScreen() {
  const { theme } = useContext(ThemeContext);
  const styles = createStyle(theme);
  const [loading, setLoading] = useState(true);
  const [landingPageData, setLandingPageData] = useState(null);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const [userWeight, setUserWeight] = useState(null);

  // for predictive graph
  // Hardcoded weight data for chart-kit
  const chartData = {
    labels: ["1", "2", "3", "4", "5", "6", "7"],
    datasets: [
      { data: [62, 66, 71, 67, 65, 61, 55] }
    ]
  };

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

  // Fetch user's latest weight for display on mobile dashboard
  useEffect(() => {
    let cancelled = false;
    const fetchWeight = async () => {
      if (!user) return;
      try {
        // Try weight_log/main first (array of entries)
        const weightLogRef = doc(db, 'users', user.uid, 'private', 'health_profile', 'weight_log', 'main');
        const weightLogSnap = await getDoc(weightLogRef);
        if (cancelled) return;

        if (weightLogSnap.exists()) {
          const data = weightLogSnap.data() || {};
          const logs = Array.isArray(data.logs) ? data.logs : [];
          if (logs.length > 0) {
            const last = logs[logs.length - 1];
            if (last && typeof last.weightKg === 'number') {
              setUserWeight(last.weightKg);
              return;
            }
          }
        }

        // Fallback: check demographics.weightKg on health_profile
        const hpRef = doc(db, 'users', user.uid, 'private', 'health_profile');
        const hpSnap = await getDoc(hpRef);
        if (cancelled) return;
        if (hpSnap.exists()) {
          const hp = hpSnap.data() || {};
          const fallback = hp?.demographics?.weightKg;
          if (typeof fallback === 'number') setUserWeight(fallback);
        }
      } catch (err) {
        console.error('Failed to fetch user weight:', err);
      }
    };

    fetchWeight();
    return () => { cancelled = true; };
  }, [user]);

  const fetchLandingPageData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔥 Fetching landing page data from Firebase...');
      
      // 🎯 FETCH FROM YOUR EXACT STRUCTURE: landingPageContent/main
      const landingPageDocRef = doc(db, 'landingPageContent', 'main');
      const landingPageSnapshot = await getDoc(landingPageDocRef);
      
      if (landingPageSnapshot.exists()) {
        const data = landingPageSnapshot.data();
        console.log('✅ Landing page data found:', data);
        setLandingPageData(data);
      } else {
        console.log('❌ No landingPageContent/main document found');
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
      console.error('🚨 Firebase Error:', error);
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
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Smart Dashboard</Text>
        </View>
        {/* Profile */}
        <View>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/(profile)/')}
            accessibilityLabel="Profile Button"
          >
            <Image source={{ uri: profileImageUrl }} style={styles.profileImage} />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.content}>
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
            <Text style={styles.altText2}>22.5</Text>
          </View>
        </View>

        {/* Predictive graph */}
        <View style={styles.chartContainer}>
          <LineChart
            data={chartData}
            width={320}
            height={220}
            chartConfig={{
              backgroundColor: "#fff",
              backgroundGradientFrom: "#fff",
              backgroundGradientTo: "#fff",
              color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: { borderRadius: 18 },
              propsForDots: {
                r: "4",
                strokeWidth: "2",
                stroke: "purple"
              }
            }}
            style={styles.chart}
          />
        </View>

      </View>
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
      marginHorizontal: 16,
      paddingHorizontal: 12,
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
      padding: 20,
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
  });
}