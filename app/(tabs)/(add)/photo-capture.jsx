import { ThemeContext } from '@/context/ThemeContext';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useContext } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

// Camera screen with real ML Engine
import CameraScreen from "@/components/camera/CameraScreen";

export default function PhotoCaptureScreen() {
  const { theme } = useContext(ThemeContext);
  const params = useLocalSearchParams();
  const styles = createStyles(theme);

  // Check if we're in edit mode
  const editMode = params.editMode === 'true';
  const mealId = params.mealId;
  const mealData = params.mealData ? JSON.parse(params.mealData) : null;

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
          <Text style={styles.headerTitle}>
            {editMode ? 'Edit Meal Photo' : 'Take Photo'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {editMode ? 'Update your meal photo' : 'Snap and analyze your meal'}
          </Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      {/* Camera - Direct child like scan-barcode */}
      <CameraScreen 
        editMode={editMode}
        mealId={mealId}
        existingMealData={mealData}
      />
    </View>
  );
}

const createStyles = (theme) => StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: theme.background
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
  }
});