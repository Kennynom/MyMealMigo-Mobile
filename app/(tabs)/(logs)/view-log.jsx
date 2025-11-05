// app/(tabs)/(logs)/view-log.jsx
import ReflectionRow from "@/components/ReflectionRow";
import SummaryModal from "@/components/SummaryModal";
import { useAuth } from "@/context/AuthContext";
import { useJournal } from "@/context/JournalContext";
import { ThemeContext } from "@/context/ThemeContext";
import { deleteMealAndCalories, getUserMeals } from "@/utils/mealService";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ViewMealLogScreen() {
  const { theme, colorScheme, setColorScheme } = useContext(ThemeContext);
  const { user } = useAuth();
  const styles = createStyles(theme, colorScheme);

  const { tab: initialTabParam } = useLocalSearchParams();
  const [tab, setTab] = useState("Meal log"); // "Meal log" | "Reflection"
  const [showSummary, setShowSummary] = useState(false);
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Modal states for editing meals
  const [showMealListModal, setShowMealListModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showEditMethodModal, setShowEditMethodModal] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState(null);

  const { entries, deleteEntry } = useJournal();

  // Fetch meals when component mounts or user changes
  useEffect(() => {
    if (user?.uid && tab === "Meal log") {
      fetchMeals();
    }
  }, [user, tab]);

  // Refetch meals when screen comes into focus (e.g., after editing a meal)
  useFocusEffect(
    useCallback(() => {
      if (user?.uid && tab === "Meal log") {
        fetchMeals();
      }
    }, [user, tab])
  );

  const fetchMeals = async () => {
    if (!user?.uid) return;
    
    setLoading(true);
    try {
      const userMeals = await getUserMeals(user.uid);
      setMeals(userMeals);
    } catch (error) {
      console.error('Error fetching meals:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group meals by category for today's date
  const mealsByCategory = useMemo(() => {
    // Get today's date in local timezone (YYYY-MM-DD format)
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayStr = today.toLocaleDateString('en-CA'); // Format: YYYY-MM-DD in local timezone
    
    const todayMeals = meals.filter(meal => {
      // Convert meal timestamp to local date string
      const mealTimestamp = new Date(meal.timestamp);
      const mealDateStr = new Date(
        mealTimestamp.getFullYear(),
        mealTimestamp.getMonth(),
        mealTimestamp.getDate()
      ).toLocaleDateString('en-CA'); // Format: YYYY-MM-DD in local timezone
      
      return mealDateStr === todayStr;
    });

    return {
      breakfast: todayMeals.filter(m => m.mealCategory === 'breakfast'),
      lunch: todayMeals.filter(m => m.mealCategory === 'lunch'),
      dinner: todayMeals.filter(m => m.mealCategory === 'dinner'),
    };
  }, [meals]);

  // open Reflection tab automatically if navigated with ?tab=reflections
  useEffect(() => {
    if (initialTabParam === "reflections") {
      setTab("Reflection");
    }
  }, [initialTabParam]);

  // newest first
  const sortedReflections = useMemo(() => {
    return [...entries].sort((a, b) => {
      if (a.dateISO < b.dateISO) return 1;
      if (a.dateISO > b.dateISO) return -1;
      return 0;
    });
  }, [entries]);

  const toggleTheme = () => {
    setColorScheme(colorScheme === "dark" ? "light" : "dark");
  };

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  function handleAddReflection() {
    router.push("/(journal)/Editor");
  }

  function handleEditReflection(id) {
    router.push({
      pathname: "/(journal)/Editor",
      params: { id },
    });
  }

  function handleDeleteReflection(id) {
    deleteEntry(id);
  }

  // Handler for clicking the pencil icon on a meal category
  function handleEditMealCategory(mealCategory) {
    setSelectedCategory(mealCategory);
    setShowMealListModal(true);
  }

  // Handler for clicking Edit on a specific meal
  function handleEditMeal(meal) {
    setSelectedMeal(meal);
    setShowMealListModal(false);
    setShowEditMethodModal(true);
  }

  // Handler for selecting an edit method (photo, barcode, manual)
  function handleSelectEditMethod(method) {
    setShowEditMethodModal(false);

    if (!selectedMeal) return;

    // Navigate to the appropriate screen with edit mode enabled
    const editParams = {
      editMode: 'true',
      mealId: selectedMeal.id,
      mealData: JSON.stringify({
        foodName: selectedMeal.foodName,
        calories: selectedMeal.calories,
        protein: selectedMeal.protein,
        carbs: selectedMeal.carbs,
        fat: selectedMeal.fat,
        sodium: selectedMeal.sodium,
        sugar: selectedMeal.sugar,
        servingSize: selectedMeal.servingSize,
        servingUnit: selectedMeal.servingUnit,
        mealCategory: selectedMeal.mealCategory,
        mealType: selectedMeal.mealType,
        timestamp: selectedMeal.timestamp?.toISOString?.() || new Date(selectedMeal.timestamp).toISOString(),
      })
    };

    switch (method) {
      case 'photo':
        router.push({
          pathname: '/(tabs)/(add)/photo-capture',
          params: editParams
        });
        break;
      case 'barcode':
        router.push({
          pathname: '/(tabs)/(add)/scan-barcode',
          params: editParams
        });
        break;
      case 'manual':
        router.push({
          pathname: '/(tabs)/(add)/manual-entry',
          params: editParams
        });
        break;
    }
  }

  // Handler for deleting a meal
  async function handleDeleteMeal(meal) {
    Alert.alert(
      'Delete Meal',
      `Are you sure you want to delete "${meal.foodName}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMealAndCalories(user.uid, meal.id, meal);
              Alert.alert('Success', 'Meal deleted successfully');
              fetchMeals(); // Refresh the meal list
            } catch (error) {
              console.error('Error deleting meal:', error);
              Alert.alert('Error', 'Failed to delete meal. Please try again.');
            }
          }
        }
      ]
    );
  }

  const isMealTab = tab === "Meal log";
  const isReflectionTab = tab === "Reflection";

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

          <Text style={styles.headerTitle}>
            {isMealTab
              ? "View Meal Log"
              : "Your Reflections"}
          </Text>

          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.themeButton}
              onPress={toggleTheme}
            >
              <Text style={styles.themeIcon}>
                {colorScheme === "dark" ? "☀️" : "🌙"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.profileButton}>
              <Text style={styles.profileIcon}>👤</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* TAB SWITCH */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabBase,
              isMealTab && styles.activeTab,
              !isMealTab && styles.inactiveTab,
            ]}
            onPress={() => setTab("Meal log")}
          >
            <Text
              style={[
                styles.tabTextBase,
                isMealTab
                  ? styles.activeTabText
                  : styles.inactiveTabText,
              ]}
            >
              Meal log
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabBase,
              isReflectionTab && styles.activeTab,
              !isReflectionTab && styles.inactiveTab,
            ]}
            onPress={() => setTab("Reflection")}
          >
            <Text
              style={[
                styles.tabTextBase,
                isReflectionTab
                  ? styles.activeTabText
                  : styles.inactiveTabText,
              ]}
            >
              Reflection
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* DATE */}
      <View style={styles.dateContainer}>
        <Text style={styles.dateText}>{currentDate}</Text>
      </View>

      {/* BODY */}
      <ScrollView
        style={styles.scrollArea}
        showsVerticalScrollIndicator={false}
      >
        {/* -------- MEAL TAB -------- */}
        {isMealTab && (
          <>
            {["breakfast", "lunch", "dinner"].map(
              (mealCategory, idx) => {
                const categoryMeals = mealsByCategory[mealCategory] || [];
                const categoryLabel = mealCategory.charAt(0).toUpperCase() + mealCategory.slice(1);
                
                return (
                  <View key={idx} style={styles.mealCard}>
                    <View style={styles.mealHeader}>
                      <Text style={styles.mealTitle}>
                        {categoryLabel} {mealCategory === 'breakfast' ? '🌅' : mealCategory === 'lunch' ? '🌞' : '🌙'}
                      </Text>
                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => handleEditMealCategory(mealCategory)}
                      >
                        <Text style={styles.editIcon}>✏️</Text>
                      </TouchableOpacity>
                    </View>

                    {categoryMeals.length === 0 ? (
                      <View style={styles.chartPlaceholder}>
                        <Text style={styles.chartText}>
                        </Text>
                        <Text
                          style={{
                            color: theme.textSecondary,
                            fontSize: 12,
                            marginTop: 4,
                            textAlign: "center",
                          }}
                        >
                          No meals logged yet
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.mealsListContainer}>
                        {categoryMeals.map((meal, mealIdx) => (
                          <View key={meal.id || mealIdx} style={styles.mealItemCard}>
                            <View style={styles.mealItemHeader}>
                              <Text style={styles.mealItemName}>{meal.foodName}</Text>
                              <Text style={styles.mealItemType}>
                                {meal.mealType === 'beverage' ? '🥤' : '🍽️'} {meal.mealType}
                              </Text>
                            </View>
                            <View style={styles.mealItemNutrition}>
                              <Text style={styles.nutritionText}>
                                {meal.calories} cal
                              </Text>
                              <Text style={styles.nutritionDivider}>•</Text>
                              <Text style={styles.nutritionText}>
                                C: {meal.carbs}g
                              </Text>
                              <Text style={styles.nutritionDivider}>•</Text>
                              <Text style={styles.nutritionText}>
                                P: {meal.protein}g
                              </Text>
                              <Text style={styles.nutritionDivider}>•</Text>
                              <Text style={styles.nutritionText}>
                                F: {meal.fat}g
                              </Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                );
              }
            )}

            <View style={styles.bottomSpacing} />
          </>
        )}

        {/* -------- REFLECTION TAB -------- */}
        {isReflectionTab && (
          <>
            {/* LIST OF REFLECTIONS */}
            {sortedReflections.length === 0 ? (
              <View
                style={styles.emptyReflectionCard}
              >
                <Text
                  style={styles.emptyReflectionText}
                >
                  You haven't added any reflections
                  yet.
                </Text>
              </View>
            ) : (
              sortedReflections.map((entry) => (
                <ReflectionRow
                  key={entry.id}
                  entry={entry}
                  onEdit={() =>
                    handleEditReflection(entry.id)
                  }
                  onDelete={() =>
                    handleDeleteReflection(entry.id)
                  }
                />
              ))
            )}

            {/* TREND / GRAPH PLACEHOLDER */}
            <View style={styles.trendCard}>
              <Text style={styles.trendTitle}>
                Wellness Trends
              </Text>
              <View style={styles.trendBody}>
                <Text style={styles.trendEmoji}>
                  📈
                </Text>
                <Text style={styles.trendNote}>
                  This is where your mood / sleep /
                  stress / hydration over time will
                  be plotted from Smart Dashboard.
                </Text>
              </View>
            </View>

            <View style={styles.bottomSpacing} />
          </>
        )}
      </ScrollView>

      {/* ADD BUTTON (bottom CTA) */}
      <View style={styles.addButtonContainer}>
        {isMealTab ? (
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => router.push('/(tabs)/(add)')}
          >
            <Text style={styles.addButtonText}>
              Add Meal
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddReflection}
          >
            <Text style={styles.addButtonText}>
              Add Reflection
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* SUMMARY BUTTON */}
      <Pressable
        onPress={() => setShowSummary(true)}
        style={[
          styles.summaryFab,
          {
            backgroundColor: theme.primary,
            shadowColor: theme.shadow,
          },
        ]}
      >
        <Text style={styles.summaryFabText}>
          Summary
        </Text>
      </Pressable>

      <SummaryModal
        visible={showSummary}
        onClose={() => setShowSummary(false)}
      />

      {/* MEAL LIST MODAL - Shows all meals in selected category */}
      <Modal
        visible={showMealListModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMealListModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedCategory && `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Meals`}
              </Text>
              <TouchableOpacity onPress={() => setShowMealListModal(false)}>
                <Text style={styles.modalCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {selectedCategory && mealsByCategory[selectedCategory]?.map((meal, index) => (
                <View key={meal.id || index} style={styles.mealItemRow}>
                  <View style={styles.mealItemInfo}>
                    <Text style={styles.mealItemName}>{meal.foodName}</Text>
                    <Text style={styles.mealItemDetails}>
                      {meal.calories} cal • {meal.mealType === 'beverage' ? '🥤' : '🍽️'} {meal.mealType}
                    </Text>
                  </View>
                  <View style={styles.mealItemActions}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.editActionButton]}
                      onPress={() => handleEditMeal(meal)}
                    >
                      <Text style={styles.actionButtonText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteActionButton]}
                      onPress={() => handleDeleteMeal(meal)}
                    >
                      <Text style={styles.actionButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              
              {selectedCategory && mealsByCategory[selectedCategory]?.length === 0 && (
                <View style={styles.emptyMealList}>
                  <Text style={styles.emptyMealListText}>No meals logged yet</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* EDIT METHOD MODAL - Shows photo/barcode/manual options */}
      <Modal
        visible={showEditMethodModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditMethodModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Edit: {selectedMeal?.foodName}
              </Text>
              <TouchableOpacity onPress={() => setShowEditMethodModal(false)}>
                <Text style={styles.modalCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <Text style={styles.editMethodSubtitle}>Choose how to edit this meal:</Text>
              
              <TouchableOpacity
                style={styles.editMethodButton}
                onPress={() => handleSelectEditMethod('photo')}
              >
                <Text style={styles.editMethodIcon}>📸</Text>
                <Text style={styles.editMethodText}>Take Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.editMethodButton}
                onPress={() => handleSelectEditMethod('barcode')}
              >
                <Text style={styles.editMethodIcon}>📱</Text>
                <Text style={styles.editMethodText}>Scan Barcode</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.editMethodButton}
                onPress={() => handleSelectEditMethod('manual')}
              >
                <Text style={styles.editMethodIcon}>✏️</Text>
                <Text style={styles.editMethodText}>Manual Entry</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
      marginBottom: 20,
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
    profileButton: {
      width: 32,
      height: 32,
      backgroundColor: theme.primary,
      borderRadius: 16,
      justifyContent: "center",
      alignItems: "center",
    },
    profileIcon: {
      color: "#fff",
      fontSize: 14,
    },

    tabContainer: {
      flexDirection: "row",
      backgroundColor: theme.inactive,
      borderRadius: 25,
      padding: 4,
    },
    tabBase: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 20,
      alignItems: "center",
    },
    activeTab: {
      backgroundColor: theme.primary,
    },
    inactiveTab: {
      backgroundColor: "transparent",
    },
    tabTextBase: {
      fontSize: 14,
      fontWeight: "600",
    },
    activeTabText: {
      color: "#fff",
    },
    inactiveTabText: {
      color: theme.textSecondary,
    },

    dateContainer: {
      padding: 20,
    },
    dateText: {
      fontSize: 16,
      color: theme.text,
      fontWeight: "500",
    },

    scrollArea: {
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
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 15,
    },
    mealTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: theme.text,
    },
    editButton: {
      padding: 5,
    },
    editIcon: {
      fontSize: 16,
      color: theme.textSecondary,
    },
    chartPlaceholder: {
      backgroundColor: theme.inactive,
      minHeight: 80,
      borderRadius: 8,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 10,
    },
    chartText: {
      color: theme.text,
      fontSize: 14,
      fontWeight: "600",
    },

    emptyReflectionCard: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 16,
      marginBottom: 16,
      alignItems: "center",
    },
    emptyReflectionText: {
      color: theme.textSecondary,
      fontSize: 14,
      textAlign: "center",
    },

    trendCard: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 16,
      marginBottom: 16,
    },
    trendTitle: {
      color: theme.text,
      fontWeight: "700",
      fontSize: 16,
      marginBottom: 8,
    },
    trendBody: {
      flexDirection: "row",
      gap: 12,
      alignItems: "flex-start",
    },
    trendEmoji: {
      fontSize: 24,
    },
    trendNote: {
      color: theme.textSecondary,
      fontSize: 13,
      lineHeight: 18,
      flex: 1,
    },

    bottomSpacing: {
      height: 80,
    },

    addButtonContainer: {
      paddingHorizontal: 20,
      paddingBottom: 40,
      backgroundColor: theme.background,
    },
    addButton: {
      backgroundColor: theme.primary,
      borderRadius: 12,
      paddingVertical: 15,
      alignItems: "center",
    },
    addButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "bold",
    },

    summaryFab: {
      position: "absolute",
      right: 20,
      bottom: 110,
      borderRadius: 999,
      paddingVertical: 10,
      paddingHorizontal: 16,
      elevation: 5,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
    },
    summaryFabText: {
      color: "#fff",
      fontWeight: "700",
      fontSize: 14,
    },
    
    // Meal item styles
    mealsListContainer: {
      gap: 10,
    },
    mealItemCard: {
      backgroundColor: theme.background,
      borderRadius: 8,
      padding: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    mealItemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    mealItemName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
      flex: 1,
    },
    mealItemType: {
      fontSize: 12,
      color: theme.textSecondary,
      fontWeight: '500',
      textTransform: 'capitalize',
    },
    mealItemNutrition: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 6,
    },
    nutritionText: {
      fontSize: 13,
      color: theme.textSecondary,
    },
    nutritionDivider: {
      fontSize: 13,
      color: theme.textSecondary,
    },

    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContainer: {
      backgroundColor: theme.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '80%',
      paddingBottom: 20,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.text,
    },
    modalCloseButton: {
      fontSize: 24,
      color: theme.textSecondary,
      fontWeight: '300',
    },
    modalContent: {
      padding: 20,
    },

    // Meal item row in modal
    mealItemRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: theme.background,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    mealItemInfo: {
      flex: 1,
      marginRight: 12,
    },
    mealItemDetails: {
      fontSize: 13,
      color: theme.textSecondary,
      marginTop: 4,
    },
    mealItemActions: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
      minWidth: 70,
      alignItems: 'center',
    },
    editActionButton: {
      backgroundColor: theme.primary,
    },
    deleteActionButton: {
      backgroundColor: '#ff4444',
    },
    actionButtonText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
    },
    emptyMealList: {
      padding: 40,
      alignItems: 'center',
    },
    emptyMealListText: {
      fontSize: 14,
      color: theme.textSecondary,
    },

    // Edit method modal styles
    editMethodSubtitle: {
      fontSize: 14,
      color: theme.textSecondary,
      marginBottom: 20,
    },
    editMethodButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.background,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    editMethodIcon: {
      fontSize: 24,
      marginRight: 16,
    },
    editMethodText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
    },
  });
