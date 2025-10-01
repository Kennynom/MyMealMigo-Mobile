import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function NutritionScreen() {
  const nutrients = [
    { name: 'Protein', amount: 65, unit: 'g', goal: 75, color: '#FF6B6B' },
    { name: 'Carbs', amount: 180, unit: 'g', goal: 225, color: '#4ECDC4' },
    { name: 'Fat', amount: 45, unit: 'g', goal: 60, color: '#FFE66D' },
    { name: 'Fiber', amount: 18, unit: 'g', goal: 25, color: '#95E1D3' },
  ];

  const vitamins = [
    { name: 'Vitamin A', percentage: 85 },
    { name: 'Vitamin C', percentage: 120 },
    { name: 'Vitamin D', percentage: 60 },
    { name: 'Calcium', percentage: 75 },
    { name: 'Iron', percentage: 90 },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Nutrition Info</Text>
        <Text style={styles.headerSubtitle}>Today's Breakdown</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Macronutrients</Text>
          {nutrients.map((nutrient, index) => (
            <View key={index} style={styles.nutrientCard}>
              <View style={styles.nutrientHeader}>
                <Text style={styles.nutrientName}>{nutrient.name}</Text>
                <Text style={styles.nutrientValue}>
                  {nutrient.amount}{nutrient.unit} / {nutrient.goal}{nutrient.unit}
                </Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View 
                  style={[
                    styles.progressBar, 
                    { 
                      width: `${(nutrient.amount / nutrient.goal) * 100}%`,
                      backgroundColor: nutrient.color 
                    }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {Math.round((nutrient.amount / nutrient.goal) * 100)}% of daily goal
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vitamins & Minerals</Text>
          {vitamins.map((vitamin, index) => (
            <View key={index} style={styles.vitaminCard}>
              <View style={styles.vitaminRow}>
                <Text style={styles.vitaminName}>{vitamin.name}</Text>
                <Text style={[
                  styles.vitaminPercentage,
                  vitamin.percentage >= 100 ? styles.complete : {}
                ]}>
                  {vitamin.percentage}%
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#4CAF50',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  nutrientCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  nutrientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  nutrientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  nutrientValue: {
    fontSize: 14,
    color: '#666',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
  },
  vitaminCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  vitaminRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vitaminName: {
    fontSize: 16,
    color: '#333',
  },
  vitaminPercentage: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  complete: {
    color: '#4CAF50',
  },
});
