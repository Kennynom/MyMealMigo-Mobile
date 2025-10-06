// app/(tabs)/(home)/index.jsx - Add Features section
import { ThemeContext } from '@/context/ThemeContext';
import { router } from 'expo-router';
import { useContext, useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// 🔥 Firebase imports
import { db } from '@/config/firebase';
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
  const [loading, setLoading] = useState(true);
  const [landingPageData, setLandingPageData] = useState(null);
  const [error, setError] = useState(null);

  // 🔥 FETCH DATA FROM FIREBASE WITH BETTER ERROR HANDLING
  useEffect(() => {
    if (Platform.OS === 'web') {
      fetchLandingPageData();
    } else {
      // Skip Firebase on mobile for now
      setLoading(false);
    }
  }, []);

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
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Home</Text>
          <Text style={styles.subtitle}>Welcome back to MyMealMigo</Text>
        </View>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.welcomeText}>Your mobile app content here</Text>
        
        <TouchableOpacity 
          style={styles.quickAction}
          onPress={() => router.push('/(tabs)/(tracker)/bmi-calculator')}
        >
          <Text style={styles.quickActionText}>Quick BMI Check</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    fontSize: 18,
    color: '#58e221',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#ef4444',
    fontWeight: '600',
    marginBottom: 8,
  },
  errorDetail: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#58e221',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  webContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  heroButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  heroButton: {
    backgroundColor: '#58e221',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 25,
  },
  heroButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  sectionsPlaceholder: {
    backgroundColor: '#f8fafc',
    padding: 40,
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 18,
    color: '#6b7280',
    marginBottom: 30,
    textAlign: 'center',
  },
  pricingSection: {
    backgroundColor: '#F8FCF8',
    padding: 40,
    alignItems: 'center',
  },
  pricingTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
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
  // Mobile styles
  mobileContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  welcomeText: {
    fontSize: 18,
    color: '#374151',
    marginBottom: 20,
  },
  quickAction: {
    backgroundColor: '#58e221',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  quickActionText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});