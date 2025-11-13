// app/(tabs)/(tracker)/(health-calculator)/index.jsx
import { db } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';
import { ThemeContext } from '@/context/ThemeContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useContext, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function HealthCalculatorScreen() {
  const { theme } = useContext(ThemeContext);
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('BMI'); // BMI | BMR | Deficit
  const [loading, setLoading] = useState(false);
  
  // BMI State
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [sex, setSex] = useState('');
  const [bmi, setBMI] = useState(null);
  const [category, setCategory] = useState('');
  
  // Track original BMI values
  const [originalBMIHeight, setOriginalBMIHeight] = useState('');
  const [originalBMIWeight, setOriginalBMIWeight] = useState('');
  const [bmiValuesChanged, setBmiValuesChanged] = useState(false);

  // BMR State
  const [bmrAge, setBmrAge] = useState('');
  const [bmrHeight, setBmrHeight] = useState('');
  const [bmrWeight, setBmrWeight] = useState('');
  const [bmrSex, setBmrSex] = useState('male');
  const [bmrActivity, setBmrActivity] = useState('sedentary');
  const [bmr, setBMR] = useState(null);
  const [tdee, setTDEE] = useState(null);
  
  // Track original BMR values
  const [originalBMRAge, setOriginalBMRAge] = useState('');
  const [originalBMRHeight, setOriginalBMRHeight] = useState('');
  const [originalBMRWeight, setOriginalBMRWeight] = useState('');
  const [originalBMRActivity, setOriginalBMRActivity] = useState('sedentary');
  const [bmrValuesChanged, setBmrValuesChanged] = useState(false);

  // Deficit/Surplus State
  const [goalType, setGoalType] = useState('lose_0.5'); // lose_0.5, lose_1, maintain, gain_0.5, gain_1
  const [recommendation, setRecommendation] = useState(null);

  const styles = createStyles(theme);

  // Fetch user data from Firebase on mount
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userDocRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const profile = userData.profile || {};
          
          // Auto-populate height and weight
          if (profile.heightCm) {
            setHeight(profile.heightCm.toString());
            setOriginalBMIHeight(profile.heightCm.toString());
          }
          if (profile.weightKg) {
            setWeight(profile.weightKg.toString());
            setOriginalBMIWeight(profile.weightKg.toString());
          }
          if (profile.sex) setSex(profile.sex);
          
          // For BMR
          if (profile.heightCm) {
            setBmrHeight(profile.heightCm.toString());
            setOriginalBMRHeight(profile.heightCm.toString());
          }
          if (profile.weightKg) {
            setBmrWeight(profile.weightKg.toString());
            setOriginalBMRWeight(profile.weightKg.toString());
          }
          if (profile.sex) setBmrSex(profile.sex === 'female' ? 'female' : 'male');
          
          // Retrieve existing BMI data
          if (profile.currentBMI) {
            setBMI(profile.currentBMI.toFixed(1));
          }
          if (profile.bmiCategory) {
            setCategory(profile.bmiCategory);
          }
          
          // Retrieve existing BMR and TDEE data
          if (profile.BMR) {
            setBMR(profile.BMR);
          }
          if (profile.TDEE) {
            setTDEE(profile.TDEE);
          }
          
          // Get age from profile.age first, fallback to birthday calculation
          if (profile.age) {
            setBmrAge(profile.age.toString());
            setOriginalBMRAge(profile.age.toString());
          } else if (profile.birthday) {
            // Calculate age from birthday if age field not available
            const birthDate = new Date(profile.birthday);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
              age--;
            }
            if (age > 0) {
              setBmrAge(age.toString());
              setOriginalBMRAge(age.toString());
            }
          }
          
          // Set original BMR activity
          setOriginalBMRActivity(bmrActivity);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, [user]);

  // Check if BMI values have changed
  useEffect(() => {
    const heightChanged = height !== originalBMIHeight;
    const weightChanged = weight !== originalBMIWeight;
    setBmiValuesChanged(heightChanged || weightChanged);
  }, [height, weight, originalBMIHeight, originalBMIWeight]);

  // Check if BMR values have changed (excluding activity level)
  useEffect(() => {
    const ageChanged = bmrAge !== originalBMRAge;
    const heightChanged = bmrHeight !== originalBMRHeight;
    const weightChanged = bmrWeight !== originalBMRWeight;
    // Activity level change should not block saving - user can change activity and save
    setBmrValuesChanged(ageChanged || heightChanged || weightChanged);
  }, [bmrAge, bmrHeight, bmrWeight, originalBMRAge, originalBMRHeight, originalBMRWeight]);

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

  const saveBMIToFirebase = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to save BMI');
      return;
    }

    if (!bmi) {
      Alert.alert('Error', 'Please calculate BMI first');
      return;
    }

    try {
      setLoading(true);
      const userDocRef = doc(db, 'users', user.uid);
      
      await updateDoc(userDocRef, {
        'profile.currentBMI': parseFloat(bmi),
        'profile.bmiCategory': category,
      });

      Alert.alert('Success', 'BMI saved to your profile!');
      setOriginalBMIHeight(height);
      setOriginalBMIWeight(weight);
      setBmiValuesChanged(false);
    } catch (error) {
      console.error('Error saving BMI:', error);
      Alert.alert('Error', 'Failed to save BMI. Please try again.');
    } finally {
      setLoading(false);
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

  const saveBMRToFirebase = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to save BMR/TDEE');
      return;
    }

    if (!bmr || !tdee) {
      Alert.alert('Error', 'Please calculate BMR/TDEE first');
      return;
    }

    try {
      setLoading(true);
      const userDocRef = doc(db, 'users', user.uid);
      
      await updateDoc(userDocRef, {
        'profile.BMR': bmr,
        'profile.TDEE': tdee,
      });

      Alert.alert('Success', 'BMR and TDEE saved to your profile!');
      setOriginalBMRAge(bmrAge);
      setOriginalBMRHeight(bmrHeight);
      setOriginalBMRWeight(bmrWeight);
      setOriginalBMRActivity(bmrActivity);
      setBmrValuesChanged(false);
    } catch (error) {
      console.error('Error saving BMR/TDEE:', error);
      Alert.alert('Error', 'Failed to save BMR/TDEE. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateDeficitSurplus = () => {
    if (!tdee) {
      Alert.alert('BMR Required', 'Please calculate your BMR/TDEE first in the BMR tab.');
      return;
    }

    // Calculate target calories based on goal
    let targetCalories;
    let weeklyWeightChange;
    let dailyCalorieChange;
    
    switch(goalType) {
      case 'lose_1':
        dailyCalorieChange = -1100; // ~1 kg per week (7700 cal / 7 days)
        weeklyWeightChange = -1.0;
        targetCalories = Math.round(tdee + dailyCalorieChange);
        break;
      case 'lose_0.5':
        dailyCalorieChange = -550; // ~0.5 kg per week
        weeklyWeightChange = -0.5;
        targetCalories = Math.round(tdee + dailyCalorieChange);
        break;
      case 'maintain':
        dailyCalorieChange = 0;
        weeklyWeightChange = 0;
        targetCalories = Math.round(tdee);
        break;
      case 'gain_0.5':
        dailyCalorieChange = 550; // ~0.5 kg per week
        weeklyWeightChange = 0.5;
        targetCalories = Math.round(tdee + dailyCalorieChange);
        break;
      case 'gain_1':
        dailyCalorieChange = 1100; // ~1 kg per week
        weeklyWeightChange = 1.0;
        targetCalories = Math.round(tdee + dailyCalorieChange);
        break;
      default:
        targetCalories = Math.round(tdee);
        dailyCalorieChange = 0;
        weeklyWeightChange = 0;
    }
    
    // Safety check: minimum 1200 calories for women, 1500 for men
    const minCalories = bmrSex === 'female' ? 1200 : 1500;
    const isBelowMinimum = targetCalories < minCalories;
    
    setRecommendation({
      tdee: Math.round(tdee),
      targetCalories: isBelowMinimum ? minCalories : targetCalories,
      dailyCalorieChange,
      weeklyWeightChange,
      goalType,
      isBelowMinimum,
      minCalories
    });
  };

  const saveGoalToFirebase = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to save your goal');
      return;
    }

    if (!recommendation) {
      Alert.alert('Error', 'Please calculate your goal first');
      return;
    }

    try {
      setLoading(true);
      const healthProfileRef = doc(db, 'users', user.uid, 'private', 'health_profile');
      await updateDoc(healthProfileRef, {
        'Goal.items': {
          type: recommendation.goalType,
          targetCalories: recommendation.targetCalories,
          weeklyWeightChange: recommendation.weeklyWeightChange,
          updatedAt: new Date().toISOString()
        }
      });

      Alert.alert('Success', 'Goal saved to your profile!');
    } catch (error) {
      console.error('Error saving goal:', error);
      Alert.alert('Error', 'Failed to save goal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetBMI = () => {
    setHeight(originalBMIHeight);
    setWeight(originalBMIWeight);
    setBmiValuesChanged(false);
  };

  const resetBMR = () => {
    setBmrAge(originalBMRAge);
    setBmrHeight(originalBMRHeight);
    setBmrWeight(originalBMRWeight);
    setBmrActivity(originalBMRActivity);
    setBmrValuesChanged(false);
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
    setRecommendation(null);
  };

  return (
    <View style={styles.container}>
      {/* Fixed Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Health Calculator</Text>
          <Text style={styles.headerSubtitle}>Calculate your health metrics</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      {/* Fixed Top Tabs */}
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

      {/* Scrollable Content */}
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
        {/* BMI Calculator */}
        {activeTab === 'BMI' && (
          <>
            <Text style={styles.title}>Body Mass Index Calculator</Text>
            <Text style={styles.subtitle}>Calculate your BMI to assess your weight category</Text>
            
            {/* Display Existing BMI Data */}
            {(bmi || category) && (
              <View style={styles.existingDataContainer}>
              <MaterialIcons name="monitor-heart" size={24} color={theme.primaryDark} />
                <Text style={styles.existingDataTitle}>Your Current BMI</Text>
                <View style={styles.existingDataCard}>
                  {bmi && (
                    <View style={styles.existingDataItem}>
                      <Text style={styles.existingDataLabel}>BMI</Text>
                      <Text style={styles.existingDataValue}>{bmi}</Text>
                    </View>
                  )}
                  {category && (
                    <View style={styles.existingDataItem}>
                      <Text style={styles.existingDataLabel}>Category</Text>
                      <Text style={styles.existingDataValue}>{category}</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            <Text style={styles.sectionTitle}>Update Your BMI</Text>
            
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

            {sex && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Sex</Text>
                <View style={styles.readOnlyInput}>
                  <Text style={styles.readOnlyText}>{sex.charAt(0).toUpperCase() + sex.slice(1)}</Text>
                </View>
                <Text style={{ fontSize: 12, fontStyle: 'italic', color: theme.warning }}>
                    *You may only change this in your profile settings
                </Text>
              </View>
            )}

            <TouchableOpacity style={styles.calculateButton} onPress={calculateBMI}>
              <Text style={styles.calculateButtonText}>Calculate BMI</Text>
            </TouchableOpacity>

            {bmi && (
              <>
                <TouchableOpacity 
                  style={[styles.saveBMIButton, (loading || bmiValuesChanged) && styles.disabledButton]} 
                  onPress={saveBMIToFirebase}
                  disabled={loading || bmiValuesChanged}
                >
                  <Text style={styles.saveBMIButtonText}>
                    {loading ? 'Saving...' : 'Set BMI to Profile'}
                  </Text>
                </TouchableOpacity>
                
                {bmiValuesChanged && (
                  <Text style={styles.warningText}>
                    ⚠️ You've changed height or weight. Please recalculate BMI before saving to ensure accurate data.
                  </Text>
                )}
                
                <TouchableOpacity 
                  style={styles.resetSectionButton} 
                  onPress={resetBMI}
                >
                  <Text style={styles.resetSectionButtonText}>Reset BMI Values</Text>
                </TouchableOpacity>

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
              </>
            )}
          </>
        )}

        {/* BMR Calculator */}
        {activeTab === 'BMR' && (
          <>
            <Text style={styles.title}>Basal Metabolic Rate Calculator</Text>
            <Text style={styles.subtitle}>Calculate your daily calorie needs</Text>
            
            {/* Display Existing BMR/TDEE Data */}
            {(bmr || tdee) && (
              <View style={styles.existingDataContainer}>
              <MaterialIcons name="monitor-heart" size={24} color={theme.primaryDark} />
                <Text style={styles.existingDataTitle}>Your Current Metrics</Text>
                <View style={styles.existingDataCard}>
                  {bmr && (
                    <View style={styles.existingDataItem}>
                      <Text style={styles.existingDataLabel}>BMR</Text>
                      <Text style={styles.existingDataValue}>{bmr} cal/day</Text>
                    </View>
                  )}
                  {tdee && (
                    <View style={styles.existingDataItem}>
                      <Text style={styles.existingDataLabel}>TDEE</Text>
                      <Text style={styles.existingDataValue}>{tdee} cal/day</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            <Text style={styles.sectionTitle}>Update Your BMR/TDEE</Text>
            
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

            {bmrSex && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Sex</Text>
                <View style={styles.readOnlyInput}>
                  <Text style={styles.readOnlyText}>{bmrSex.charAt(0).toUpperCase() + bmrSex.slice(1)}</Text>
                </View>
                <Text style={{ fontSize: 12, fontStyle: 'italic', color: theme.warning }}>
                    *You may only change this in your profile settings
                </Text>
              </View>
            )}

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
              <>
                <TouchableOpacity 
                  style={[styles.saveBMIButton, (loading || bmrValuesChanged) && styles.disabledButton]} 
                  onPress={saveBMRToFirebase}
                  disabled={loading || bmrValuesChanged}
                >
                  <Text style={styles.saveBMIButtonText}>
                    {loading ? 'Saving...' : 'Set BMR/TDEE to Profile'}
                  </Text>
                </TouchableOpacity>
                
                {bmrValuesChanged && (
                  <Text style={styles.warningText}>
                    ⚠️ You've changed age, height, or weight. Please recalculate BMR before saving to ensure accurate data.
                  </Text>
                )}
                
                <TouchableOpacity 
                  style={styles.resetSectionButton} 
                  onPress={resetBMR}
                >
                  <Text style={styles.resetSectionButtonText}>Reset BMR Values</Text>
                </TouchableOpacity>

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
              </>
            )}
          </>
        )}

        {/* Deficit/Surplus Calculator */}
        {activeTab === 'Deficit' && (
          <>
            <Text style={styles.title}>Calorie Goal Calculator</Text>
            <Text style={styles.subtitle}>Set your weight goal based on your TDEE</Text>
            
            {/* TDEE Display */}
            <View style={styles.tdeeDisplay}>
               <MaterialIcons name="monitor-heart" size={24} color={theme.primaryDark} />
              <Text style={styles.tdeeLabel}>Your Current TDEE</Text>
              <Text style={styles.tdeeValue}>{tdee || 0}</Text>
              <Text style={styles.tdeeUnit}>cal/day</Text>
              {!tdee && (
                <Text style={styles.tdeeWarning}>
                  ⚠️ Calculate your BMR/TDEE first in the BMR tab
                </Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Select Your Goal</Text>
              <View style={styles.goalContainer}>
                <TouchableOpacity 
                  style={[styles.goalButton, goalType === 'lose_1' && styles.goalButtonActive]}
                  onPress={() => setGoalType('lose_1')}
                >
                  <Text style={[styles.goalButtonText, goalType === 'lose_1' && styles.goalButtonTextActive]}>Lose 1 kg/week</Text>
                  <Text style={[styles.goalButtonSubtext, goalType === 'lose_1' && styles.goalButtonSubtextActive]}>-1100 cal/day</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.goalButton, goalType === 'lose_0.5' && styles.goalButtonActive]}
                  onPress={() => setGoalType('lose_0.5')}
                >
                  <Text style={[styles.goalButtonText, goalType === 'lose_0.5' && styles.goalButtonTextActive]}>Lose 0.5 kg/week</Text>
                  <Text style={[styles.goalButtonSubtext, goalType === 'lose_0.5' && styles.goalButtonSubtextActive]}>-550 cal/day (Recommended)</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.goalButton, goalType === 'maintain' && styles.goalButtonActive]}
                  onPress={() => setGoalType('maintain')}
                >
                  <Text style={[styles.goalButtonText, goalType === 'maintain' && styles.goalButtonTextActive]}>Maintain Weight</Text>
                  <Text style={[styles.goalButtonSubtext, goalType === 'maintain' && styles.goalButtonSubtextActive]}>No change</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.goalButton, goalType === 'gain_0.5' && styles.goalButtonActive]}
                  onPress={() => setGoalType('gain_0.5')}
                >
                  <Text style={[styles.goalButtonText, goalType === 'gain_0.5' && styles.goalButtonTextActive]}>Gain 0.5 kg/week</Text>
                  <Text style={[styles.goalButtonSubtext, goalType === 'gain_0.5' && styles.goalButtonSubtextActive]}>+550 cal/day (Recommended)</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.goalButton, goalType === 'gain_1' && styles.goalButtonActive]}
                  onPress={() => setGoalType('gain_1')}
                >
                  <Text style={[styles.goalButtonText, goalType === 'gain_1' && styles.goalButtonTextActive]}>Gain 1 kg/week</Text>
                  <Text style={[styles.goalButtonSubtext, goalType === 'gain_1' && styles.goalButtonSubtextActive]}>+1100 cal/day</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.calculateButton, !tdee && styles.disabledButton]} 
              onPress={calculateDeficitSurplus}
              disabled={!tdee}
            >
              <Text style={styles.calculateButtonText}>Calculate Goal</Text>
            </TouchableOpacity>

            {recommendation && (
              <>
                <TouchableOpacity 
                  style={[styles.saveBMIButton, loading && styles.disabledButton]} 
                  onPress={saveGoalToFirebase}
                  disabled={loading}
                >
                  <Text style={styles.saveBMIButtonText}>
                    {loading ? 'Saving...' : 'Set Goal to Profile'}
                  </Text>
                </TouchableOpacity>

                <View style={styles.resultContainer}>
                <Text style={styles.resultTitle}>Your Calorie Plan</Text>
                
                <View style={styles.calorieRecommendation}>
                  <Text style={styles.recommendedLabel}>Recommended Daily Calories</Text>
                  <Text style={styles.recommendedValue}>{recommendation.targetCalories}</Text>
                  <Text style={styles.recommendedUnit}>cal/day</Text>
                </View>

                <View style={styles.goalSummary}>
                  <View style={styles.goalSummaryItem}>
                    <Text style={styles.goalSummaryLabel}>Your TDEE</Text>
                    <Text style={styles.goalSummaryValue}>{recommendation.tdee} cal</Text>
                  </View>
                  <View style={styles.goalSummaryItem}>
                    <Text style={styles.goalSummaryLabel}>Daily Change</Text>
                    <Text style={styles.goalSummaryValue}>
                      {recommendation.dailyCalorieChange > 0 ? '+' : ''}{recommendation.dailyCalorieChange} cal
                    </Text>
                  </View>
                  <View style={styles.goalSummaryItem}>
                    <Text style={styles.goalSummaryLabel}>Expected Weekly Change</Text>
                    <Text style={styles.goalSummaryValue}>
                      {recommendation.weeklyWeightChange > 0 ? '+' : ''}{recommendation.weeklyWeightChange} kg
                    </Text>
                  </View>
                </View>

                {recommendation.isBelowMinimum && (
                  <View style={styles.warningBox}>
                    <Text style={styles.warningIcon}>⚠️</Text>
                    <Text style={styles.warningText}>
                      Your goal requires calories below the safe minimum ({recommendation.minCalories} cal/day). 
                      We've adjusted your target to ensure safety.
                    </Text>
                  </View>
                )}

                <View style={styles.safetyGuidance}>
                  <Text style={styles.safetyTitle}>💡 Safety Guidelines</Text>
                  <Text style={styles.safetyText}>
                    • Aim for gradual changes (0.5-1 kg/week is sustainable)
                  </Text>
                  <Text style={styles.safetyText}>
                    • Don't go below {bmrSex === 'female' ? '1200' : '1500'} calories per day
                  </Text>
                  <Text style={styles.safetyText}>
                    • Stay hydrated and eat nutrient-dense foods
                  </Text>
                  <Text style={styles.safetyText}>
                    • Consult a healthcare professional for personalized advice
                  </Text>
                </View>
              </View>
              </>
            )}
          </>
        )}

        <TouchableOpacity style={styles.resetButton} onPress={resetAll}>
          <Text style={styles.resetButtonText}>Reset All</Text>
        </TouchableOpacity>
      </View>
      </ScrollView>
    </View>
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.inactive,
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 0,
    borderRadius: 30,
    padding: 4,
  },
  scrollContent: {
    flex: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 30,
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
  existingDataContainer: {
    marginBottom: 30,
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: theme.primary,
    alignItems: 'center',
  },
  existingDataTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  existingDataCard: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  existingDataItem: {
    backgroundColor: theme.inactive,
    borderRadius: 8,
    padding: 12,
    minWidth: '45%',
    alignItems: 'center',
  },
  existingDataLabel: {
    fontSize: 12,
    color: theme.textSecondary,
    marginBottom: 4,
    fontWeight: '600',
  },
  existingDataValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.primary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 20,
    textAlign: 'center',
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
  readOnlyInput: {
    backgroundColor: theme.surface,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.border,
    opacity: 0.7,
  },
  readOnlyText: {
    fontSize: 16,
    color: theme.text,
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
  saveBMIButton: {
    backgroundColor: theme.secondary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  saveBMIButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.6,
  },
  warningText: {
    fontSize: 12,
    color: theme.warning || '#FFA726',
    textAlign: 'center',
    marginBottom: 12,
    paddingHorizontal: 10,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  resetSectionButton: {
    backgroundColor: theme.surface,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 20,
  },
  resetSectionButtonText: {
    color: theme.text,
    fontSize: 14,
    fontWeight: '500',
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
  goalContainer: {
    gap: 8,
  },
  goalButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
  },
  goalButtonActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  goalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
  },
  goalButtonTextActive: {
    color: '#fff',
  },
  goalButtonSubtext: {
    fontSize: 11,
    color: theme.textSecondary,
    marginTop: 4,
  },
  goalButtonSubtextActive: {
    color: '#fff',
    opacity: 0.9,
  },
  tdeeDisplay: {
    backgroundColor: theme.inactive,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 2,
    borderColor: theme.primary,
  },
  tdeeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textSecondary,
    marginBottom: 8,
  },
  tdeeValue: {
    fontSize: 42,
    fontWeight: 'bold',
    color: theme.primary,
  },
  tdeeUnit: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 4,
  },
  tdeeWarning: {
    fontSize: 12,
    color: theme.error || '#F44336',
    marginTop: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  calorieRecommendation: {
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: theme.inactive,
    borderRadius: 12,
    borderColor: theme.primary,
    borderWidth: 2,
    padding: 50,
  },
  recommendedLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textSecondary,
    marginBottom: 8,
  },
  recommendedValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: theme.primary,
  },
  recommendedUnit: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 4,
  },
  goalSummary: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  goalSummaryItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: theme.surface,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  goalSummaryLabel: {
    fontSize: 12,
    color: theme.textSecondary,
    marginBottom: 5,
  },
  goalSummaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.text,
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF3CD',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFC107',
    marginBottom: 15,
    alignItems: 'flex-start',
  },
  warningIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: '#856404',
    lineHeight: 18,
  },
  safetyGuidance: {
    backgroundColor: theme.inactive,
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  safetyTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 10,
  },
  safetyText: {
    fontSize: 12,
    color: theme.textSecondary,
    lineHeight: 20,
    marginBottom: 4,
  },
});
