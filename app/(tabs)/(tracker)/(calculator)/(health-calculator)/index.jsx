// app/(tabs)/(tracker)/(calculator)/(health-calculator)/index.jsx
import { ThemeContext } from '@/context/ThemeContext';
import { router } from 'expo-router';
import { useContext, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function HealthCalculatorScreen() {
  const { theme } = useContext(ThemeContext);
  const [activeTab, setActiveTab] = useState('BMI'); // BMI | BMR | Deficit
  
  // BMI State
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [bmi, setBMI] = useState(null);
  const [category, setCategory] = useState('');

  // BMR State
  const [bmrAge, setBmrAge] = useState('');
  const [bmrHeight, setBmrHeight] = useState('');
  const [bmrWeight, setBmrWeight] = useState('');
  const [bmrSex, setBmrSex] = useState('male');
  const [bmrActivity, setBmrActivity] = useState('sedentary');
  const [bmr, setBMR] = useState(null);
  const [tdee, setTDEE] = useState(null);

  // Deficit/Surplus State
  const [currentCalories, setCurrentCalories] = useState('');
  const [goalWeight, setGoalWeight] = useState('');
  const [timeframe, setTimeframe] = useState('');
  const [recommendation, setRecommendation] = useState(null);

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

  const calculateBMR = () => {
    const ageNum = parseFloat(bmrAge);
    const heightNum = parseFloat(bmrHeight);
    const weightNum = parseFloat(bmrWeight);

    if (ageNum > 0 && heightNum > 0 && weightNum > 0) {
      // Mifflin-St Jeor Equation
      let bmrValue;
      if (bmrSex === 'male') {
        bmrValue = (10 * weightNum) + (6.25 * heightNum) - (5 * ageNum) + 5;
      } else {
        bmrValue = (10 * weightNum) + (6.25 * heightNum) - (5 * ageNum) - 161;
      }
      
      setBMR(Math.round(bmrValue));
      
      // Calculate TDEE based on activity level
      const activityMultipliers = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
        veryActive: 1.9
      };
      
      const tdeeValue = bmrValue * activityMultipliers[bmrActivity];
      setTDEE(Math.round(tdeeValue));
    } else {
      Alert.alert('Error', 'Please enter valid age, height, and weight');
    }
  };

  const calculateDeficitSurplus = () => {
    const currentCal = parseFloat(currentCalories);
    const goalWeightNum = parseFloat(goalWeight);
    const currentWeightNum = parseFloat(weight);
    const weeks = parseFloat(timeframe);

    if (currentCal > 0 && goalWeightNum > 0 && currentWeightNum > 0 && weeks > 0) {
      const weightDiff = goalWeightNum - currentWeightNum;
      const totalCalorieChange = weightDiff * 7700; // 7700 cal per kg
      const dailyChange = totalCalorieChange / (weeks * 7);
      const targetCalories = Math.round(currentCal + dailyChange);
      
      setRecommendation({
        weightDiff,
        dailyChange: Math.round(dailyChange),
        targetCalories,
        type: weightDiff > 0 ? 'surplus' : 'deficit'
      });
    } else {
      Alert.alert('Error', 'Please enter all valid values');
    }
  };

  const resetAll = () => {
    // Reset BMI
    setHeight('');
    setWeight('');
    setBMI(null);
    setCategory('');
    // Reset BMR
    setBmrAge('');
    setBmrHeight('');
    setBmrWeight('');
    setBMR(null);
    setTDEE(null);
    // Reset Deficit/Surplus
    setCurrentCalories('');
    setGoalWeight('');
    setTimeframe('');
    setRecommendation(null);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Health Calculator</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Top Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'BMI' && styles.activeTab]} 
          onPress={() => setActiveTab('BMI')}
        >
          <Text style={[styles.tabText, activeTab === 'BMI' && styles.activeTabText]}>BMI</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'BMR' && styles.activeTab]} 
          onPress={() => setActiveTab('BMR')}
        >
          <Text style={[styles.tabText, activeTab === 'BMR' && styles.activeTabText]}>BMR</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'Deficit' && styles.activeTab]} 
          onPress={() => setActiveTab('Deficit')}
        >
          <Text style={[styles.tabText, activeTab === 'Deficit' && styles.activeTabText]}>Calorie Goal</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* BMI Calculator */}
        {activeTab === 'BMI' && (
          <>
            <Text style={styles.title}>Body Mass Index Calculator</Text>
            <Text style={styles.subtitle}>Calculate your BMI to assess your weight category</Text>
            
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

            <TouchableOpacity style={styles.calculateButton} onPress={calculateBMI}>
              <Text style={styles.calculateButtonText}>Calculate BMI</Text>
            </TouchableOpacity>

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
          </>
        )}

        {/* BMR Calculator */}
        {activeTab === 'BMR' && (
          <>
            <Text style={styles.title}>Basal Metabolic Rate Calculator</Text>
            <Text style={styles.subtitle}>Calculate your daily calorie needs</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Age (years)</Text>
              <TextInput
                style={styles.input}
                value={bmrAge}
                onChangeText={setBmrAge}
                placeholder="Enter age"
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Height (cm)</Text>
              <TextInput
                style={styles.input}
                value={bmrHeight}
                onChangeText={setBmrHeight}
                placeholder="Enter height in cm"
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Weight (kg)</Text>
              <TextInput
                style={styles.input}
                value={bmrWeight}
                onChangeText={setBmrWeight}
                placeholder="Enter weight in kg"
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Sex</Text>
              <View style={styles.radioGroup}>
                <TouchableOpacity 
                  style={[styles.radioButton, bmrSex === 'male' && styles.radioButtonActive]}
                  onPress={() => setBmrSex('male')}
                >
                  <Text style={[styles.radioText, bmrSex === 'male' && styles.radioTextActive]}>Male</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.radioButton, bmrSex === 'female' && styles.radioButtonActive]}
                  onPress={() => setBmrSex('female')}
                >
                  <Text style={[styles.radioText, bmrSex === 'female' && styles.radioTextActive]}>Female</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Activity Level</Text>
              <View style={styles.pickerContainer}>
                <TouchableOpacity 
                  style={[styles.activityButton, bmrActivity === 'sedentary' && styles.activityButtonActive]}
                  onPress={() => setBmrActivity('sedentary')}
                >
                  <Text style={styles.activityButtonText}>Sedentary</Text>
                  <Text style={styles.activitySubtext}>Little/no exercise</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.activityButton, bmrActivity === 'light' && styles.activityButtonActive]}
                  onPress={() => setBmrActivity('light')}
                >
                  <Text style={styles.activityButtonText}>Light</Text>
                  <Text style={styles.activitySubtext}>1-3 days/week</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.activityButton, bmrActivity === 'moderate' && styles.activityButtonActive]}
                  onPress={() => setBmrActivity('moderate')}
                >
                  <Text style={styles.activityButtonText}>Moderate</Text>
                  <Text style={styles.activitySubtext}>3-5 days/week</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.activityButton, bmrActivity === 'active' && styles.activityButtonActive]}
                  onPress={() => setBmrActivity('active')}
                >
                  <Text style={styles.activityButtonText}>Active</Text>
                  <Text style={styles.activitySubtext}>6-7 days/week</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.activityButton, bmrActivity === 'veryActive' && styles.activityButtonActive]}
                  onPress={() => setBmrActivity('veryActive')}
                >
                  <Text style={styles.activityButtonText}>Very Active</Text>
                  <Text style={styles.activitySubtext}>Twice per day</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.calculateButton} onPress={calculateBMR}>
              <Text style={styles.calculateButtonText}>Calculate BMR</Text>
            </TouchableOpacity>

            {bmr && (
              <View style={styles.resultContainer}>
                <Text style={styles.resultTitle}>Your Results</Text>
                <View style={styles.bmrResults}>
                  <View style={styles.bmrResultItem}>
                    <Text style={styles.bmrLabel}>BMR</Text>
                    <Text style={styles.bmrValue}>{bmr}</Text>
                    <Text style={styles.bmrUnit}>cal/day</Text>
                  </View>
                  <View style={styles.bmrResultItem}>
                    <Text style={styles.bmrLabel}>TDEE</Text>
                    <Text style={styles.bmrValue}>{tdee}</Text>
                    <Text style={styles.bmrUnit}>cal/day</Text>
                  </View>
                </View>
                <Text style={styles.bmrExplanation}>
                  BMR: Calories burned at rest. TDEE: Total daily energy expenditure including activity.
                </Text>
              </View>
            )}
          </>
        )}

        {/* Deficit/Surplus Calculator */}
        {activeTab === 'Deficit' && (
          <>
            <Text style={styles.title}>Calorie Goal Calculator</Text>
            <Text style={styles.subtitle}>Plan your calorie intake to reach your goal weight</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Current Daily Calories</Text>
              <TextInput
                style={styles.input}
                value={currentCalories}
                onChangeText={setCurrentCalories}
                placeholder="Enter current daily calories"
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Current Weight (kg)</Text>
              <TextInput
                style={styles.input}
                value={weight}
                onChangeText={setWeight}
                placeholder="Enter current weight"
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Goal Weight (kg)</Text>
              <TextInput
                style={styles.input}
                value={goalWeight}
                onChangeText={setGoalWeight}
                placeholder="Enter goal weight"
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Timeframe (weeks)</Text>
              <TextInput
                style={styles.input}
                value={timeframe}
                onChangeText={setTimeframe}
                placeholder="Enter timeframe in weeks"
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
              />
            </View>

            <TouchableOpacity style={styles.calculateButton} onPress={calculateDeficitSurplus}>
              <Text style={styles.calculateButtonText}>Calculate Goal</Text>
            </TouchableOpacity>

            {recommendation && (
              <View style={styles.resultContainer}>
                <Text style={styles.resultTitle}>Your Calorie Plan</Text>
                <Text style={styles.goalType}>
                  {recommendation.type === 'surplus' ? 'Weight Gain Plan' : 'Weight Loss Plan'}
                </Text>
                <Text style={styles.weightChange}>
                  {recommendation.weightDiff > 0 ? '+' : ''}{recommendation.weightDiff.toFixed(1)} kg
                </Text>
                
                <View style={styles.goalDetails}>
                  <View style={styles.goalDetailItem}>
                    <Text style={styles.goalDetailLabel}>Daily Calorie Change</Text>
                    <Text style={styles.goalDetailValue}>
                      {recommendation.dailyChange > 0 ? '+' : ''}{recommendation.dailyChange} cal
                    </Text>
                  </View>
                  <View style={styles.goalDetailItem}>
                    <Text style={styles.goalDetailLabel}>Target Daily Calories</Text>
                    <Text style={styles.goalDetailValue}>{recommendation.targetCalories} cal</Text>
                  </View>
                </View>
                
                <Text style={styles.goalWarning}>
                  ⚠️ Aim for gradual changes (0.5-1kg/week). Consult a healthcare professional for personalized advice.
                </Text>
              </View>
            )}
          </>
        )}

        <TouchableOpacity style={styles.resetButton} onPress={resetAll}>
          <Text style={styles.resetButtonText}>Reset All</Text>
        </TouchableOpacity>
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
    width: 50,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.inactive,
    margin: 20,
    marginBottom: 10,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: theme.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  activeTabText: {
    color: '#fff',
  },
  content: {
    padding: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
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
  radioGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  radioButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
  },
  radioButtonActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  radioText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
  },
  radioTextActive: {
    color: '#fff',
  },
  pickerContainer: {
    gap: 8,
  },
  activityButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  activityButtonActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  activityButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
  },
  activitySubtext: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 2,
  },
  calculateButton: {
    backgroundColor: theme.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  calculateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resetButton: {
    backgroundColor: theme.surface,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
    marginTop: 20,
    marginBottom: 40,
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
    marginTop: 10,
    borderWidth: 1,
    borderColor: theme.border,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 15,
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
  bmrResults: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 15,
  },
  bmrResultItem: {
    alignItems: 'center',
    flex: 1,
  },
  bmrLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textSecondary,
    marginBottom: 5,
  },
  bmrValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.primary,
  },
  bmrUnit: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 2,
  },
  bmrExplanation: {
    fontSize: 12,
    color: theme.textSecondary,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 18,
  },
  goalType: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 5,
  },
  weightChange: {
    fontSize: 36,
    fontWeight: 'bold',
    color: theme.primary,
    marginBottom: 20,
  },
  goalDetails: {
    width: '100%',
    gap: 15,
    marginBottom: 15,
  },
  goalDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: theme.inactive,
    borderRadius: 8,
  },
  goalDetailLabel: {
    fontSize: 14,
    color: theme.text,
    fontWeight: '500',
  },
  goalDetailValue: {
    fontSize: 16,
    color: theme.primary,
    fontWeight: 'bold',
  },
  goalWarning: {
    fontSize: 12,
    color: theme.textSecondary,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 18,
  },
});