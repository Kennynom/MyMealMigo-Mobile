import { AuthContext } from '@/context/AuthContext';
import { ThemeContext } from '@/context/ThemeContext';
import { checkCalorieGoalExceedance, logMealToFirebase, updateCalorieTracking, updateMealAndCalories } from '@/utils/mealService';
import { MaterialIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useContext, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
const { width, height } = Dimensions.get('window');

const ML_SERVER_URL = process.env.EXPO_PUBLIC_ML_SERVER_URL || 'http://192.168.18.81:5174';

// Debug: Log the ML server URL to verify it's loaded
console.log('ML_SERVER_URL:', ML_SERVER_URL);

export default function ScanBarcodeScreen() {
  const { theme } = useContext(ThemeContext);
  const { user } = useContext(AuthContext);
  const params = useLocalSearchParams();
  const [facing, setFacing] = useState('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(true);
  const [scannedProduct, setScannedProduct] = useState(null);
  const [isLogging, setIsLogging] = useState(false);
  const [showMealCategoryModal, setShowMealCategoryModal] = useState(false);
  const [servingMultiplier, setServingMultiplier] = useState(1);
  const cameraRef = useRef(null);
  const lastScannedRef = useRef({ barcode: null, timestamp: 0 });
  
  // Check if we're in edit mode
  const editMode = params.editMode === 'true';
  const mealId = params.mealId;
  const existingMealData = params.mealData ? JSON.parse(params.mealData) : null;
  
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

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Loading camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarcodeScanned = async ({ data: barcode }) => {
    if (!isScanning) return;
    
    // Debounce: Prevent scanning the same barcode within 2 seconds
    const now = Date.now();
    if (lastScannedRef.current.barcode === barcode && 
        now - lastScannedRef.current.timestamp < 2000) {
      return;
    }
    
    // Update last scanned barcode and timestamp
    lastScannedRef.current = { barcode, timestamp: now };
    
    setIsScanning(false);
    console.log('Barcode scanned:', barcode);

    try {
      // Lookup product in barcodes.json via the ML server API
      const response = await fetch(`${ML_SERVER_URL}/api/barcodes/${barcode}`);
      
      if (!response.ok) {
        throw new Error('Product not found');
      }
      
      const product = await response.json();
      console.log('Product found:', product);
      
      setScannedProduct(product);
      
    } catch (error) {
      // Only log to console (not console.error to avoid bottom toast)
      console.log('Barcode not found:', barcode);
      
      Alert.alert(
        'Product Not Found',
        `Barcode "${barcode}" is not in our database. Would you like to add it manually?`,
        [
          { 
            text: 'Scan Again', 
            onPress: () => {
              lastScannedRef.current = { barcode: null, timestamp: 0 };
              setIsScanning(true);
            },
            style: 'cancel'
          },
          { 
            text: 'Manual Entry', 
            onPress: () => router.push('/(tabs)/(add)/manual-entry')
          }
        ]
      );
    }
  };

  const handleAddProductClick = () => {
    setShowMealCategoryModal(true);
  };

  const handleMealCategorySelect = async (category, type) => {
    setShowMealCategoryModal(false);
    
    // Proceed with logging
    await handleAddProduct(category, type);
  };

  const handleAddProduct = async (mealCategory, mealType) => {
    if (!scannedProduct || isLogging) return;
    
    if (!user) {
      Alert.alert('Error', 'You must be logged in to log meals');
      return;
    }

    setIsLogging(true);
    
    try {
      console.log('Adding product to meal log:', scannedProduct);
      
      // Create meal entry in the same format as camera screen
      const mealEntry = {
        foodName: scannedProduct.name,
        calories: scannedProduct.calories,
        protein: scannedProduct.protein,
        carbs: scannedProduct.carbs,
        fat: scannedProduct.fat,
        sodium: scannedProduct.sodium,
        sugar: scannedProduct.sugar,
        servingSize: servingMultiplier,
        servingUnit: "serving",
        entryMethod: 'barcode',
        timestamp: new Date(),
        userId: user.uid,
        barcode: scannedProduct.code, // Include barcode for reference
        mealCategory: mealCategory,  // Breakfast/Lunch/Dinner
        mealType: mealType            // Meal/Beverage
      };

      // Check if this meal will exceed calorie goal (only for new meals, not edits)
      if (!editMode) {
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
                  await proceedWithBarcodeLogging(mealEntry, mealCategory);
                }
              }
            ]
          );
          return; // Stop here and wait for user decision
        }
      }

      // If no warning or user confirmed, proceed with logging
      await proceedWithBarcodeLogging(mealEntry, mealCategory);
      
    } catch (error) {
      console.error('Error logging meal:', error);
      Alert.alert('Error', 'Failed to save meal. Please try again.');
      setIsLogging(false);
    }
  };

  // Separate function to handle the actual logging logic
  const proceedWithBarcodeLogging = async (mealEntry, mealCategory) => {
    try {
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
          `Product logged to ${mealCategory} successfully!`,
          [
            {
              text: 'Scan Another',
              onPress: () => resetScanner()
            },
            {
              text: 'View Logs',
              onPress: () => router.push('/(tabs)/(logs)')
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error in proceedWithBarcodeLogging:', error);
      throw error;
    } finally {
      setIsLogging(false);
    }
  };

  const resetScanner = () => {
    setScannedProduct(null);
    setServingMultiplier(1);
    lastScannedRef.current = { barcode: null, timestamp: 0 };
    setIsScanning(true);
  };

  // Show product details if scanned
  if (scannedProduct) {
    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header with modern style */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={resetScanner}
          >
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Product Found</Text>
            <Text style={styles.headerSubtitle}>Review and add to meal log</Text>
          </View>
          <View style={styles.placeholder} />
        </View>

        {/* Product Image Display */}
        <View style={styles.resultsCard}>
          {scannedProduct.localImage && (
            <Image 
              source={{ uri: `${ML_SERVER_URL}/images/${scannedProduct.localImage}` }}
              style={styles.photoImg}
              resizeMode="contain"
            />
          )}
        </View>

        {/* Product Information */}
        <View style={styles.foodInfoContainer}>
          <Text style={styles.sectionTitle}>Product Detected</Text>
          <Text style={styles.foodName}>{scannedProduct.name}</Text>
        </View>

        {/* Macros Breakdown */}
        <View style={styles.macrosContainer}>
          <Text style={styles.sectionTitle}>Macros Breakdown</Text>
          
          <View style={styles.macroGrid}>
            <View style={styles.macroItem}>
              <Text style={styles.macroLabel}>Calories</Text>
              <Text style={styles.macroValue}>{Math.round(scannedProduct.calories * servingMultiplier)} Kcal</Text>
            </View>
            
            <View style={styles.macroItem}>
              <Text style={styles.macroLabel}>Carbs</Text>
              <Text style={styles.macroValue}>{(scannedProduct.carbs * servingMultiplier).toFixed(1)} g</Text>
            </View>
            
            <View style={styles.macroItem}>
              <Text style={styles.macroLabel}>Protein</Text>
              <Text style={styles.macroValue}>{(scannedProduct.protein * servingMultiplier).toFixed(1)} g</Text>
            </View>
            
            <View style={styles.macroItem}>
              <Text style={styles.macroLabel}>Fats</Text>
              <Text style={styles.macroValue}>{(scannedProduct.fat * servingMultiplier).toFixed(1)} g</Text>
            </View>
            
            <View style={styles.macroItem}>
              <Text style={styles.macroLabel}>Sugar</Text>
              <Text style={styles.macroValue}>{(scannedProduct.sugar * servingMultiplier).toFixed(1)} g</Text>
            </View>
            
            <View style={styles.macroItem}>
              <Text style={styles.macroLabel}>Sodium</Text>
              <Text style={styles.macroValue}>{Math.round(scannedProduct.sodium * servingMultiplier)} mg</Text>
            </View>
          </View>

          {/* Serving Size Section with Editable Multiplier */}
          <View style={styles.servingSection}>
            <View style={styles.servingSizeInfo}>
              <Text style={styles.servingLabel}>Serving Size:</Text>
              <Text style={styles.servingInfoText}>1 serving</Text>
            </View>
            
            <View style={styles.servingMultiplierContainer}>
              <Text style={styles.servingLabel}>Number of Servings:</Text>
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
            </View>
            
            <View style={styles.totalServingInfo}>
              <Text style={styles.totalServingText}>
              
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.addButton, isLogging && styles.addButtonDisabled]}
            onPress={handleAddProductClick}
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
            onPress={resetScanner}
            disabled={isLogging}
          >
            <Text style={styles.retakeButtonText}>Scan Another</Text>
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

  return (
    <View style={styles.container}>
      {/* Header with modern style */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Scan Barcode</Text>
          <Text style={styles.headerSubtitle}>Scan product barcodes</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      {/* Barcode Scanner */}
      <CameraView 
        style={styles.camera} 
        facing={facing}
        ref={cameraRef}
        barcodeScannerSettings={{
          barcodeTypes: ['qr', 'ean13', 'ean8', 'code128', 'code39', 'upc_a', 'upc_e'],
        }}
        onBarcodeScanned={isScanning ? handleBarcodeScanned : undefined}
      >
        {/* Scanning overlay with modern frame */}
        <View style={styles.scanOverlay}>
          <View style={styles.scanFrameContainer}>
            <View style={styles.scanFrame} />
            <View style={styles.cornerTL} />
            <View style={styles.cornerTR} />
            <View style={styles.cornerBL} />
            <View style={styles.cornerBR} />
          </View>
          <Text style={styles.scanInstructions}>
            {isScanning ? 'Point camera at barcode' : 'Processing...'}
          </Text>
        </View>
        
        {/* Camera controls */}
        <View style={styles.cameraControls}>
          <TouchableOpacity 
            style={styles.flipButton} 
            onPress={() => setFacing(current => (current === 'back' ? 'front' : 'back'))}
          >
            <MaterialIcons name="autorenew" size={32} color={theme.primaryDark} />
          </TouchableOpacity>
        </View>
      </CameraView>
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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: theme.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  backText: {
    fontSize: 24,
    color: theme.text,
    fontWeight: 'bold',
  },
  headerCenter: { 
    flex: 1, 
    alignItems: 'center', 
    paddingHorizontal: 12 
  },
  headerTitle: { 
    fontSize: 22, 
    fontWeight: 'bold',
    color: theme.text,
  },
  headerSubtitle: { 
    fontSize: 13, 
    marginTop: 2,
    color: theme.textSecondary,
  },
  placeholder: {
    width: 40,
  },
  camera: {
    flex: 1,
    position: 'relative',
  },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  scanFrameContainer: {
    position: 'relative',
    width: 280,
    height: 280,
  },
  scanFrame: {
    width: '100%',
    height: '100%',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  // Corner decorations for scanner frame
  cornerTL: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: theme.primary || '#4ECDC4',
    borderTopLeftRadius: 16,
  },
  cornerTR: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: theme.primary || '#4ECDC4',
    borderTopRightRadius: 16,
  },
  cornerBL: {
    position: 'absolute',
    bottom: -2,
    left: -2,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: theme.primary || '#4ECDC4',
    borderBottomLeftRadius: 16,
  },
  cornerBR: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: theme.primary || '#4ECDC4',
    borderBottomRightRadius: 16,
  },
  scanInstructions: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 30,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  cameraControls: {
    position: 'absolute',
    bottom: 50,
    right: 30,
  },
  flipButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  flipText: {
    fontSize: 28,
  },
  // Match FoodRecognitionResults styles exactly
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
  servingSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    gap: 12,
  },
  servingSizeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  servingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
  },
  servingInfoText: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  servingMultiplierContainer: {
    gap: 8,
  },
  servingInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  servingButton: {
    backgroundColor: '#059669',
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
  totalServingInfo: {
    alignItems: 'center',
  },
  totalServingText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
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
  message: {
    textAlign: 'center',
    paddingBottom: 10,
    fontSize: 16,
    color: theme.text,
    margin: 20,
  },
  button: {
    backgroundColor: '#059669',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'center',
    margin: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
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