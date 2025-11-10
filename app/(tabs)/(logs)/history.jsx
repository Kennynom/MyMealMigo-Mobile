// app/(tabs)/(logs)/history.jsx
import { useAuth } from "@/context/AuthContext";
import { ThemeContext } from "@/context/ThemeContext";
import { getUserMeals } from "@/utils/mealService";
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
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
  const { theme, colorScheme } = useContext(ThemeContext);
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
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Meal History</Text>
          <Text style={styles.headerSubtitle}>View your past meals and nutrition data</Text>
        </View>

        <View style={styles.placeholder} />
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
                <MaterialIcons name="dinner-dining" size={28} color="saddlebrown" />
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
                        {category === 'breakfast' ? <MaterialCommunityIcons name="weather-sunset" size={24} color="orangered" style={styles.categoryIcon} /> 
                        : category === 'lunch' ? <MaterialCommunityIcons name="weather-sunny" size={24} color="orange" style={styles.categoryIcon} /> 
                        : <MaterialCommunityIcons name="weather-moonset" size={24} color="royalblue" style={styles.categoryIcon} />}
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
                                    {meal.mealType === 'beverage' ? 
                                    <MaterialIcons name="emoji-food-beverage" size={28} color="orange" /> :
                                    <MaterialIcons name="dinner-dining" size={28} color="saddlebrown" />
                                    }
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

    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 20,
      backgroundColor: theme.background,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.surface,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    backText: {
      color: theme.text,
      fontSize: 20,
      fontWeight: '600',
    },
    headerCenter: {
      flex: 1,
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
    placeholder: {
      width: 40,
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
      backgroundColor: theme.background,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
      borderRadius: 20,
      padding: 24,
      marginBottom: 24,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.border,
    },
    datePickerLabel: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 16,
      letterSpacing: 0.3,
    },

    // Selected Date Header
    selectedDateHeader: {
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      backgroundColor: theme.background,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
      borderWidth: 1,
      borderColor: theme.border,
    },
    selectedDateTitle: {
      fontSize: 22,
      fontWeight: '800',
      color: theme.text,
      marginBottom: 10,
      letterSpacing: 0.3,
    },
    selectedDateStats: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 8,
    },
    selectedDateStatsText: {
      fontSize: 13,
      color: theme.textSecondary,
      fontWeight: '600',
    },
    selectedDateCalories: {
      fontSize: 14,
      color: theme.primary,
      fontWeight: '800',
    },

    // No Meals State
    noMealsContainer: {
      borderRadius: 20,
      padding: 60,
      alignItems: 'center',
      marginVertical: 20,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.background,
      elevation: 4,
    },
    noMealsEmoji: {
      fontSize: 56,
      marginBottom: 20,
      opacity: 0.7,
    },
    noMealsText: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 8,
    },
    noMealsSubtext: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },

    mealsContainer: {
      paddingBottom: 20,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    },
    
    categorySection: {
      marginBottom: 24,
      backgroundColor: theme.background,
      borderRadius: 16,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.border,
      paddingBottom: 12,
    },
    categoryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: theme.background,
      borderBottomWidth: 2,
      borderBottomColor: theme.primary + '20',
    },
    categoryIcon: {
      marginRight: 12,
    },
    categoryTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.text,
      flex: 1,
      textTransform: 'capitalize',
      letterSpacing: 0.3,
    },
    categoryBadge: {
      backgroundColor: theme.primary,
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 6,
      minWidth: 32,
      alignItems: 'center',
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 3,
    },
    categoryBadgeText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '800',
    },
    
    mealItem: {
      marginHorizontal: 16,
      marginTop: 12,
      marginBottom: 4,
      backgroundColor: theme.background,
      borderRadius: 12,
      padding: 16,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 6,
      elevation: 2,
      borderWidth: 1,
      borderColor: theme.border,
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
      marginBottom: 4,
    },
    mealName: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.text,
      flex: 1,
      letterSpacing: 0.2,
    },
    mealTime: {
      fontSize: 12,
      color: theme.textSecondary,
      fontWeight: '600',
    },
    mealTypeIcon: {
      fontSize: 20,
      marginLeft: 10,
    },
    mealNutrition: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.surface,
      borderRadius: 10,
      padding: 12,
      gap: 8,
      borderWidth: 1,
      borderColor: theme.border,
    },
    nutritionItem: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 4,
    },
    nutritionValue: {
      fontSize: 16,
      fontWeight: '800',
      color: theme.primary,
      marginBottom: 3,
      letterSpacing: 0.3,
    },
    nutritionLabel: {
      fontSize: 10,
      color: theme.textSecondary,
      textTransform: 'uppercase',
      fontWeight: '700',
      letterSpacing: 0.5,
    },

    bottomSpacing: {
      height: 40,
    },
  });
