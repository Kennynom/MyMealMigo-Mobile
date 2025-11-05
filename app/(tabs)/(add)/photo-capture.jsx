import { ThemeContext } from '@/context/ThemeContext';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useContext } from "react";
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

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
    <SafeAreaView style={styles.safe}>
      {/* Header with back navigation */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{editMode ? 'Edit Meal Photo' : 'Take Photo'}</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Camera Screen Content - includes ML Engine */}
      <View style={{ flex: 1 }}>
        <CameraScreen 
          editMode={editMode}
          mealId={mealId}
          existingMealData={mealData}
        />
      </View>
    </SafeAreaView>
  );
}

const createStyles = (theme) => StyleSheet.create({
  safe: { 
    flex: 1, 
    backgroundColor: theme.background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    backgroundColor: theme.background,
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    fontSize: 24,
    color: theme.text,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: theme.text,
    textAlign: "center",
    flex: 1,
  },
  placeholder: {
    width: 40, // Same width as back button for centering
  }
});