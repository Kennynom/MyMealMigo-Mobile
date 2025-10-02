import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useContext } from 'react';
import { ThemeContext } from '@/context/ThemeContext';
import { router } from 'expo-router';

export default function ViewMealLogScreen() {
  const { colorScheme, setColorScheme, theme } = useContext(ThemeContext);
  const styles = createStyles(theme, colorScheme);
  
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const toggleTheme = () => {
    setColorScheme(colorScheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.mainHeader}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>View Meal Log</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity style={styles.themeButton} onPress={toggleTheme}>
              <Text style={styles.themeIcon}>{colorScheme === 'dark' ? '☀️' : '🌙'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.profileButton}>
              <Text style={styles.profileIcon}>👤</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity style={styles.activeTab}>
            <Text style={styles.activeTabText}>Meal log</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab}>
            <Text style={styles.tabText}>Reflection</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Date */}
      <View style={styles.dateContainer}>
        <Text style={styles.dateText}>{currentDate}</Text>
      </View>

      {/* Meal Cards */}
      <ScrollView style={styles.mealList} showsVerticalScrollIndicator={false}>
        {['Breakfast', 'Lunch', 'Dinner'].map((meal, index) => (
          <View key={index} style={styles.mealCard}>
            <View style={styles.mealHeader}>
              <Text style={styles.mealTitle}>{meal}</Text>
              <TouchableOpacity style={styles.editButton}>
                <Text style={styles.editIcon}>✏️</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.chartPlaceholder}>
              <Text style={styles.chartText}>📊 Nutrition Chart</Text>
            </View>
          </View>
        ))}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Add Meal Button */}
      <View style={styles.addButtonContainer}>
        <TouchableOpacity style={styles.addButton}>
          <Text style={styles.addButtonText}>Add Meal</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (theme, colorScheme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  mainHeader: {
    backgroundColor: theme.surface,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    padding: 5,
  },
  backIcon: {
    fontSize: 24,
    color: theme.text,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 20,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  themeButton: {
    width: 32,
    height: 32,
    backgroundColor: theme.inactive,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeIcon: {
    fontSize: 16,
  },
  profileButton: {
    width: 32,
    height: 32,
    backgroundColor: theme.primary,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIcon: {
    color: '#fff',
    fontSize: 14,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.inactive,
    borderRadius: 25,
    padding: 4,
  },
  activeTab: {
    flex: 1,
    backgroundColor: theme.primary,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
  },
  activeTabText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabText: {
    color: theme.textSecondary,
    fontSize: 14,
  },
  dateContainer: {
    padding: 20,
  },
  dateText: {
    fontSize: 16,
    color: theme.text,
    fontWeight: '500',
  },
  mealList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  mealCard: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  mealTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
  },
  editButton: {
    padding: 5,
  },
  editIcon: {
    fontSize: 16,
  },
  chartPlaceholder: {
    backgroundColor: theme.inactive,
    height: 80,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartText: {
    color: theme.textSecondary,
    fontSize: 14,
  },
  bottomSpacing: {
    height: 20,
  },
  addButtonContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  addButton: {
    backgroundColor: theme.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});