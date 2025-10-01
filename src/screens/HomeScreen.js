import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>MyMealMigo</Text>
        <Text style={styles.headerSubtitle}>Your Health & Nutrition Companion</Text>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome! 🥗</Text>
          <Text style={styles.cardText}>
            Track your meals, monitor your nutrition, and achieve your health goals with MyMealMigo.
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => navigation.navigate('MealTracker')}
        >
          <Text style={styles.menuIcon}>🍽️</Text>
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuTitle}>Meal Tracker</Text>
            <Text style={styles.menuDescription}>Log your daily meals</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => navigation.navigate('Nutrition')}
        >
          <Text style={styles.menuIcon}>📊</Text>
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuTitle}>Nutrition Info</Text>
            <Text style={styles.menuDescription}>View nutritional details</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.menuIcon}>👤</Text>
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuTitle}>Profile</Text>
            <Text style={styles.menuDescription}>Manage your settings</Text>
          </View>
        </TouchableOpacity>
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
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  cardText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuIcon: {
    fontSize: 36,
    marginRight: 16,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  menuDescription: {
    fontSize: 14,
    color: '#666',
  },
});
