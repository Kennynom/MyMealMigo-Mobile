import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

export default function ProfileScreen() {
  const userInfo = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    age: 28,
    weight: '75 kg',
    height: '180 cm',
    goal: 'Maintain healthy weight',
  };

  const settingsOptions = [
    { id: 1, title: 'Personal Information', icon: '👤' },
    { id: 2, title: 'Goals & Targets', icon: '🎯' },
    { id: 3, title: 'Notifications', icon: '🔔' },
    { id: 4, title: 'Units & Preferences', icon: '⚙️' },
    { id: 5, title: 'About MyMealMigo', icon: 'ℹ️' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>JD</Text>
          </View>
          <Text style={styles.userName}>{userInfo.name}</Text>
          <Text style={styles.userEmail}>{userInfo.email}</Text>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Age</Text>
            <Text style={styles.statValue}>{userInfo.age}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Weight</Text>
            <Text style={styles.statValue}>{userInfo.weight}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Height</Text>
            <Text style={styles.statValue}>{userInfo.height}</Text>
          </View>
        </View>

        <View style={styles.goalCard}>
          <Text style={styles.goalLabel}>Current Goal</Text>
          <Text style={styles.goalText}>{userInfo.goal}</Text>
        </View>

        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Settings</Text>
          {settingsOptions.map((option) => (
            <TouchableOpacity key={option.id} style={styles.settingOption}>
              <Text style={styles.settingIcon}>{option.icon}</Text>
              <Text style={styles.settingTitle}>{option.title}</Text>
              <Text style={styles.settingArrow}>›</Text>
            </TouchableOpacity>
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
  },
  content: {
    flex: 1,
    padding: 20,
  },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  statsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
  },
  goalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  goalLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  goalText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  settingsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  settingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  settingTitle: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  settingArrow: {
    fontSize: 24,
    color: '#ccc',
  },
});
