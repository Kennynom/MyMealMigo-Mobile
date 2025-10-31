import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useContext } from 'react';
import { ThemeContext } from '@/context/ThemeContext';
import { router } from 'expo-router';

export default function DiscoverMainScreen() {
  const { colorScheme, setColorScheme, theme } = useContext(ThemeContext);
  const styles = createStyles(theme, colorScheme);

  const toggleTheme = () => {
    setColorScheme(colorScheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Discover</Text>
          <Text style={styles.subtitle}>Explore foods, recipes, and meal ideas</Text>
        </View>
        <TouchableOpacity style={styles.themeButton} onPress={toggleTheme}>
          <Text style={styles.themeIcon}>{colorScheme === 'dark' ? '☀️' : '🌙'}</Text>
        </TouchableOpacity>
      </View>

      {/* Discover Cards */}
      <View style={styles.discoverGrid}>
        <TouchableOpacity 
          style={styles.discoverCard}
          onPress={() => router.push('/(tabs)/(discover)/food-dictionary')}
        >
          <View style={styles.cardIcon}>
            <Text style={styles.cardEmoji}>📚</Text>
          </View>
          <Text style={styles.cardTitle}>Food Dictionary</Text>
          <Text style={styles.cardSubtitle}>Search nutrition info for thousands of foods</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.discoverCard}
          onPress={() => router.push('/(tabs)/(discover)/(recipes)/browse-recipes')}
        >
          <View style={styles.cardIcon}>
            <Text style={styles.cardEmoji}>👨‍🍳</Text>
          </View>
          <Text style={styles.cardTitle}>Browse Recipes</Text>
          <Text style={styles.cardSubtitle}>Discover healthy and delicious recipes</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.discoverCard}
          onPress={() => router.push('/(tabs)/(discover)/meal-recommendations')}
        >
          <View style={styles.cardIcon}>
            <Text style={styles.cardEmoji}>🎯</Text>
          </View>
          <Text style={styles.cardTitle}>Meal Recommendations</Text>
          <Text style={styles.cardSubtitle}>Personalized meal suggestions for you</Text>
        </TouchableOpacity>
      </View>

      {/* Featured Section */}
      <View style={styles.featuredSection}>
        <Text style={styles.sectionTitle}>Featured Today</Text>
        
        <View style={styles.featuredCard}>
          <Text style={styles.featuredEmoji}>🥗</Text>
          <View style={styles.featuredContent}>
            <Text style={styles.featuredTitle}>Quinoa Power Bowl</Text>
            <Text style={styles.featuredSubtitle}>High protein, nutrient-dense meal</Text>
            <Text style={styles.featuredCalories}>420 kcal</Text>
          </View>
        </View>

        <View style={styles.featuredCard}>
          <Text style={styles.featuredEmoji}>🍎</Text>
          <View style={styles.featuredContent}>
            <Text style={styles.featuredTitle}>Apple</Text>
            <Text style={styles.featuredSubtitle}>Rich in fiber and vitamins</Text>
            <Text style={styles.featuredCalories}>52 kcal per 100g</Text>
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
  discoverGrid: {
    paddingHorizontal: 20,
    gap: 15,
    marginBottom: 30,
  },
  discoverCard: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardIcon: {
    width: 60,
    height: 60,
    backgroundColor: theme.primary,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardEmoji: {
    fontSize: 28,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  featuredSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 15,
  },
  featuredCard: {
    backgroundColor: theme.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  featuredEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  featuredContent: {
    flex: 1,
  },
  featuredTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  featuredSubtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 2,
  },
  featuredCalories: {
    fontSize: 12,
    color: theme.primary,
    marginTop: 4,
    fontWeight: '500',
  },
});