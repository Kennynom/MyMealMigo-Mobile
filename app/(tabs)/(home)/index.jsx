import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useContext } from 'react';
import { ThemeContext } from '@/context/ThemeContext';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { colorScheme, setColorScheme, theme } = useContext(ThemeContext);

  const styles = createStyles(theme, colorScheme);

  const toggleTheme = () => {
    setColorScheme(colorScheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Smart Dashboard</Text>
          <Text style={styles.welcome}>Welcome!</Text>
          <Text style={styles.subtitle}>You're currently 20 kcal under your daily goal.</Text>
        </View>
        <View style={styles.headerButtons}>
          {/* Theme Toggle Button */}
          <TouchableOpacity style={styles.themeButton} onPress={toggleTheme}>
            <Text style={styles.themeIcon}>{colorScheme === 'dark' ? '☀️' : '🌙'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileButton}>
            <Text style={styles.profileIcon}>👤</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Weight</Text>
          <Text style={styles.statValue}>59</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>BMI</Text>
          <Text style={styles.statValue}>23.5</Text>
        </View>
      </View>

      {/* Progress Chart */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Progress Chart</Text>
        </View>
        <View style={styles.chartPlaceholder}>
          <Text style={styles.chartText}>📈 Weight Progress</Text>
          <Text style={styles.trendText}>Trend: down 0.8 kg this week</Text>
        </View>
        <View style={styles.chartTabs}>
          <TouchableOpacity style={styles.activeTab}>
            <Text style={styles.activeTabText}>Weight</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab}>
            <Text style={styles.tabText}>Calories</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab}>
            <Text style={styles.tabText}>Macros</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tip of the Day */}
      <View style={styles.tipCard}>
        <View style={styles.tipHeader}>
          <Text style={styles.tipTitle}>Tip of the day:</Text>
          <TouchableOpacity style={styles.tipButton}>
            <Text style={styles.tipButtonText}>💡</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.tipContent}>
          <View style={styles.tipIcon}>
            <Text style={styles.tipEmoji}>🥬</Text>
          </View>
          <View style={styles.tipTextContainer}>
            <Text style={styles.tipText}>
              Include a serving of leafy green vegetables in your meals to boost your intake of vitamins and minerals
            </Text>
            <TouchableOpacity style={styles.tipAction}>
              <Text style={styles.tipActionText}>📖</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Predictive Insight */}
      <View style={styles.insightCard}>
        <Text style={styles.insightTitle}>Predictive Insight</Text>
        <LinearGradient colors={['#FFB800', '#FF8A00']} style={styles.insightContent}>
          <View style={styles.lockIcon}>
            <Text style={styles.lockText}>🔒</Text>
            <Text style={styles.dollarSign}>$</Text>
          </View>
        </LinearGradient>
      </View>

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}

// Dynamic styles function (exactly like your CrudApp)
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
    paddingTop: 10,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 4,
  },
  welcome: {
    fontSize: 16,
    color: theme.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  headerButtons: {
    flexDirection: 'row',
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
  profileButton: {
    width: 40,
    height: 40,
    backgroundColor: theme.primary,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIcon: {
    color: '#fff',
    fontSize: 20,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 15,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  statLabel: {
    color: theme.textSecondary,
    fontSize: 14,
    marginBottom: 8,
  },
  statValue: {
    color: theme.text,
    fontSize: 24,
    fontWeight: 'bold',
  },
  chartCard: {
    backgroundColor: theme.surface,
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  chartHeader: {
    marginBottom: 15,
  },
  chartTitle: {
    color: theme.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  chartPlaceholder: {
    backgroundColor: theme.inactive,
    height: 120,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  chartText: {
    color: theme.textSecondary,
    fontSize: 16,
    marginBottom: 8,
  },
  trendText: {
    color: theme.primary,
    fontSize: 14,
  },
  chartTabs: {
    flexDirection: 'row',
    gap: 15,
  },
  activeTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: theme.primary,
    borderRadius: 20,
  },
  activeTabText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  tabText: {
    color: theme.textSecondary,
    fontSize: 14,
  },
  tipCard: {
    backgroundColor: theme.surface,
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  tipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  tipTitle: {
    color: theme.text,
    fontSize: 16,
  },
  tipButton: {
    backgroundColor: theme.primary,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipButtonText: {
    fontSize: 16,
  },
  tipContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipIcon: {
    marginRight: 15,
  },
  tipEmoji: {
    fontSize: 24,
  },
  tipTextContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipText: {
    color: theme.text,
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  tipAction: {
    marginLeft: 10,
  },
  tipActionText: {
    fontSize: 20,
  },
  insightCard: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 10,
  },
  insightContent: {
    height: 120,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockIcon: {
    alignItems: 'center',
  },
  lockText: {
    fontSize: 32,
    marginBottom: 8,
  },
  dollarSign: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  bottomSpacing: {
    height: 20,
  },
});
