import { AuthContext } from '@/context/AuthContext';
import { ThemeContext } from '@/context/ThemeContext';
import { classifyUri, MlEngine } from '@/lib/ml/engine';
import { labelToId } from '@/lib/ml/foodMap';
import { getFoodNutrition } from '@/utils/nutritionService';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import React, { useContext, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import FoodRecognitionResults from './FoodRecognitionResults';

const { width, height } = Dimensions.get('window');

export default function CameraScreen() {
  const { theme } = useContext(ThemeContext);
  const { user } = useContext(AuthContext);
  const [facing, setFacing] = useState('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [recognitionResults, setRecognitionResults] = useState(null);
  const cameraRef = useRef(null);
  
  const styles = createStyles(theme);

  const CONFIDENCE_THRESHOLD = 0.70; // Minimum confidence to accept prediction


  if (!permission) {
    // Camera permissions are still loading
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Loading camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current && !isProcessing) {
      setIsProcessing(true);
      
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
          skipProcessing: false,
        });
        
        console.log('Photo captured:', photo.uri);
        
        await processCapturedImage(photo);
        
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to capture photo. Please try again.');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const processCapturedImage = async (photo) => {
    try {
      console.log('Processing captured image...');
      
  
      const prediction = await classifyUri(photo.uri);
      console.log('ML Prediction:', prediction);

      if (!prediction || !prediction.className) {
        throw new Error('No food detected in image');
      }

      const { className, probability } = prediction;
      
     
      if (probability < CONFIDENCE_THRESHOLD) {
        Alert.alert(
          'Low Confidence',
          `Food detection confidence is ${Math.round(probability * 100)}%. Please try taking a clearer photo.`,
          [
            { text: 'Retry', onPress: () => {} },
            { 
              text: 'Continue Anyway', 
              onPress: () => proceedWithRecognition(photo.uri, className, probability)
            }
          ]
        );
        return;
      }

      await proceedWithRecognition(photo.uri, className, probability);

    } catch (error) {
      console.error('Error processing image:', error);
      Alert.alert(
        'Recognition Failed', 
        error.message || 'Failed to recognize food in image. Please try again.',
        [{ text: 'Retry', onPress: () => {} }]
      );
    }
  };

  const proceedWithRecognition = async (photoUri, foodLabel, confidence) => {
    try {
     
      const foodId = labelToId[foodLabel];
      
      // Handle "Other" category and unmapped foods as unknown
      if (!foodId || foodId === 'other') {
        Alert.alert(
          'Unknown Food',
          `Detected "${foodLabel}" but no nutrition data is available. Would you like to add it manually?`,
          [
            { text: 'Take Another Photo', onPress: () => {} },
            { text: 'Manual Entry', onPress: () => router.push('/(tabs)/(add)/manual-entry') }
          ]
        );
        return;
      }

      console.log('Food ID:', foodId);

   
      const nutritionData = await getFoodNutrition(foodId);
      console.log('✅ Nutrition data from Firestore:', nutritionData);

   
      setRecognitionResults({
        photoUri,
        foodData: nutritionData,
        confidence,
        originalLabel: foodLabel
      });
      setShowResults(true);

    } catch (error) {
      console.error('❌ Error getting nutrition data:', error);
      
      // Handle different types of errors
      if (error.message.includes('not available in database')) {
        Alert.alert(
          'Food Not Available',
          `"${foodLabel}" is not in our database yet. Would you like to add it manually?`,
          [
            { text: 'Take Another Photo', onPress: () => {} },
            { text: 'Manual Entry', onPress: () => router.push('/(tabs)/(add)/manual-entry') }
          ]
        );
      } else {
        Alert.alert(
          'Error', 
          'Failed to get nutrition information. Please check your internet connection and try again.',
          [{ text: 'OK', onPress: () => {} }]
        );
      }
    }
  };

  const handleRetakePhoto = () => {
    setShowResults(false);
    setRecognitionResults(null);
  };

  const handleMealAdded = () => {
    // Reset to camera view after successful meal logging
    setShowResults(false);
    setRecognitionResults(null);
  };

  // Show results screen if we have recognition results
  if (showResults && recognitionResults) {
    return (
      <FoodRecognitionResults
        photoUri={recognitionResults.photoUri}
        foodData={recognitionResults.foodData}
        confidence={recognitionResults.confidence}
        onRetakePhoto={handleRetakePhoto}
        onAddMeal={handleMealAdded}
      />
    );
  }

  const toggleCameraType = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  return (
    <View style={styles.container}>
      {/* Camera Title */}
    
      <CameraView 
        style={styles.camera} 
        facing={facing}
        ref={cameraRef}
      >
        <View style={styles.buttonContainer}>
          {/* Flip camera button */}
          <TouchableOpacity style={styles.flipButton} onPress={toggleCameraType}>
            <Text style={styles.flipText}>🔄</Text>
          </TouchableOpacity>
          
          {/* Capture button */}
          <TouchableOpacity 
            style={[styles.captureButton, isProcessing && styles.captureButtonDisabled]} 
            onPress={takePicture}
            disabled={isProcessing}
          >
            <View style={styles.captureInner}>
              <Text style={styles.captureText}>
                {isProcessing ? '⏳' : '📷'}
              </Text>
            </View>
          </TouchableOpacity>
          
          {/* Placeholder for spacing */}
          <View style={styles.flipButton} />
        </View>
      </CameraView>
      
      
      {/* Hidden ML Engine for real model.js */}
      <MlEngine />
    </View>
  );
}

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  camera: {
    height: 700,
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 5, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingBottom: 50,
    paddingHorizontal: 30,
  },
  flipButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flipText: {
    fontSize: 24,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#059669',
  },
  captureButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureText: {
    fontSize: 24,
    color: 'white',
  },
  instructions: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 8,
    padding: 12,
    zIndex: 1,
  },
  instructionText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
    fontSize: 16,
    color: theme.text,
  },
  button: {
    backgroundColor: '#059669',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});