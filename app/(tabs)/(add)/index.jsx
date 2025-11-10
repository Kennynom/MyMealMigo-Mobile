import { useAuth } from '@/context/AuthContext';
import { ThemeContext } from '@/context/ThemeContext';
import { checkCalorieGoalExceedance, getUserMeals, logMealToFirebase, updateCalorieTracking } from '@/utils/mealService';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useContext, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function AddMealMainScreen() {
  const { theme } = useContext(ThemeContext);
  const { user } = useAuth();
  const styles = createStyles(theme);
  const [recentMeals, setRecentMeals] = useState([]);
  const [recentBeverages, setRecentBeverages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');

  // Fetch recent meals and beverages when screen is focused
  useFocusEffect(
    useCallback(() => {
      const fetchRecentItems = async () => {
        if (!user?.uid) {
          setLoading(false);
          return;
        }

        try {
          setLoading(true);
          // Get last 20 meals to have enough to filter
          const allMeals = await getUserMeals(user.uid, 20);

          // Filter meals (mealType === 'meal')
          const meals = allMeals
            .filter(item => item.mealType === 'meal')
            .slice(0, 2);

          // Filter beverages (mealType === 'beverage')
          const beverages = allMeals
            .filter(item => item.mealType === 'beverage')
            .slice(0, 2);

          setRecentMeals(meals);
          setRecentBeverages(beverages);
        } catch (error) {
          console.error('Error fetching recent items:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchRecentItems();
    }, [user?.uid])
  );

  // Helper function to get relative time
  const getRelativeTime = (timestamp) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffInMs = now - date;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString();
  };

  // Helper function to get emoji based on meal category
  const getMealEmoji = (category) => {
    const emojiMap = {
      breakfast: '',
      lunch: '',
      dinner: '',
    };
    return emojiMap[category?.toLowerCase()] || '🍴';
  };

  // Helper function to show category selection modal
  const handleRelogMeal = (meal) => {
    setSelectedItem(meal);
    setModalVisible(true);
  };

  // Helper function to log meal with selected category
  const confirmRelogMeal = async () => {
    if (!selectedCategory) {
      Alert.alert('Error', 'Please select a meal category');
      return;
    }

    try {
      // Create meal data with current timestamp and selected category
      const mealData = {
        foodName: selectedItem.foodName,
        calories: selectedItem.calories,
        protein: selectedItem.protein || 0,
        carbs: selectedItem.carbs || 0,
        fat: selectedItem.fat || 0,
        sodium: selectedItem.sodium || 0,
        sugar: selectedItem.sugar || 0,
        servingSize: selectedItem.servingSize || 1,
        servingUnit: selectedItem.servingUnit || 'serving',
        mealCategory: selectedCategory,
        mealType: selectedItem.mealType,
        entryMethod: selectedItem.entryMethod || 'quick-add',
        timestamp: new Date(),
        userId: user.uid,
      };

      // If it's from a recipe, include recipeId
      if (selectedItem.recipeId) {
        mealData.recipeId = selectedItem.recipeId;
      }

      // Check if this meal will exceed calorie goal
      const totalCalories = mealData.calories * mealData.servingSize;
      const exceedanceCheck = await checkCalorieGoalExceedance(user.uid, totalCalories);
      
      if (exceedanceCheck.hasGoal && exceedanceCheck.willExceed) {
        // Show warning and ask for confirmation
        Alert.alert(
          '⚠️ Calorie Goal Warning',
          `This ${mealData.mealType === 'beverage' ? 'beverage' : 'meal'} will exceed your daily calorie goal by ${exceedanceCheck.exceedBy} calories.\n\n` +
          `Current: ${exceedanceCheck.currentConsumed} cal\n` +
          `Adding: ${totalCalories} cal\n` +
          `Total: ${exceedanceCheck.totalAfterMeal} cal\n` +
          `Goal: ${exceedanceCheck.calorieGoal} cal\n\n` +
          `Do you want to continue?`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => {
                // Keep modal open, don't reset
              }
            },
            {
              text: 'Log Anyway',
              style: 'default',
              onPress: async () => {
                await proceedWithLogging(mealData);
              }
            }
          ]
        );
        return; // Stop here and wait for user decision
      }

      // If no warning, proceed with logging
      await proceedWithLogging(mealData);
      
    } catch (error) {
      console.error('Error re-logging meal:', error);
      Alert.alert('Error', 'Failed to log meal. Please try again.');
      setModalVisible(false);
      setSelectedCategory('');
      setSelectedItem(null);
    }
  };

  // Separate function to handle the actual logging
  const proceedWithLogging = async (mealData) => {
    try {
      // Log the meal
      await logMealToFirebase(mealData);
      await updateCalorieTracking(user.uid, mealData);

      setModalVisible(false);
      setSelectedCategory('');
      setSelectedItem(null);

      Alert.alert(
        'Success',
        `${mealData.foodName} has been logged as ${mealData.mealCategory}!`,
        [{ text: 'OK' }]
      );

      // Refresh the list
      const allMeals = await getUserMeals(user.uid, 20);
      const meals = allMeals
        .filter(item => item.mealType === 'meal')
        .slice(0, 2);
      const beverages = allMeals
        .filter(item => item.mealType === 'beverage')
        .slice(0, 2);
      setRecentMeals(meals);
      setRecentBeverages(beverages);
    } catch (error) {
      console.error('Error logging meal:', error);
      Alert.alert('Error', 'Failed to log meal. Please try again.');
      setModalVisible(false);
      setSelectedCategory('');
      setSelectedItem(null);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header - Centered like Tracker */}
      <View style={styles.header}>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Add Meal</Text>
          <Text style={styles.headerSubtitle}>Choose how you'd like to log your meal</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Add</Text>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push({
              pathname: '/(tabs)/(add)/photo-capture',
              params: {}
            })}
            activeOpacity={0.7}
          >
            <View style={[styles.iconCircle, { backgroundColor: '#4ECDC4' + '20' }]}>
              <Text style={styles.actionEmoji}>📷</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Take Photo</Text>
              <Text style={styles.actionSubtitle}>Snap a pic and let AI analyze your meal</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push({
              pathname: '/(tabs)/(add)/scan-barcode',
              params: {}
            })}
            activeOpacity={0.7}
          >
            <View style={[styles.iconCircle, { backgroundColor: '#FF6B6B' + '20' }]}>
              <Text style={styles.actionEmoji}>📱</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Scan Barcode</Text>
              <Text style={styles.actionSubtitle}>Quickly add packaged foods</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Manual Entry */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Manual Entry</Text>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push({
              pathname: '/(tabs)/(add)/manual-entry',
              params: {}
            })}
            activeOpacity={0.7}
          >
            <View style={[styles.iconCircle, { backgroundColor: '#95E1D3' + '20' }]}>
              <Text style={styles.actionEmoji}>✏️</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Manual Entry</Text>
              <Text style={styles.actionSubtitle}>Enter nutrition info manually</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Recent Meals */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Meals</Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.primary} />
            </View>
          ) : recentMeals.length > 0 ? (
            recentMeals.map((meal, index) => (
              <View key={meal.id || index} style={styles.recentCard}>
                <Text style={styles.recentEmoji}>🍽️</Text>
                <View style={styles.recentContent}>
                  <Text style={styles.recentTitle}>{meal.foodName}</Text>
                  <Text style={styles.recentTime}>{getRelativeTime(meal.timestamp)}</Text>
                  <Text style={styles.recentNutrition}>
                    {Math.round(meal.calories * (meal.servingSize || 1))} cal
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.addButton}
                  onPress={() => handleRelogMeal(meal)}
                >
                  <Text style={styles.addButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No recent meals</Text>
            </View>
          )}
        </View>

        {/* Recent Beverages */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Beverages</Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.primary} />
            </View>
          ) : recentBeverages.length > 0 ? (
            recentBeverages.map((beverage, index) => (
              <View key={beverage.id || index} style={styles.recentCard}>
                <Text style={styles.recentEmoji}>🥤</Text>
                <View style={styles.recentContent}>
                  <Text style={styles.recentTitle}>{beverage.foodName}</Text>
                  <Text style={styles.recentTime}>{getRelativeTime(beverage.timestamp)}</Text>
                  <Text style={styles.recentNutrition}>
                    {Math.round(beverage.calories * (beverage.servingSize || 1))} cal
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.addButton}
                  onPress={() => handleRelogMeal(beverage)}
                >
                  <Text style={styles.addButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No recent beverages</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Category Selection Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          setSelectedCategory('');
          setSelectedItem(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Meal Category</Text>
            <Text style={styles.modalSubtitle}>
              Choose when you want to log this {selectedItem?.mealType === 'beverage' ? 'beverage' : 'meal'}
            </Text>

            <TouchableOpacity
              style={[
                styles.categoryButton,
                selectedCategory === 'breakfast' && styles.categoryButtonSelected
              ]}
              onPress={() => setSelectedCategory('breakfast')}
            >
              <Text style={styles.categoryEmoji}>🌅</Text>
              <Text style={[
                styles.categoryText,
                selectedCategory === 'breakfast' && styles.categoryTextSelected
              ]}>Breakfast</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.categoryButton,
                selectedCategory === 'lunch' && styles.categoryButtonSelected
              ]}
              onPress={() => setSelectedCategory('lunch')}
            >
              <Text style={styles.categoryEmoji}>🌞</Text>
              <Text style={[
                styles.categoryText,
                selectedCategory === 'lunch' && styles.categoryTextSelected
              ]}>Lunch</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.categoryButton,
                selectedCategory === 'dinner' && styles.categoryButtonSelected
              ]}
              onPress={() => setSelectedCategory('dinner')}
            >
              <Text style={styles.categoryEmoji}>🌙</Text>
              <Text style={[
                styles.categoryText,
                selectedCategory === 'dinner' && styles.categoryTextSelected
              ]}>Dinner</Text>
            </TouchableOpacity>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setModalVisible(false);
                  setSelectedCategory('');
                  setSelectedItem(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  !selectedCategory && styles.confirmButtonDisabled
                ]}
                onPress={confirmRelogMeal}
                disabled={!selectedCategory}
              >
                <Text style={styles.confirmButtonText}>Log Meal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 15,
  },
  actionCard: {
    backgroundColor: theme.cardBackground || theme.background,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  actionEmoji: {
    fontSize: 28,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 18,
  },
  recentCard: {
    backgroundColor: theme.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  recentEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  recentContent: {
    flex: 1,
  },
  recentTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.text,
  },
  recentTime: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 2,
  },
  recentNutrition: {
    fontSize: 11,
    color: theme.primary,
    marginTop: 2,
    fontWeight: '600',
  },
  addButton: {
    width: 32,
    height: 32,
    backgroundColor: theme.primary,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: 8,
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: 8,
  },
  emptyText: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 20,
    textAlign: 'center',
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryButtonSelected: {
    borderColor: theme.primary,
    backgroundColor: theme.primary + '20',
  },
  categoryEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  categoryText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.text,
  },
  categoryTextSelected: {
    color: theme.primary,
    fontWeight: 'bold',
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: theme.background,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: theme.primary,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});