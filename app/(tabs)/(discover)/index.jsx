import { ThemeContext } from '@/context/ThemeContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { useContext } from 'react';
import { ImageBackground, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function DiscoverMainScreen() {
  const { theme } = useContext(ThemeContext);
  const styles = createStyles(theme);

  const discoverItems = [
    {
      id: 'foods',
      title: 'Food Dictionary',
      subtitle: 'Search nutrition info',
      icon: 'restaurant-menu',
      color: '#4ECDC4',
      route: '/(tabs)/(discover)/(foods)/browse-foods',
      image: require('@/assets/images/fooddictionary.png'),
    },
    {
      id: 'recipes',
      title: 'Browse Recipes',
      subtitle: 'Healthy & delicious',
      icon: 'menu-book',
      color: theme.altAccent,
      route: '/(tabs)/(discover)/(recipes)/browse-recipes',
      image: require('@/assets/images/browserecipe.png'),
    },
    {
      id: 'recommendations',
      title: 'Meal Recommendations',
      subtitle: 'Personalized for you',
      icon: 'recommend',
      color: '#F38181',
      route: '/(tabs)/(discover)/meal-recommendations',
      image: require('@/assets/images/mealrecommendation.png'),
    }
  ];

  const featuredMeals = [
    {
      id: 'mee-rebus',
      emoji: '🍜',
      title: 'Mee Rebus',
      subtitle: 'Yellow noodles in sweet gravy',
      calories: 520
    },
    {
      id: 'chendol',
      emoji: '🥤',
      title: 'Chendol',
      subtitle: 'Coconut milk with gula melaka',
      calories: 380
    }
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Discover</Text>
          <Text style={styles.headerSubtitle}>Explore foods & recipes</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Discover Cards */}
        <View style={styles.cardsContainer}>
          {discoverItems.map((item) => (
            <TouchableOpacity 
              key={item.id}
              style={styles.discoverCard}
              onPress={() => router.push(item.route)}
              activeOpacity={0.7}
            >
              <ImageBackground
                source={item.image}
                style={styles.discoverCardBackground}
                imageStyle={styles.discoverCardImage}
              >
                <View style={styles.discoverCardOverlay}>
                  <View style={[styles.iconCircle, { backgroundColor: item.color + '20' }]}>
                    <MaterialIcons name={item.icon} size={32} color={item.color} />
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
                  </View>
                </View>
              </ImageBackground>
            </TouchableOpacity>
          ))}
        </View>

        {/* Featured Section */}
        <View style={styles.featuredSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today Featured Recipe</Text>
            <MaterialIcons name="local-fire-department" size={20} color={theme.warning} />
          </View>
          
          {featuredMeals.map((meal) => (
            <View key={meal.id} style={styles.featuredCard}>
              <View style={styles.featuredEmojiCircle}>
                <Text style={styles.featuredEmoji}>{meal.emoji}</Text>
              </View>
              <View style={styles.featuredContent}>
                <Text style={styles.featuredTitle}>{meal.title}</Text>
                <Text style={styles.featuredSubtitle}>{meal.subtitle}</Text>
                <View style={styles.calorieTag}>
                  <MaterialIcons name="local-fire-department" size={14} color={theme.warning} />
                  <Text style={styles.featuredCalories}>{meal.calories} kcal</Text>
                </View>
              </View>
            </View>
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
    marginBottom: 24,
  },
  discoverCard: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  discoverCardBackground: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  discoverCardImage: {
    borderRadius: 16,
    opacity: 0.7,
  },
  discoverCardOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: theme.translucent,
    borderRadius: 12,
    padding: 16,
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
  featuredSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
  },
  featuredCard: {
    backgroundColor: theme.cardBackground || theme.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  featuredEmojiCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featuredEmoji: {
    fontSize: 28,
  },
  featuredContent: {
    flex: 1,
  },
  featuredTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 4,
  },
  featuredSubtitle: {
    fontSize: 13,
    color: theme.textSecondary,
    marginBottom: 6,
  },
  calorieTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featuredCalories: {
    fontSize: 13,
    color: theme.primaryDark,
    fontWeight: '600',
  },
});