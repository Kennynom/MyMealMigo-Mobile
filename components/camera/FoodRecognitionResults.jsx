import { AuthContext } from '@/context/AuthContext';
import { ThemeContext } from '@/context/ThemeContext';
import { logMealToFirebase, updateCalorieTracking, updateMealAndCalories } from '@/utils/mealService';
import { router } from 'expo-router';
import React, { useContext } from 'react';
import {
    Alert,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

export default function FoodRecognitionResults({ 
  photoUri, 
  foodData, 
  confidence,
  onRetakePhoto, 
  onAddMeal,
  editMode = false,
  mealId = null,
  existingMealData = null
}) {
  const { theme } = useContext(ThemeContext);
  const { user } = useContext(AuthContext);
  const [isLogging, setIsLogging] = React.useState(false);
  const [showMealCategoryModal, setShowMealCategoryModal] = React.useState(false);
  const [selectedMealCategory, setSelectedMealCategory] = React.useState(null);
  const [selectedMealType, setSelectedMealType] = React.useState(null);
  
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

  const handleAddToMealClick = () => {
    setShowMealCategoryModal(true);
  };

  const handleMealCategorySelect = async (category, type) => {
    setSelectedMealCategory(category);
    setSelectedMealType(type);
    setShowMealCategoryModal(false);
    
    // Proceed with logging or updating
    await handleAddToMeal(category, type);
  };

  const handleAddToMeal = async (mealCategory, mealType) => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to log meals');
      return;
    }

    setIsLogging(true);
    
    try {
      const mealEntry = {
        foodName: foodData.name,
        calories: foodData.calories,
        protein: foodData.protein,
        carbs: foodData.carbs,
        fat: foodData.fats,
        sodium: foodData.sodium,
        sugar: foodData.sugar,
        servingSize: foodData.servingSize,
        servingUnit: foodData.servingUnit,
        entryMethod: 'photo',
        timestamp: new Date(),
        userId: user.uid,
        photoUri: photoUri,
        confidence: confidence,
        mealCategory: mealCategory,  // Breakfast/Lunch/Dinner
        mealType: mealType            // Meal/Beverage
      };

      if (editMode && mealId && existingMealData) {
        // UPDATE MODE: Update existing meal
        await updateMealAndCalories(user.uid, mealId, existingMealData, mealEntry);
        
        Alert.alert(
          'Success!', 
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
        await updateCalorieTracking(user.uid, mealEntry);
        
        Alert.alert(
          'Success!', 
          `Meal logged to ${mealCategory} successfully!`,
          [
            {
              text: 'Take Another Photo',
              onPress: () => {
                onRetakePhoto?.();
              }
            },
            {
              text: 'View Logs',
              onPress: () => router.push('/(tabs)/(logs)')
            }
          ]
        );
      }
      
      onAddMeal?.(mealEntry);
    } catch (error) {
      console.error('Error logging meal:', error);
      Alert.alert('Error', 'Failed to save meal. Please try again.');
    } finally {
      setIsLogging(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={onRetakePhoto}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Food Recognition</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Photo Display */}
        <View style={styles.resultsCard}>
        <Image source={{ uri: photoUri }} style={styles.photoImg} resizeMode="contain" />
        <View style={styles.photoFrame}>
          <Text style={styles.confidenceText}>
            Confidence: {Math.round(confidence * 100)}%
          </Text>
        </View>
      </View>

      {/* Food Information */}
      <View style={styles.foodInfoContainer}>
        <Text style={styles.sectionTitle}>Food Detected</Text>
        <Text style={styles.foodName}>{foodData.name}</Text>
      </View>

      {/* Macros Breakdown */}
      <View style={styles.macrosContainer}>
        <Text style={styles.sectionTitle}>Macros Breakdown</Text>
        
        <View style={styles.macroGrid}>
          <View style={styles.macroItem}>
            <Text style={styles.macroLabel}>Calories</Text>
            <Text style={styles.macroValue}>{foodData.calories} Kcal</Text>
          </View>
          
          <View style={styles.macroItem}>
            <Text style={styles.macroLabel}>Carbs</Text>
            <Text style={styles.macroValue}>{foodData.carbs} g</Text>
          </View>
          
          <View style={styles.macroItem}>
            <Text style={styles.macroLabel}>Protein</Text>
            <Text style={styles.macroValue}>{foodData.protein} g</Text>
          </View>
          
          <View style={styles.macroItem}>
            <Text style={styles.macroLabel}>Fats</Text>
            <Text style={styles.macroValue}>{foodData.fats} g</Text>
          </View>
          
          <View style={styles.macroItem}>
            <Text style={styles.macroLabel}>Sugar</Text>
            <Text style={styles.macroValue}>{foodData.sugar} g</Text>
          </View>
          
          <View style={styles.macroItem}>
            <Text style={styles.macroLabel}>Sodium</Text>
            <Text style={styles.macroValue}>{foodData.sodium} mg</Text>
          </View>
        </View>

        {/* Serving Size Info */}
        <View style={styles.servingContainer}>
          <Text style={styles.servingText}>
            Per {foodData.servingSize} {foodData.servingUnit}
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.addButton, isLogging && styles.addButtonDisabled]}
          onPress={handleAddToMealClick}
          disabled={isLogging}
        >
          <Text style={styles.addButtonText}>
            {isLogging 
              ? (editMode ? 'Updating Meal...' : 'Adding to Meal...') 
              : (editMode ? 'Update Meal' : 'Add to Meal')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.retakeButton}
          onPress={onRetakePhoto}
          disabled={isLogging}
        >
          <Text style={styles.retakeButtonText}>Take Another Photo</Text>
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
    </ScrollView>
  );
}

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    fontSize: 24,
    color: theme.text,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.text,
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  photoContainer: {
    margin: 20,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: theme.cardBackground,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  photoImage: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  confidenceContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  confidenceText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  foodInfoContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 12,
  },
  foodName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#059669',
    textAlign: 'center',
  },
  macrosContainer: {
    marginHorizontal: 20,
    marginBottom: 30,
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  macroGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  macroItem: {
    width: '48%',
    marginBottom: 16,
    padding: 12,
    backgroundColor: theme.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  macroLabel: {
    fontSize: 14,
    color: theme.textSecondary,
    fontWeight: '500',
    marginBottom: 4,
  },
  macroValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.text,
  },
  servingContainer: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  servingText: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12,
  },
  addButton: {
    backgroundColor: '#059669',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  addButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  retakeButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  retakeButtonText: {
    color: theme.text,
    fontSize: 16,
    fontWeight: '500',
  },
  resultsCard: {
    marginHorizontal: 20,
    marginVertical: 16,
    borderRadius: 12,
    backgroundColor: theme.cardBackground,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  photoImg: {
    width: '100%',
    height: 300,
    resizeMode: 'contain',
    backgroundColor: '#f0f0f0',
  },
  photoFrame: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
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