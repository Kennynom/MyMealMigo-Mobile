import { AuthContext } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { checkCalorieGoalExceedance, logMealToFirebase, updateCalorieTracking } from '@/utils/mealService';
import { Stack, useLocalSearchParams } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import React, { useContext, useEffect, useState } from 'react';
import { Alert, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';

const PLACEHOLDER = require('@/assets/images/placeholder-recipe.png');

export default function RecipeDetail() {
  const { id } = useLocalSearchParams();          // recipe doc id
  const scheme = useColorScheme();
  const c = colors(scheme);
  const { user } = useContext(AuthContext);

  const [item, setItem] = useState(null);
  const [isLogging, setIsLogging] = useState(false);

  useEffect(() => {
    (async () => {
      const snap = await getDoc(doc(db, 'recipes', String(id)));
      if (snap.exists()) setItem({ id: snap.id, ...snap.data() });
    })();
  }, [id]);

  const handleAddToMealLog = () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to log meals');
      return;
    }

    if (!item?.Macros) {
      Alert.alert('No Nutrition Data', 'This recipe does not have nutritional information available.');
      return;
    }

    // Show meal category selection
    Alert.alert(
      'Add to Meal Log',
      'Select meal category:',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Breakfast',
          onPress: () => logRecipeToMeal('breakfast')
        },
        {
          text: 'Lunch',
          onPress: () => logRecipeToMeal('lunch')
        },
        {
          text: 'Dinner',
          onPress: () => logRecipeToMeal('dinner')
        }
      ]
    );
  };

  const logRecipeToMeal = async (mealCategory) => {
    if (isLogging) return;
    setIsLogging(true);

    try {
      const macros = item.Macros || {};
      
      // Create meal entry from recipe
      const mealEntry = {
        foodName: item.title || 'Recipe',
        calories: macros.calories || 0,
        protein: macros.protein || 0,
        carbs: macros.carbs || 0,
        fat: macros.fat || 0,
        sodium: macros.sodium || 0,
        sugar: macros.sugar || 0,
        servingSize: 1,
        servingUnit: 'serving',
        entryMethod: 'recipe',
        timestamp: new Date(),
        userId: user.uid,
        recipeId: item.id, // Store recipe reference
        mealCategory: mealCategory,
        mealType: 'meal'
      };

      // Check if this meal will exceed calorie goal
      const totalCalories = mealEntry.calories * mealEntry.servingSize;
      const exceedanceCheck = await checkCalorieGoalExceedance(user.uid, totalCalories);

      if (exceedanceCheck.hasGoal && exceedanceCheck.willExceed) {
        // Show warning and ask for confirmation
        setIsLogging(false);
        Alert.alert(
          '⚠️ Calorie Goal Warning',
          `This meal will exceed your daily calorie goal by ${exceedanceCheck.exceedBy} calories.\n\n` +
          `Current: ${exceedanceCheck.currentConsumed} cal\n` +
          `Adding: ${totalCalories} cal\n` +
          `Total: ${exceedanceCheck.totalAfterMeal} cal\n` +
          `Goal: ${exceedanceCheck.calorieGoal} cal\n\n` +
          `Do you want to continue?`,
          [
            {
              text: 'Cancel',
              style: 'cancel'
            },
            {
              text: 'Log Anyway',
              style: 'default',
              onPress: async () => {
                setIsLogging(true);
                await proceedWithLogging(mealEntry, mealCategory);
              }
            }
          ]
        );
        return;
      }

      // If no warning, proceed with logging
      await proceedWithLogging(mealEntry, mealCategory);

    } catch (error) {
      console.error('Error logging recipe to meal:', error);
      Alert.alert('Error', 'Failed to add recipe to meal log. Please try again.');
      setIsLogging(false);
    }
  };

  const proceedWithLogging = async (mealEntry, mealCategory) => {
    try {
      // Log meal to Firebase
      await logMealToFirebase(mealEntry);

      // Update calorie tracking
      await updateCalorieTracking(user.uid, mealEntry);

      Alert.alert(
        'Success',
        `Recipe added to ${mealCategory} log!`,
        [{ text: 'OK' }]
      );

      setIsLogging(false);
    } catch (error) {
      console.error('Error in proceedWithLogging:', error);
      Alert.alert('Error', 'Failed to save meal. Please try again.');
      setIsLogging(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Stack.Screen
        options={{
          title: item?.title || 'Recipe',
          headerShown: true,
          headerStyle: { backgroundColor: c.bg },
          headerTintColor: c.text,
        }}
      />
      {!item ? (
        <View style={styles.center}><Text style={{ color: c.muted }}>Loading…</Text></View>
      ) : (
        <>
          <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
            {/* Hero image */}
            <Image
              source={
                item.imageURL ? { uri: item.imageURL }
                : PLACEHOLDER
              }
              style={styles.hero}
            />

            {/* Title + description */}
            <View style={[styles.block, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Text style={[styles.title, { color: c.text }]}>{item.title}</Text>
              {!!item.description && (
                <Text style={[styles.desc, { color: c.muted }]}>{item.description}</Text>
              )}

              {/* Meta */}
              <View style={styles.metaRow}>
                {item.cook_time ? <Text style={[styles.meta, { color: c.muted }]}>{item.cook_time} min</Text> : null}
                {item.servings ? <Text style={[styles.meta, { color: c.muted }]}>• {item.servings} servings</Text> : null}
                {item.diet_type ? <Text style={[styles.meta, { color: c.muted }]}>• {item.diet_type}</Text> : null}
              </View>
              {!!item.tags?.length && (
                <Text style={[styles.tags, { color: c.muted }]}>
                  {Array.isArray(item.tags) ? item.tags.join(', ') : String(item.tags)}
                </Text>
              )}
            </View>

            {/* Macros (Nutritional Info) */}
            {item.Macros && (
              <View style={[styles.block, { backgroundColor: c.surface, borderColor: c.border }]}>
                <Text style={[styles.sectionTitle, { color: c.text }]}>Nutrition (per serving)</Text>
                <View style={styles.macrosGrid}>
                  {item.Macros.calories ? (
                    <View style={styles.macroItem}>
                      <Text style={[styles.macroValue, { color: c.accent }]}>{item.Macros.calories}</Text>
                      <Text style={[styles.macroLabel, { color: c.muted }]}>Calories</Text>
                    </View>
                  ) : null}
                  {item.Macros.protein ? (
                    <View style={styles.macroItem}>
                      <Text style={[styles.macroValue, { color: c.text }]}>{item.Macros.protein}g</Text>
                      <Text style={[styles.macroLabel, { color: c.muted }]}>Protein</Text>
                    </View>
                  ) : null}
                  {item.Macros.carbs ? (
                    <View style={styles.macroItem}>
                      <Text style={[styles.macroValue, { color: c.text }]}>{item.Macros.carbs}g</Text>
                      <Text style={[styles.macroLabel, { color: c.muted }]}>Carbs</Text>
                    </View>
                  ) : null}
                  {item.Macros.fat ? (
                    <View style={styles.macroItem}>
                      <Text style={[styles.macroValue, { color: c.text }]}>{item.Macros.fat}g</Text>
                      <Text style={[styles.macroLabel, { color: c.muted }]}>Fat</Text>
                    </View>
                  ) : null}
                  {item.Macros.sodium ? (
                    <View style={styles.macroItem}>
                      <Text style={[styles.macroValue, { color: c.text }]}>{item.Macros.sodium}mg</Text>
                      <Text style={[styles.macroLabel, { color: c.muted }]}>Sodium</Text>
                    </View>
                  ) : null}
                  {item.Macros.sugar ? (
                    <View style={styles.macroItem}>
                      <Text style={[styles.macroValue, { color: c.text }]}>{item.Macros.sugar}g</Text>
                      <Text style={[styles.macroLabel, { color: c.muted }]}>Sugar</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            )}

            {/* Ingredients */}
            {!!item.ingredients?.length && (
              <View style={[styles.block, { backgroundColor: c.surface, borderColor: c.border }]}>
                <Text style={[styles.sectionTitle, { color: c.text }]}>Ingredients</Text>
                {item.ingredients.map((ing, i) => (
                  <Text key={i} style={[styles.li, { color: c.text }]}>• {ing}</Text>
                ))}
              </View>
            )}

            {/* Steps */}
            {!!item.steps?.length && (
              <View style={[styles.block, { backgroundColor: c.surface, borderColor: c.border }]}>
                <Text style={[styles.sectionTitle, { color: c.text }]}>Steps</Text>
                {item.steps.map((s, i) => (
                  <Text key={i} style={[styles.step, { color: c.text }]}>{i + 1}. {s}</Text>
                ))}
              </View>
            )}
          </ScrollView>

          {/* Add to Meal Log Button */}
          {item.Macros && (
            <View style={[styles.bottomBar, { backgroundColor: c.surface, borderTopColor: c.border }]}>
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: c.accent }]}
                onPress={handleAddToMealLog}
                disabled={isLogging}
                activeOpacity={0.8}
              >
                <Text style={styles.addButtonText}>
                  {isLogging ? 'Adding...' : '✚ Add to Meal Log'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      {/* Meal Category Selection Modal */}
      <Modal
        visible={showMealCategoryModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMealCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: c.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: c.border }]}>
              <Text style={[styles.modalTitle, { color: c.text }]}>Select Meal Category</Text>
              <TouchableOpacity 
                onPress={() => setShowMealCategoryModal(false)}
                style={styles.modalCloseButton}
              >
                <Text style={[styles.modalCloseText, { color: c.muted }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {mealCategories.map((category) => (
                <View key={category.id} style={styles.categorySection}>
                  <Text style={[styles.categoryLabel, { color: c.text }]}>
                    {category.icon} {category.label}
                  </Text>
                  
                  <View style={styles.typeButtonsRow}>
                    {mealTypes.map((type) => (
                      <TouchableOpacity
                        key={`${category.id}-${type.id}`}
                        style={styles.typeButton}
                        onPress={() => handleMealCategorySelect(category.id, type.id)}
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

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: { width: '100%', height: 240, backgroundColor: '#222' },
  block: { margin: 16, padding: 16, borderRadius: 14, borderWidth: 1 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 6 },
  desc: { fontSize: 14, lineHeight: 20 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  meta: { fontSize: 12 },
  tags: { fontSize: 12, marginTop: 6 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 10 },
  li: { fontSize: 14, lineHeight: 22, marginBottom: 4 },
  step: { fontSize: 15, lineHeight: 24, marginBottom: 8 },
  
  // Macros grid
  macrosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  macroItem: { alignItems: 'center', minWidth: 80 },
  macroValue: { fontSize: 20, fontWeight: '700' },
  macroLabel: { fontSize: 11, marginTop: 2 },
  
  // Bottom bar with button
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
  },
  addButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalCloseText: {
    fontSize: 24,
    fontWeight: '300',
  },
  modalContent: {
    padding: 20,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  typeButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    backgroundColor: '#059669',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  typeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

function colors(scheme) {
  const dark = scheme === 'dark';
  return {
    bg: dark ? '#0B0B0D' : '#F7F7F8',
    surface: dark ? '#141418' : '#FFFFFF',
    text: dark ? '#F5F6F8' : '#121319',
    muted: dark ? 'rgba(234,236,240,0.68)' : 'rgba(21,23,28,0.68)',
    border: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    accent: '#1DB954', // Green accent for the button
  };
}
