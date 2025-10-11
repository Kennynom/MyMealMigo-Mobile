import { ThemeContext } from '@/context/ThemeContext';
import { router } from 'expo-router';
import { useContext } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function TrackerMainScreen() {
  const { colorScheme, setColorScheme, theme } = useContext(ThemeContext);
  const styles = createStyles(theme, colorScheme);

  const toggleTheme = () => {
    setColorScheme(colorScheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Tracker</Text>
          <Text style={styles.subtitle}>Monitor your health and fitness journey</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.themeButton} onPress={toggleTheme}>
            <Text style={styles.themeIcon}>{colorScheme === 'dark' ? '☀️' : '🌙'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tracker Cards */}
      <ScrollView style={styles.trackerList} showsVerticalScrollIndicator={false}>
        <TouchableOpacity 
          style={styles.trackerCard}
          onPress={() => router.push('calorie-tracker')}
        >
          <Text style={styles.trackerTitle}>Calorie Tracker</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.trackerCard}
          onPress={() => router.push('/(tabs)/(tracker)/progress-tracker')}
        >
          <Text style={styles.trackerTitle}>Progress Tracker</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.trackerCard}
          onPress={() => router.push('/(tabs)/(tracker)/activity-tracker')}
        >
          <Text style={styles.trackerTitle}>Activity Tracker</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.trackerCard}
          onPress={() => router.push('/(tabs)/(tracker)/(calculator)/bmi-calculator')}
        >
          <Text style={styles.trackerTitle}>BMI Calculator</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.trackerCard}
          onPress={() => router.push('/(tabs)/(tracker)/(calculator)/bmr-calculator')}
        >
          <Text style={styles.trackerTitle}>BMR Calculator</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
  trackerList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  trackerCard: {
    backgroundColor: '#000',
    borderRadius: 12,
    padding: 40,
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 80,
  },
  trackerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});