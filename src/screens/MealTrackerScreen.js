import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';

export default function MealTrackerScreen() {
  const [meals, setMeals] = useState([
    { id: 1, name: 'Breakfast', time: '8:00 AM', calories: 450 },
    { id: 2, name: 'Lunch', time: '1:00 PM', calories: 650 },
    { id: 3, name: 'Dinner', time: '7:00 PM', calories: 550 },
  ]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meal Tracker</Text>
        <Text style={styles.headerSubtitle}>Today's Meals</Text>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Daily Summary</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>1650</Text>
            <Text style={styles.summaryLabel}>Calories</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>3</Text>
            <Text style={styles.summaryLabel}>Meals</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>2000</Text>
            <Text style={styles.summaryLabel}>Goal</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.mealsList}>
        {meals.map((meal) => (
          <View key={meal.id} style={styles.mealCard}>
            <View style={styles.mealHeader}>
              <Text style={styles.mealName}>{meal.name}</Text>
              <Text style={styles.mealTime}>{meal.time}</Text>
            </View>
            <Text style={styles.mealCalories}>{meal.calories} calories</Text>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.addButton}>
        <Text style={styles.addButtonText}>+ Add Meal</Text>
      </TouchableOpacity>
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
  summaryCard: {
    backgroundColor: '#ffffff',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
  },
  mealsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  mealCard: {
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
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mealName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  mealTime: {
    fontSize: 14,
    color: '#666',
  },
  mealCalories: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});
