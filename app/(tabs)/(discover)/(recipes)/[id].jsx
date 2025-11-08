import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { checkCalorieGoalExceedance, logMealToFirebase, updateCalorieTracking } from '@/utils/mealService';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native';

const PLACEHOLDER = require('@/assets/images/placeholder-recipe.png');

export default function RecipeDetail() {
  const { id } = useLocalSearchParams();          // recipe doc id
  const scheme = useColorScheme();
  const c = colors(scheme);
  const { user } = useAuth();

  const [item, setItem] = useState(null);
  const [showMealCategoryModal, setShowMealCategoryModal] = useState(false);
  const [logging, setLogging] = useState(false);

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
        servingSize: 1,
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
          <View style={[styles.block, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Text style={[styles.title, { color: c.text }]}>{item.title}</Text>
            {!!item.description && (
              <Text style={[styles.desc, { color: c.muted }]}>{item.description}</Text>
            )}

            {/* Meta */}
            <View style={styles.metaRow}>
              {item.cook_time ? <Text style={[styles.meta, { color: c.muted }]}>{item.cook_time} min</Text> : null}
              {item.servings ? <Text style={[styles.meta, { color: c.muted }]}>• {item.servings} servings</Text> : null}
              {item.calories ? <Text style={[styles.meta, { color: c.muted }]}>• {item.calories} kcal</Text> : null}
              {item.diet_type ? <Text style={[styles.meta, { color: c.muted }]}>• {item.diet_type}</Text> : null}
            </View>
            {!!item.tags?.length && (
              <Text style={[styles.tags, { color: c.muted }]}>
                {Array.isArray(item.tags) ? item.tags.join(', ') : String(item.tags)}
              </Text>
            )}
          </View>

          {/* Macros */}
          {!!item.Macros && (
            <View style={[styles.block, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Text style={[styles.sectionTitle, { color: c.text }]}>Nutrition Facts (Per 1 Serving)</Text>
              <View style={styles.macrosGrid}>
                {item.Macros.calories && (
                  <View style={styles.macroItem}>
                    <Text style={[styles.macroValue, { color: c.accent }]}>{item.Macros.calories}</Text>
                    <Text style={[styles.macroLabel, { color: c.muted }]}>cal</Text>
                  </View>
                )}
                {item.Macros.carbs && (
                  <View style={styles.macroItem}>
                    <Text style={[styles.macroValue, { color: c.accent }]}>{item.Macros.carbs}g</Text>
                    <Text style={[styles.macroLabel, { color: c.muted }]}>carbs</Text>
                  </View>
                )}
                {item.Macros.protein && (
                  <View style={styles.macroItem}>
                    <Text style={[styles.macroValue, { color: c.accent }]}>{item.Macros.protein}g</Text>
                    <Text style={[styles.macroLabel, { color: c.muted }]}>protein</Text>
                  </View>
                )}
                {item.Macros.fat && (
                  <View style={styles.macroItem}>
                    <Text style={[styles.macroValue, { color: c.accent }]}>{item.Macros.fat}g</Text>
                    <Text style={[styles.macroLabel, { color: c.muted }]}>fat</Text>
                  </View>
                )}
                {item.Macros.sodium && (
                  <View style={styles.macroItem}>
                    <Text style={[styles.macroValue, { color: c.accent }]}>{item.Macros.sodium}</Text>
                    <Text style={[styles.macroLabel, { color: c.muted }]}>sodium</Text>
                  </View>
                )}
                {item.Macros.sugar && (
                  <View style={styles.macroItem}>
                    <Text style={[styles.macroValue, { color: c.accent }]}>{item.Macros.sugar}g</Text>
                    <Text style={[styles.macroLabel, { color: c.muted }]}>sugar</Text>
                  </View>
                )}
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

          {/* Log Meal Button */}
          <View style={styles.logButtonContainer}>
            <TouchableOpacity
              style={[styles.logMealButton, { backgroundColor: c.accent }]}
              onPress={() => setShowMealCategoryModal(true)}
              disabled={logging}
            >
              <Text style={styles.logMealButtonText}>
                {logging ? 'Logging...' : 'Add to Meal Log'}
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
        onRequestClose={() => setShowMealCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: c.bg }]}>
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
  macrosGrid: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(0,0,0,0.03)', 
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
  },
  macroLabel: { 
    fontSize: 10, 
    textTransform: 'uppercase', 
    fontWeight: '600',
  },
  li: { fontSize: 14, lineHeight: 22, marginBottom: 4 },
  step: { fontSize: 15, lineHeight: 24, marginBottom: 8 },
  logButtonContainer: { 
    paddingHorizontal: 16, 
    paddingVertical: 20,
  },
  logMealButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logMealButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
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
    accent: dark ? '#1DB954' : '#1DB954',
  };
}
