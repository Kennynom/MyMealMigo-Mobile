import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { db } from '@/lib/firebase';
import { checkCalorieGoalExceedance, logMealToFirebase, updateCalorieTracking } from '@/utils/mealService';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const PLACEHOLDER = require('@/assets/images/placeholder-recipe.png');

export default function RecipeDetail() {
  const { id } = useLocalSearchParams();          // recipe doc id
  const { theme } = useTheme();
  const { user } = useAuth();
  const { isPremium } = usePremiumStatus();

  const [item, setItem] = useState(null);
  const [showMealCategoryModal, setShowMealCategoryModal] = useState(false);
  const [logging, setLogging] = useState(false);
  const [servingMultiplier, setServingMultiplier] = useState(1);

  const styles = createStyles(theme);

  const mealCategories = [
    { id: 'breakfast', label: 'Breakfast', icon: '🌅' },
    { id: 'lunch', label: 'Lunch', icon: '🌞' },
    { id: 'dinner', label: 'Dinner', icon: '🌙' },
  ];

  const mealTypes = [
    { id: 'meal', label: 'Meal' },
    { id: 'beverage', label: 'Beverage' },
  ];

  useEffect(() => {
    (async () => {
      const snap = await getDoc(doc(db, 'recipes', String(id)));
      if (snap.exists()) setItem({ id: snap.id, ...snap.data() });
    })();
  }, [id]);

  const handleAddToMealLog = () => {
    if (!isPremium) {
      Alert.alert(
        '🔒 Premium Feature',
        'Adding recipes to your meal log is a premium feature. Upgrade to easily track your favorite recipes!',
        [
          {
            text: 'Upgrade Now',
            onPress: () => router.push('/(tabs)/(home)/(profile)/(subscription)')
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
      return;
    }
    setShowMealCategoryModal(true);
  };

  const handleLogMeal = async (mealCategory, mealType) => {
    if (!user?.uid || !item) return;
    
    setShowMealCategoryModal(false);
    setLogging(true);

    try {
      const mealData = {
        userId: user.uid,
        foodName: item.title || 'Recipe',
        calories: item.Macros?.calories || item.calories || 0,
        protein: item.Macros?.protein || 0,
        carbs: item.Macros?.carbs || 0,
        fat: item.Macros?.fat || 0,
        sodium: item.Macros?.sodium || 0,
        sugar: item.Macros?.sugar || 0,
        servingSize: servingMultiplier,
        servingUnit: 'serving',
        mealCategory: mealCategory,
        mealType: mealType,
        entryMethod: 'recipes',
        recipeId: item.id,
        timestamp: new Date(),
      };

      // Check if this recipe will exceed calorie goal
      const totalCalories = mealData.calories * mealData.servingSize;
      const exceedanceCheck = await checkCalorieGoalExceedance(user.uid, totalCalories);
      
      if (exceedanceCheck.hasGoal && exceedanceCheck.willExceed) {
        // Show warning and ask for confirmation
        setLogging(false);
        Alert.alert(
          '⚠️ Calorie Goal Warning',
          `This recipe will exceed your daily calorie goal by ${exceedanceCheck.exceedBy} calories.\n\n` +
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
                setLogging(false);
              }
            },
            {
              text: 'Log Anyway',
              style: 'default',
              onPress: async () => {
                setLogging(true);
                await proceedWithLogging(mealData, mealCategory);
              }
            }
          ]
        );
        return; // Stop here and wait for user decision
      }

      // If no warning, proceed with logging
      await proceedWithLogging(mealData, mealCategory);
      
    } catch (error) {
      console.error('Error logging recipe:', error);
      Alert.alert('Error', 'Failed to log recipe. Please try again.');
      setLogging(false);
    }
  };

  // Separate function to handle the actual logging
  const proceedWithLogging = async (mealData, mealCategory) => {
    try {
      await logMealToFirebase(mealData);
      await updateCalorieTracking(user.uid, mealData);

      Alert.alert(
        'Success',
        `Recipe logged to ${mealCategory} successfully!`,
        [
          {
            text: 'View Logs',
            onPress: () => router.push('/(tabs)/(logs)'),
          },
          {
            text: 'OK',
            style: 'cancel',
          },
        ]
      );
    } catch (error) {
      console.error('Error logging recipe:', error);
      Alert.alert('Error', 'Failed to log recipe. Please try again.');
    } finally {
      setLogging(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {item?.title || 'Recipe'}
          </Text>
          <Text style={styles.headerSubtitle}>Recipe details</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      {!item ? (
        <View style={styles.center}><Text style={{ color: theme.textSecondary }}>Loading…</Text></View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Hero image */}
          <Image
            source={
              item.imageURL ? { uri: item.imageURL }
              : PLACEHOLDER
            }
            style={styles.hero}
          />

          {/* Title + description */}
          <View style={styles.block}>
            <Text style={styles.title}>{item.title}</Text>
            {!!item.description && (
              <Text style={styles.desc}>{item.description}</Text>
            )}

            {/* Meta */}
            <View style={styles.metaRow}>
              {item.cook_time ? <Text style={styles.meta}>{item.cook_time} min</Text> : null}
              {item.servings ? <Text style={styles.meta}>• {item.servings} servings</Text> : null}
              {item.calories ? <Text style={styles.meta}>• {item.calories} kcal</Text> : null}
              {item.diet_type ? <Text style={styles.meta}>• {item.diet_type}</Text> : null}
            </View>
            {!!item.tags?.length && (
              <Text style={styles.tags}>
                {Array.isArray(item.tags) ? item.tags.join(', ') : String(item.tags)}
              </Text>
            )}
          </View>

          {/* Macros */}
          {!!item.Macros && (
            <View style={styles.block}>
              <Text style={styles.sectionTitle}>Nutrition Facts (Per 1 Serving)</Text>
              <View style={styles.macrosGrid}>
                {item.Macros.calories && (
                  <View style={styles.macroItem}>
                    <Text style={styles.macroValue}>{item.Macros.calories}</Text>
                    <Text style={styles.macroLabel}>cal</Text>
                  </View>
                )}
                {item.Macros.carbs && (
                  <View style={styles.macroItem}>
                    <Text style={styles.macroValue}>{item.Macros.carbs}g</Text>
                    <Text style={styles.macroLabel}>carbs</Text>
                  </View>
                )}
                {item.Macros.protein && (
                  <View style={styles.macroItem}>
                    <Text style={styles.macroValue}>{item.Macros.protein}g</Text>
                    <Text style={styles.macroLabel}>protein</Text>
                  </View>
                )}
                {item.Macros.fat && (
                  <View style={styles.macroItem}>
                    <Text style={styles.macroValue}>{item.Macros.fat}g</Text>
                    <Text style={styles.macroLabel}>fat</Text>
                  </View>
                )}
                {item.Macros.sodium && (
                  <View style={styles.macroItem}>
                    <Text style={styles.macroValue}>{item.Macros.sodium}</Text>
                    <Text style={styles.macroLabel}>sodium</Text>
                  </View>
                )}
                {item.Macros.sugar && (
                  <View style={styles.macroItem}>
                    <Text style={styles.macroValue}>{item.Macros.sugar}g</Text>
                    <Text style={styles.macroLabel}>sugar</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Ingredients */}
          {!!item.ingredients?.length && (
            <View style={styles.block}>
              <Text style={styles.sectionTitle}>Ingredients</Text>
              {item.ingredients.map((ing, i) => (
                <Text key={i} style={styles.ingredient}>• {ing}</Text>
              ))}
            </View>
          )}

          {/* Steps */}
          {!!item.steps?.length && (
            <View style={styles.block}>
              <Text style={styles.sectionTitle}>Steps</Text>
              {item.steps.map((s, i) => (
                <Text key={i} style={styles.step}>{i + 1}. {s}</Text>
              ))}
            </View>
          )}

          {/* Log Meal Button */}
          <View style={styles.logButtonContainer}>
            <TouchableOpacity
              style={[
                styles.logMealButton,
                !isPremium && styles.logMealButtonLocked
              ]}
              onPress={handleAddToMealLog}
              disabled={logging}
            >
              {!isPremium && (
                <Text style={styles.lockIcon}>🔒 </Text>
              )}
              <Text style={[
                styles.logMealButtonText,
                !isPremium && styles.logMealButtonTextLocked
              ]}>
                {logging ? 'Logging...' : isPremium ? 'Add to Meal Log' : 'Premium Feature'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Meal Category Selection Modal */}
      <Modal
        visible={showMealCategoryModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowMealCategoryModal(false);
          setServingMultiplier(1);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Meal Category</Text>
              <TouchableOpacity 
                onPress={() => {
                  setShowMealCategoryModal(false);
                  setServingMultiplier(1);
                }}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* Serving Size Selector */}
              <View style={styles.modalServingSection}>
                <Text style={styles.modalSectionTitle}>Adjust Serving Size</Text>
                
                <View style={styles.servingInputRow}>
                  <TouchableOpacity 
                    style={styles.servingButton}
                    onPress={() => setServingMultiplier(Math.max(0.5, servingMultiplier - 0.5))}
                  >
                    <Text style={styles.servingButtonText}>−</Text>
                  </TouchableOpacity>
                  
                  <TextInput
                    style={styles.servingInput}
                    value={servingMultiplier.toString()}
                    onChangeText={(text) => {
                      const val = parseFloat(text);
                      if (!isNaN(val) && val > 0) {
                        setServingMultiplier(val);
                      }
                    }}
                    keyboardType="numeric"
                    selectTextOnFocus
                  />
                  
                  <TouchableOpacity 
                    style={styles.servingButton}
                    onPress={() => setServingMultiplier(servingMultiplier + 0.5)}
                  >
                    <Text style={styles.servingButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
                
                <Text style={styles.servingHint}>
                  {servingMultiplier.toFixed(1)} serving{servingMultiplier !== 1 ? 's' : ''}
                </Text>
              </View>

              {/* Nutrition Preview */}
              {!!item?.Macros && (
                <View style={styles.modalNutritionSection}>
                  <Text style={styles.modalSectionTitle}>Total Nutrition</Text>
                  <View style={styles.modalMacrosGrid}>
                    {item.Macros.calories && (
                      <View style={styles.modalMacroItem}>
                        <Text style={styles.modalMacroValue}>{Math.round(item.Macros.calories * servingMultiplier)}</Text>
                        <Text style={styles.modalMacroLabel}>cal</Text>
                      </View>
                    )}
                    {item.Macros.carbs && (
                      <View style={styles.modalMacroItem}>
                        <Text style={styles.modalMacroValue}>{(item.Macros.carbs * servingMultiplier).toFixed(1)}g</Text>
                        <Text style={styles.modalMacroLabel}>carbs</Text>
                      </View>
                    )}
                    {item.Macros.protein && (
                      <View style={styles.modalMacroItem}>
                        <Text style={styles.modalMacroValue}>{(item.Macros.protein * servingMultiplier).toFixed(1)}g</Text>
                        <Text style={styles.modalMacroLabel}>protein</Text>
                      </View>
                    )}
                    {item.Macros.fat && (
                      <View style={styles.modalMacroItem}>
                        <Text style={styles.modalMacroValue}>{(item.Macros.fat * servingMultiplier).toFixed(1)}g</Text>
                        <Text style={styles.modalMacroLabel}>fat</Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* Meal Category Selection */}
              <Text style={styles.modalSectionTitle}>Select Meal Category</Text>
              {mealCategories.map((category) => (
                <View key={category.id} style={styles.categorySection}>
                  <Text style={styles.categoryLabel}>
                    {category.icon} {category.label}
                  </Text>
                  
                  <View style={styles.typeButtonsRow}>
                    {mealTypes.map((type) => (
                      <TouchableOpacity
                        key={`${category.id}-${type.id}`}
                        style={styles.typeButton}
                        onPress={() => handleLogMeal(category.id, type.id)}
                      >
                        <Text style={styles.typeButtonText}>{type.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (theme) => StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.background,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.surface,
    alignItems: 'center',
    justifyContent: 'center',
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
    paddingHorizontal: 8,
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
  placeholder: { width: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: { width: '100%', height: 240, backgroundColor: '#222' },
  block: { 
    margin: 16, 
    padding: 16, 
    borderRadius: 16,
    backgroundColor: theme.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  title: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    marginBottom: 6,
    color: theme.text,
  },
  desc: { 
    fontSize: 14, 
    lineHeight: 20,
    color: theme.textSecondary,
  },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  meta: { 
    fontSize: 12,
    color: theme.textSecondary,
  },
  tags: { 
    fontSize: 12, 
    marginTop: 6,
    color: theme.textSecondary,
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginBottom: 10,
    color: theme.text,
  },
  macrosGrid: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: theme.surface, 
    borderRadius: 10, 
    padding: 12,
    gap: 6,
  },
  macroItem: { 
    flex: 1, 
    alignItems: 'center', 
    paddingVertical: 8,
  },
  macroValue: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    marginBottom: 4,
    color: theme.primary,
  },
  macroLabel: { 
    fontSize: 10, 
    textTransform: 'uppercase', 
    fontWeight: '600',
    color: theme.textSecondary,
  },
  ingredient: { 
    fontSize: 14, 
    lineHeight: 22, 
    marginBottom: 4,
    color: theme.text,
  },
  li: { 
    fontSize: 14, 
    lineHeight: 22, 
    marginBottom: 4,
    color: theme.text,
  },
  step: { 
    fontSize: 15, 
    lineHeight: 24, 
    marginBottom: 8,
    color: theme.text,
  },
  logButtonContainer: { 
    paddingHorizontal: 16, 
    paddingVertical: 20,
  },
  logMealButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    backgroundColor: theme.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logMealButtonLocked: {
    backgroundColor: theme.textSecondary,
    opacity: 0.6,
  },
  logMealButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  logMealButtonTextLocked: {
    color: 'white',
    opacity: 0.9,
  },
  lockIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: theme.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
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
    fontSize: 20,
    fontWeight: '600',
    color: theme.text,
  },
  modalCloseButton: {
    padding: 4,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: theme.surface,
  },
  modalCloseText: {
    fontSize: 20,
    fontWeight: '300',
    color: theme.textSecondary,
  },
  modalContent: {
    padding: 20,
  },
  modalServingSection: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: theme.surface,
    borderRadius: 12,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: theme.text,
  },
  servingInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 8,
  },
  servingButton: {
    backgroundColor: theme.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  servingButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: '600',
  },
  servingInput: {
    backgroundColor: theme.background,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    textAlign: 'center',
    minWidth: 80,
  },
  servingHint: {
    fontSize: 14,
    color: theme.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalNutritionSection: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: theme.surface,
    borderRadius: 12,
  },
  modalMacrosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modalMacroItem: {
    flex: 1,
    minWidth: '45%',
    padding: 12,
    backgroundColor: theme.background,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalMacroValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.primary,
    marginBottom: 4,
  },
  modalMacroLabel: {
    fontSize: 12,
    color: theme.textSecondary,
    textTransform: 'uppercase',
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: theme.text,
  },
  typeButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    backgroundColor: theme.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  typeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

function colors(scheme) {
  // Deprecated - using theme context now
  return {};
}
