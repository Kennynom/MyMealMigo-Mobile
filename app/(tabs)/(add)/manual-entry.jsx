import { AuthContext } from '@/context/AuthContext';
import { ThemeContext } from '@/context/ThemeContext';
import { logMealToFirebase, updateCalorieTracking } from '@/utils/mealService';
import { router } from 'expo-router';
import React, { useContext, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
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
  const [loading, setLoading] = useState(false);
  
  const [mealData, setMealData] = useState({
    foodName: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    servingSize: '1',
    servingUnit: 'serving',
  });

  const styles = createStyles(theme);

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

  const handleLogMeal = async () => {
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
      };

      await logMealToFirebase(mealEntry);
      
      // Update calorie tracking
      await updateCalorieTracking(user.uid, mealEntry);
      
      Alert.alert(
        'Success', 
        'Meal logged and calories updated successfully!',
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
    } catch (error) {
      console.error('Error logging meal:', error);
      Alert.alert('Error', 'Failed to log meal. Please try again.');
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
          <Text style={styles.title}>Manual Entry</Text>
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
          onPress={handleLogMeal}
          disabled={loading}
        >
          <Text style={styles.logButtonText}>
            {loading ? 'Logging Meal...' : 'Log Meal'}
          </Text>
        </TouchableOpacity>
      </View>
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
});