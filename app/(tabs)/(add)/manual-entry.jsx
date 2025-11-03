import { AuthContext } from '@/context/AuthContext';
import { ThemeContext } from '@/context/ThemeContext';
import { logMealToFirebase, updateCalorieTracking, updateMealAndCalories } from '@/utils/mealService';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function ManualEntryScreen() {
  const { theme } = useContext(ThemeContext);
  const { user } = useContext(AuthContext);
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [showMealCategoryModal, setShowMealCategoryModal] = useState(false);
  
  // Check if we're in edit mode
  const editMode = params.editMode === 'true';
  const mealId = params.mealId;
  
  // Stabilize the parsed object to prevent infinite re-renders
  const existingMealData = useMemo(() => 
    params.mealData ? JSON.parse(params.mealData) : null,
    [params.mealData]
  );
  
  const [mealData, setMealData] = useState({
    foodName: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    servingSize: '1',
    servingUnit: 'serving',
  });

  // Populate form with existing data if in edit mode
  useEffect(() => {
    if (editMode && existingMealData) {
      setMealData({
        foodName: existingMealData.foodName || '',
        calories: String(existingMealData.calories || ''),
        protein: String(existingMealData.protein || ''),
        carbs: String(existingMealData.carbs || ''),
        fat: String(existingMealData.fat || ''),
        servingSize: String(existingMealData.servingSize || '1'),
        servingUnit: existingMealData.servingUnit || 'serving',
      });
    }
  }, [editMode, existingMealData]);

  const styles = createStyles(theme);

  const mealCategories = [
    { id: 'breakfast', label: 'Breakfast', icon: '🌅' },
    { id: 'lunch', label: 'Lunch', icon: '🌞' },
    { id: 'dinner', label: 'Dinner', icon: '🌙' }
  ];

  const mealTypes = [
    { id: 'meal', label: 'Meal' },
    { id: 'beverage', label: 'Beverage' }
  ];

  const handleInputChange = (field, value) => {
    setMealData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!mealData.foodName.trim()) {
      Alert.alert('Error', 'Please enter a food name');
      return false;
    }
    
    if (!mealData.calories || isNaN(mealData.calories) || parseFloat(mealData.calories) < 0) {
      Alert.alert('Error', 'Please enter valid calories');
      return false;
    }

    // Protein, carbs, and fat are optional but should be valid numbers if provided
    const numericFields = ['protein', 'carbs', 'fat'];
    for (const field of numericFields) {
      if (mealData[field] && (isNaN(mealData[field]) || parseFloat(mealData[field]) < 0)) {
        Alert.alert('Error', `Please enter a valid ${field} value`);
        return false;
      }
    }

    return true;
  };

  const handleLogMealClick = () => {
    if (!validateForm()) return;
    setShowMealCategoryModal(true);
  };

  const handleMealCategorySelect = async (category, type) => {
    setShowMealCategoryModal(false);
    
    // Proceed with logging
    await handleLogMeal(category, type);
  };

  const handleLogMeal = async (mealCategory, mealType) => {
    if (!validateForm()) return;

    if (!user) {
      Alert.alert('Error', 'You must be logged in to log meals');
      return;
    }

    // Debug logging
    console.log('User object:', user);
    console.log('User UID:', user.uid);
    console.log('User email:', user.email);

    setLoading(true);
    
    try {
      const mealEntry = {
        foodName: mealData.foodName.trim(),
        calories: parseFloat(mealData.calories),
        protein: parseFloat(mealData.protein) || 0,
        carbs: parseFloat(mealData.carbs) || 0,
        fat: parseFloat(mealData.fat) || 0,
        servingSize: parseFloat(mealData.servingSize) || 1,
        servingUnit: mealData.servingUnit,
        entryMethod: 'manual',
        timestamp: new Date(),
        userId: user.uid,
        mealCategory: mealCategory,  // Breakfast/Lunch/Dinner
        mealType: mealType            // Meal/Beverage
      };

      if (editMode && mealId && existingMealData) {
        // UPDATE MODE: Update existing meal
        await updateMealAndCalories(user.uid, mealId, existingMealData, mealEntry);
        
        Alert.alert(
          'Success', 
          `Meal updated successfully!`,
          [
            {
              text: 'View Logs',
              onPress: () => router.push('/(tabs)/(logs)')
            }
          ]
        );
      } else {
        // CREATE MODE: Log new meal
        await logMealToFirebase(mealEntry);
        
        // Update calorie tracking
        await updateCalorieTracking(user.uid, mealEntry);
        
        Alert.alert(
          'Success', 
          `Meal logged to ${mealCategory} successfully!`,
          [
            {
              text: 'Add Another',
              onPress: () => {
                // Reset form
                setMealData({
                  foodName: '',
                  calories: '',
                  protein: '',
                  carbs: '',
                  fat: '',
                  servingSize: '1',
                  servingUnit: 'serving',
                });
              }
            },
            {
              text: 'View Logs',
              onPress: () => router.push('/(tabs)/(logs)')
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error logging meal:', error);
      Alert.alert('Error', 'Failed to save meal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{editMode ? 'Edit Meal' : 'Manual Entry'}</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.subtitle}>Enter your meal details</Text>
          
      

          {/* Food Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Food Name *</Text>
            <TextInput
              style={styles.input}
              value={mealData.foodName}
              onChangeText={(text) => handleInputChange('foodName', text)}
              placeholder="e.g., Grilled Chicken Breast"
              placeholderTextColor={theme.textSecondary}
            />
          </View>

          {/* Serving Size */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Serving Size</Text>
              <TextInput
                style={styles.input}
                value={mealData.servingSize}
                onChangeText={(text) => handleInputChange('servingSize', text)}
                placeholder="1"
                keyboardType="numeric"
                placeholderTextColor={theme.textSecondary}
              />
            </View>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Unit</Text>
              <View style={styles.unitDisplay}>
                <Text style={styles.unitText}>{mealData.servingUnit}</Text>
              </View>
            </View>
          </View>

          {/* Calories */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Calories</Text>
            <TextInput
              style={styles.input}
              value={mealData.calories}
              onChangeText={(text) => handleInputChange('calories', text)}
              keyboardType="numeric"
              placeholderTextColor={theme.textSecondary}
            />
          </View>

          {/* Macronutrients */}
          <Text style={styles.sectionTitle}>Macronutrients (Optional)</Text>
          
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.thirdWidth]}>
              <Text style={styles.label}>Protein (g)</Text>
              <TextInput
                style={styles.input}
                value={mealData.protein}
                onChangeText={(text) => handleInputChange('protein', text)}
                placeholder="0"
                keyboardType="numeric"
                placeholderTextColor={theme.textSecondary}
              />
            </View>
            <View style={[styles.inputGroup, styles.thirdWidth]}>
              <Text style={styles.label}>Carbs (g)</Text>
              <TextInput
                style={styles.input}
                value={mealData.carbs}
                onChangeText={(text) => handleInputChange('carbs', text)}
                placeholder="0"
                keyboardType="numeric"
                placeholderTextColor={theme.textSecondary}
              />
            </View>
            <View style={[styles.inputGroup, styles.thirdWidth]}>
              <Text style={styles.label}>Fat (g)</Text>
              <TextInput
                style={styles.input}
                value={mealData.fat}
                onChangeText={(text) => handleInputChange('fat', text)}
                placeholder="0"
                keyboardType="numeric"
                placeholderTextColor={theme.textSecondary}
              />
            </View>
          </View>

          {/* Summary */}
          {mealData.calories && (
            <View style={styles.summary}>
              <Text style={styles.summaryTitle}>Nutritional Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Calories:</Text>
                <Text style={styles.summaryValue}>{mealData.calories}</Text>
              </View>
              {mealData.protein && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Protein:</Text>
                  <Text style={styles.summaryValue}>{mealData.protein}g</Text>
                </View>
              )}
              {mealData.carbs && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Carbs:</Text>
                  <Text style={styles.summaryValue}>{mealData.carbs}g</Text>
                </View>
              )}
              {mealData.fat && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Fat:</Text>
                  <Text style={styles.summaryValue}>{mealData.fat}g</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Log Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.logButton, loading && styles.logButtonDisabled]} 
          onPress={handleLogMealClick}
          disabled={loading}
        >
          <Text style={styles.logButtonText}>
            {loading 
              ? (editMode ? 'Updating Meal...' : 'Logging Meal...') 
              : (editMode ? 'Update Meal' : 'Log Meal')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Meal Category Selection Modal */}
      <Modal
        visible={showMealCategoryModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMealCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Meal Category</Text>
              <TouchableOpacity 
                onPress={() => setShowMealCategoryModal(false)}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
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
    </KeyboardAvoidingView>
  );
}

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 20,
    color: theme.text,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.text,
  },
  placeholder: {
    width: 40,
  },
  form: {
    padding: 20,
    paddingTop: 0,
  },
  subtitle: {
    fontSize: 16,
    color: theme.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: theme.text,
    backgroundColor: theme.cardBackground,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  thirdWidth: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 16,
    marginTop: 8,
  },
  summary: {
    backgroundColor: theme.cardBackground,
    borderRadius: 8,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: theme.border,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.text,
  },
  footer: {
    padding: 20,
    paddingBottom: 34,
  },
  logButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  logButtonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  logButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  testButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  testButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  unitDisplay: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    padding: 12,
    backgroundColor: theme.surface || theme.cardBackground,
    justifyContent: 'center',
  },
  unitText: {
    fontSize: 16,
    color: theme.textSecondary,
    fontStyle: 'italic',
  },
  // Modal Styles
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
  },
  modalCloseText: {
    fontSize: 24,
    color: theme.textSecondary,
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
    color: theme.text,
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