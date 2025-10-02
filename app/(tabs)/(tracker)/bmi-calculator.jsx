// Create: app/(tabs)/(tracker)/bmi-calculator.jsx
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useState, useContext } from 'react';
import { ThemeContext } from '@/context/ThemeContext';
import { router } from 'expo-router';

export default function BMICalculatorScreen() {
  const { theme } = useContext(ThemeContext);
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [bmi, setBMI] = useState(null);
  const [category, setCategory] = useState('');

  const styles = createStyles(theme);

  const calculateBMI = () => {
    const heightM = parseFloat(height) / 100; // Convert cm to m
    const weightKg = parseFloat(weight);

    if (heightM > 0 && weightKg > 0) {
      const bmiValue = weightKg / (heightM * heightM);
      setBMI(bmiValue.toFixed(1));
      
      // Determine category
      if (bmiValue < 18.5) setCategory('Underweight');
      else if (bmiValue < 25) setCategory('Normal Weight');
      else if (bmiValue < 30) setCategory('Overweight');
      else setCategory('Obese');
    } else {
      Alert.alert('Error', 'Please enter valid height and weight');
    }
  };

  const resetCalculator = () => {
    setHeight('');
    setWeight('');
    setBMI(null);
    setCategory('');
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>BMI Calculator</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Calculate Your Body Mass Index</Text>
        <Text style={styles.subtitle}>Enter your height and weight to calculate your BMI</Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Height (cm)</Text>
          <TextInput
            style={styles.input}
            value={height}
            onChangeText={setHeight}
            placeholder="Enter height in cm"
            placeholderTextColor={theme.textSecondary}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Weight (kg)</Text>
          <TextInput
            style={styles.input}
            value={weight}
            onChangeText={setWeight}
            placeholder="Enter weight in kg"
            placeholderTextColor={theme.textSecondary}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.calculateButton} onPress={calculateBMI}>
            <Text style={styles.calculateButtonText}>Calculate BMI</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.resetButton} onPress={resetCalculator}>
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>
        </View>

        {bmi && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultTitle}>Your BMI Result</Text>
            <Text style={styles.bmiValue}>{bmi}</Text>
            <Text style={styles.category}>{category}</Text>
            
            <View style={styles.categoryGuide}>
              <Text style={styles.guideTitle}>BMI Categories:</Text>
              <Text style={styles.guideText}>• Underweight: Below 18.5</Text>
              <Text style={styles.guideText}>• Normal Weight: 18.5 - 24.9</Text>
              <Text style={styles.guideText}>• Overweight: 25 - 29.9</Text>
              <Text style={styles.guideText}>• Obese: 30 and above</Text>
            </View>
          </View>
        )}
      </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  backButton: {
    padding: 5,
  },
  backText: {
    color: theme.text,
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
  },
  placeholder: {
    width: 50, // Balance the header
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.surface,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: theme.text,
    borderWidth: 1,
    borderColor: theme.border,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 20,
  },
  calculateButton: {
    flex: 1,
    backgroundColor: theme.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  calculateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resetButton: {
    flex: 1,
    backgroundColor: theme.surface,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  resetButtonText: {
    color: theme.text,
    fontSize: 16,
    fontWeight: '500',
  },
  resultContainer: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: theme.border,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 10,
  },
  bmiValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: theme.primary,
    marginBottom: 5,
  },
  category: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 20,
  },
  categoryGuide: {
    width: '100%',
    backgroundColor: theme.inactive,
    borderRadius: 8,
    padding: 12,
  },
  guideTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 8,
  },
  guideText: {
    fontSize: 12,
    color: theme.textSecondary,
    marginBottom: 2,
  },
});