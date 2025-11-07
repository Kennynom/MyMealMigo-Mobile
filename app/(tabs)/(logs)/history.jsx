// app/(tabs)/(logs)/history.jsx
import { useAuth } from "@/context/AuthContext";
import { ThemeContext } from "@/context/ThemeContext";
import { getUserMeals } from "@/utils/mealService";
import DateTimePicker from '@react-native-community/datetimepicker';
import { router, useFocusEffect } from "expo-router";
import React, {
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function MealHistoryScreen() {
  const { theme, colorScheme, setColorScheme } = useContext(ThemeContext);
  const { user } = useAuth();
  const styles = useMemo(() => createStyles(theme, colorScheme), [theme, colorScheme]);

  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Fetch meals when component mounts or user changes
  useFocusEffect(
    useCallback(() => {
      if (user?.uid) {
        fetchMeals();
      }
    }, [user])
  );

  const fetchMeals = async () => {
    if (!user?.uid) return;
    
    setLoading(true);
    try {
      const userMeals = await getUserMeals(user.uid, 500); // Get more meals for history
      setMeals(userMeals);
    } catch (error) {
      console.error('Error fetching meals:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group meals by date
  const mealsByDate = useMemo(() => {
    const grouped = {};
    
    meals.forEach(meal => {
      const mealTimestamp = new Date(meal.timestamp);
      const dateKey = new Date(
        mealTimestamp.getFullYear(),
        mealTimestamp.getMonth(),
        mealTimestamp.getDate()
      ).toLocaleDateString('en-CA'); // Format: YYYY-MM-DD

      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          dateKey,
          dateObj: new Date(dateKey),
          meals: [],
          mealCount: 0,
          beverageCount: 0,
        };
      }
      
      grouped[dateKey].meals.push(meal);
      
      // Count meals vs beverages
      if (meal.mealType === 'beverage') {
        grouped[dateKey].beverageCount++;
      } else {
        grouped[dateKey].mealCount++;
      }
    });

    // Convert to array and sort by date (newest first)
    return Object.values(grouped).sort((a, b) => b.dateObj - a.dateObj);
  }, [meals]);

  // Calculate totals for a specific date
  const calculateDateTotals = (meals) => {
    return meals.reduce((totals, meal) => ({
      calories: totals.calories + (meal.calories || 0),
      protein: totals.protein + (meal.protein || 0),
      carbs: totals.carbs + (meal.carbs || 0),
      fat: totals.fat + (meal.fat || 0),
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  };

  const toggleTheme = () => {
    setColorScheme(colorScheme === "dark" ? "light" : "dark");
  };

  // Get meals for the selected date
  const selectedDateMeals = useMemo(() => {
    const selectedDateKey = selectedDate.toLocaleDateString('en-CA');
    const dateData = mealsByDate.find(d => d.dateKey === selectedDateKey);
    return dateData ? dateData.meals : [];
  }, [selectedDate, mealsByDate]);

  const isFutureDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate > today;
  };

  const formatDate = (dateObj) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const dateStr = dateObj.toLocaleDateString('en-CA');
    const todayStr = today.toLocaleDateString('en-CA');
    const yesterdayStr = yesterday.toLocaleDateString('en-CA');

    if (dateStr === todayStr) {
      return 'Today';
    } else if (dateStr === yesterdayStr) {
      return 'Yesterday';
    } else {
      return dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getMealCategoryIcon = (category) => {
    switch (category) {
      case 'breakfast':
        return '🌅';
      case 'lunch':
        return '🌞';
      case 'dinner':
        return '🌙';
      default:
        return '🍽️';
    }
  };

  const sortMealsByCategory = (meals) => {
    const categoryOrder = { 'breakfast': 1, 'lunch': 2, 'dinner': 3 };
    return [...meals].sort((a, b) => {
      const orderA = categoryOrder[a.mealCategory] || 999;
      const orderB = categoryOrder[b.mealCategory] || 999;
      return orderA - orderB;
    });
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.mainHeader}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Meal History</Text>

          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.themeButton}
              onPress={toggleTheme}
            >
              <Text style={styles.themeIcon}>
                {colorScheme === "dark" ? "☀️" : "🌙"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* BODY */}
      <ScrollView
        style={styles.scrollArea}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading meal history...</Text>
          </View>
        ) : (
          <>
            {/* DATE PICKER */}
            <View style={styles.datePickerContainer}>
              <Text style={styles.datePickerLabel}>Select Date</Text>
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="default"
                maximumDate={new Date()} // Block future dates
                onChange={(event, date) => {
                  if (date) setSelectedDate(date);
                }}
              />
            </View>

            {/* SELECTED DATE INFO */}
            <View style={styles.selectedDateHeader}>
              <Text style={styles.selectedDateTitle}>
                {formatDate(selectedDate)}
              </Text>
              {selectedDateMeals.length > 0 && (
                <View style={styles.selectedDateStats}>
                  <Text style={styles.selectedDateStatsText}>
                    {selectedDateMeals.filter(m => m.mealType !== 'beverage').length} meals
                  </Text>
                  {selectedDateMeals.filter(m => m.mealType === 'beverage').length > 0 && (
                    <>
                      <Text style={styles.selectedDateStatsText}> • </Text>
                      <Text style={styles.selectedDateStatsText}>
                        {selectedDateMeals.filter(m => m.mealType === 'beverage').length} beverages
                      </Text>
                    </>
                  )}
                  <Text style={styles.selectedDateStatsText}> • </Text>
                  <Text style={styles.selectedDateCalories}>
                    Total Calories: {Math.round(selectedDateMeals.reduce((sum, m) => sum + (m.calories || 0), 0))} cal
                  </Text>
                </View>
              )}
            </View>

            {/* MEALS FOR SELECTED DATE */}
            {selectedDateMeals.length === 0 ? (
              <View style={styles.noMealsContainer}>
                <Text style={styles.noMealsEmoji}>🍽️</Text>
                <Text style={styles.noMealsText}>No meals logged</Text>
                <Text style={styles.noMealsSubtext}>
                  {isFutureDate(selectedDate) 
                    ? "Can't view future dates" 
                    : "No meals recorded for this day"}
                </Text>
              </View>
            ) : (
              <View style={styles.mealsContainer}>
                {['breakfast', 'lunch', 'dinner'].map(category => {
                  const categoryMeals = selectedDateMeals.filter(m => m.mealCategory === category);
                  if (categoryMeals.length === 0) return null;
                  
                  return (
                    <View key={category} style={styles.categorySection}>
                      {/* Category Header */}
                      <View style={styles.categoryHeader}>
                        <Text style={styles.categoryIcon}>
                          {getMealCategoryIcon(category)}
                        </Text>
                        <Text style={styles.categoryTitle}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </Text>
                        <View style={styles.categoryBadge}>
                          <Text style={styles.categoryBadgeText}>
                            {categoryMeals.length}
                          </Text>
                        </View>
                      </View>

                      {/* Meals in this category */}
                      {categoryMeals.map((meal, index) => (
                        <View key={meal.id || index} style={styles.mealItem}>
                          <View style={styles.mealItemHeader}>
                            <View style={styles.mealItemTop}>
                              <View style={styles.mealItemInfo}>
                                <View style={styles.mealNameRow}>
                                  <Text style={styles.mealName}>{meal.foodName}</Text>
                                  <Text style={styles.mealTypeIcon}>
                                    {meal.mealType === 'beverage' ? '🥤' : '🍽️'}
                                  </Text>
                                </View>
                              </View>
                            </View>
                          </View>
                          
                          <View style={styles.mealNutrition}>
                            <View style={styles.nutritionItem}>
                              <Text style={styles.nutritionValue}>{meal.calories}</Text>
                              <Text style={styles.nutritionLabel}>cal</Text>
                            </View>
                            <View style={styles.nutritionItem}>
                              <Text style={styles.nutritionValue}>{meal.carbs}g</Text>
                              <Text style={styles.nutritionLabel}>carbs</Text>
                            </View>
                            <View style={styles.nutritionItem}>
                              <Text style={styles.nutritionValue}>{meal.protein}g</Text>
                              <Text style={styles.nutritionLabel}>protein</Text>
                            </View>
                            <View style={styles.nutritionItem}>
                              <Text style={styles.nutritionValue}>{meal.fat}g</Text>
                              <Text style={styles.nutritionLabel}>fat</Text>
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const createStyles = (theme, colorScheme) =>
  StyleSheet.create({
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
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    backButton: { padding: 5 },
    backIcon: {
      fontSize: 24,
      color: theme.text,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: theme.text,
      flex: 1,
      textAlign: "center",
      marginHorizontal: 20,
    },
    headerButtons: {
      flexDirection: "row",
      gap: 8,
    },
    themeButton: {
      width: 32,
      height: 32,
      backgroundColor: theme.inactive,
      borderRadius: 16,
      justifyContent: "center",
      alignItems: "center",
    },
    themeIcon: {
      fontSize: 16,
    },

    scrollArea: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 20,
    },

    loadingContainer: {
      padding: 40,
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 16,
      color: theme.textSecondary,
    },

    // Date Picker Styles
    datePickerContainer: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      alignItems: 'center',
    },
    datePickerLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 12,
    },

    // Selected Date Header
    selectedDateHeader: {
      marginBottom: 16,
      paddingBottom: 12,
      borderBottomWidth: 2,
      borderBottomColor: theme.primary + '30',
    },
    selectedDateTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 6,
    },
    selectedDateStats: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    selectedDateStatsText: {
      fontSize: 14,
      color: theme.textSecondary,
      fontWeight: '500',
    },
    selectedDateCalories: {
      fontSize: 14,
      color: theme.primary,
      fontWeight: '700',
    },

    // No Meals State
    noMealsContainer: {
      padding: 60,
      alignItems: 'center',
    },
    noMealsEmoji: {
      fontSize: 48,
      marginBottom: 16,
    },
    noMealsText: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 8,
    },
    noMealsSubtext: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: 'center',
    },

    mealsContainer: {
      paddingBottom: 8,
    },
    
    categorySection: {
      marginBottom: 16,
    },
    categoryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.surface,
      borderBottomWidth: 2,
      borderBottomColor: theme.primary + '30',
      borderTopLeftRadius: 12,
      borderTopRightRadius: 12,
    },
    categoryIcon: {
      fontSize: 22,
      marginRight: 10,
    },
    categoryTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.text,
      flex: 1,
      textTransform: 'capitalize',
    },
    categoryBadge: {
      backgroundColor: theme.primary,
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 4,
      minWidth: 28,
      alignItems: 'center',
    },
    categoryBadgeText: {
      color: '#fff',
      fontSize: 13,
      fontWeight: 'bold',
    },
    
    mealItem: {
      marginHorizontal: 12,
      marginTop: 10,
      backgroundColor: theme.surface,
      borderRadius: 10,
      padding: 14,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 2,
      elevation: 2,
    },
    mealItemHeader: {
      marginBottom: 12,
    },
    mealItemTop: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    mealItemInfo: {
      flex: 1,
    },
    mealNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    mealName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
      flex: 1,
    },
    mealTime: {
      fontSize: 12,
      color: theme.textSecondary,
      fontWeight: '500',
    },
    mealTypeIcon: {
      fontSize: 18,
      marginLeft: 8,
    },
    mealNutrition: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.background,
      borderRadius: 8,
      padding: 10,
      gap: 4,
    },
    nutritionItem: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 6,
    },
    nutritionValue: {
      fontSize: 15,
      fontWeight: 'bold',
      color: theme.primary,
      marginBottom: 2,
    },
    nutritionLabel: {
      fontSize: 10,
      color: theme.textSecondary,
      textTransform: 'uppercase',
      fontWeight: '600',
    },

    bottomSpacing: {
      height: 30,
    },
  });
