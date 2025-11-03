import { ThemeContext } from '@/context/ThemeContext';
import { router } from 'expo-router';
import { useContext } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function TrackerMainScreen() {
  const { theme } = useContext(ThemeContext);
  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Tracker</Text>
          <Text style={styles.subtitle}>Monitor your health and fitness journey</Text>
        </View>
      </View>

      {/* Tracker Cards */}
      <ScrollView style={styles.trackerList} showsVerticalScrollIndicator={false}>
        <View style={styles.trackerRow}>
          <TouchableOpacity 
            style={styles.trackerCard}
            onPress={() => router.push('calorie-tracker')}
          >
            <View style={{ alignItems: 'flex-start', justifyContent: 'space-between', flex: 1 }}>
              <MaterialIcons name="apple" size={24} color={theme.primaryDark} />
              <Text style={[styles.trackerTitle, { textAlign: 'left', alignSelf: 'flex-start' }]}>Calorie Tracker</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.trackerCard}
            onPress={() => router.push('/(tabs)/(tracker)/progress-tracker')}
          >
            <View style={{ alignItems: 'flex-start', justifyContent: 'space-between', flex: 1 }}>
              <MaterialIcons name="align-vertical-bottom" size={24} color={theme.primaryDark} />
              <Text style={[styles.trackerTitle, { textAlign: 'left', alignSelf: 'flex-start' }]}>Progress Tracker</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.trackerRow}>
          <TouchableOpacity 
            style={styles.trackerCard}
            onPress={() => router.push('/(tabs)/(tracker)/activity-tracker')}
          >
            <View style={{ alignItems: 'flex-start', justifyContent: 'space-between', flex: 1 }}>
              <MaterialIcons name="directions-run" size={24} color={theme.primaryDark} />
              <Text style={[styles.trackerTitle, { textAlign: 'left', alignSelf: 'flex-start' }]}>Activity Tracker</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.trackerCard}
            onPress={() => router.push('/(tabs)/(tracker)/health-calculator')}
          >
            <View style={{ alignItems: 'flex-start', justifyContent: 'space-between', flex: 1 }}>
              <MaterialIcons name="monitor-heart" size={24} color={theme.primaryDark} />
              <Text style={[styles.trackerTitle, { textAlign: 'left', alignSelf: 'flex-start' }]}>Health Calculator</Text>
            </View>
          </TouchableOpacity>
        </View>

      </ScrollView>
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
  trackerList: {
    flex: 1,
    margin: 10,
  },
  trackerCard: {
    backgroundColor: theme.background,
    borderRadius: 20,
    padding: 20,
    justifyContent: 'flex-end',
    alignItems: 'center',
    width: '45%',
    height: 200,
    margin: 5,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3.84,
    elevation: 5,
  },
  trackerTitle: {
    color: theme.primaryDark,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'left',
  },
  trackerRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  trackerIcon: {
    marginBottom: 10,
    alignItems: 'flex-start',
  },
});