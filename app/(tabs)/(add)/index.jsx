import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useContext } from 'react';
import { ThemeContext } from '@/context/ThemeContext';
import { router } from 'expo-router';

export default function AddMealMainScreen() {
  const { colorScheme, setColorScheme, theme } = useContext(ThemeContext);
  const styles = createStyles(theme, colorScheme);

  const toggleTheme = () => {
    setColorScheme(colorScheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Add Meal</Text>
          <Text style={styles.subtitle}>Choose how you'd like to log your meal</Text>
        </View>
        <TouchableOpacity style={styles.themeButton} onPress={toggleTheme}>
          <Text style={styles.themeIcon}>{colorScheme === 'dark' ? '☀️' : '🌙'}</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Add</Text>
        
        <TouchableOpacity 
          style={styles.actionCard}
          onPress={() => router.push('/(tabs)/(add)/photo-capture')}
        >
          <View style={styles.actionIcon}>
            <Text style={styles.actionEmoji}>📷</Text>
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Take Photo</Text>
            <Text style={styles.actionSubtitle}>Snap a pic and let AI analyze your meal</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionCard}
          onPress={() => router.push('/(tabs)/(add)/scan-barcode')}
        >
          <View style={styles.actionIcon}>
            <Text style={styles.actionEmoji}>📱</Text>
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Scan Barcode</Text>
            <Text style={styles.actionSubtitle}>Quickly add packaged foods</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Manual Entry */}
      <View style={styles.manualSection}>
        <Text style={styles.sectionTitle}>Manual Entry</Text>
        
        <TouchableOpacity 
          style={styles.actionCard}
          onPress={() => router.push('/(tabs)/(add)/search-food')}
        >
          <View style={styles.actionIcon}>
            <Text style={styles.actionEmoji}>🔍</Text>
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Search Food Database</Text>
            <Text style={styles.actionSubtitle}>Find from thousands of foods</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionCard}
          onPress={() => router.push('/(tabs)/(add)/manual-entry')}
        >
          <View style={styles.actionIcon}>
            <Text style={styles.actionEmoji}>✏️</Text>
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Manual Entry</Text>
            <Text style={styles.actionSubtitle}>Enter nutrition info manually</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Meals */}
      <View style={styles.recentSection}>
        <Text style={styles.sectionTitle}>Recent Meals</Text>
        
        <TouchableOpacity style={styles.recentCard}>
          <Text style={styles.recentEmoji}>🍳</Text>
          <View style={styles.recentContent}>
            <Text style={styles.recentTitle}>Scrambled Eggs</Text>
            <Text style={styles.recentTime}>Added yesterday</Text>
          </View>
          <TouchableOpacity style={styles.addButton}>
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </TouchableOpacity>

        <TouchableOpacity style={styles.recentCard}>
          <Text style={styles.recentEmoji}>🥗</Text>
          <View style={styles.recentContent}>
            <Text style={styles.recentTitle}>Caesar Salad</Text>
            <Text style={styles.recentTime}>Added 2 days ago</Text>
          </View>
          <TouchableOpacity style={styles.addButton}>
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const createStyles = (theme, colorScheme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingTop: 60,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: theme.textSecondary,
  },
  themeButton: {
    width: 40,
    height: 40,
    backgroundColor: theme.surface,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeIcon: {
    fontSize: 20,
  },
  quickActions: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 15,
  },
  actionCard: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionIcon: {
    width: 44,
    height: 44,
    backgroundColor: theme.primary,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionEmoji: {
    fontSize: 20,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 18,
  },
  arrow: {
    fontSize: 20,
    color: theme.textSecondary,
    marginLeft: 8,
  },
  manualSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  recentSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  recentCard: {
    backgroundColor: theme.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  recentEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  recentContent: {
    flex: 1,
  },
  recentTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.text,
  },
  recentTime: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 2,
  },
  addButton: {
    width: 32,
    height: 32,
    backgroundColor: theme.primary,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});