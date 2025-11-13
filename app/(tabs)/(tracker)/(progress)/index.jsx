// app/(tabs)/(tracker)/(progress)/index.jsx
import { db } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';
import { ThemeContext } from '@/context/ThemeContext';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useContext, useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { BarChart, LineChart } from 'react-native-chart-kit';

export default function ProgressTrackerScreen() {
  const { theme } = useContext(ThemeContext);
  const { user } = useAuth();
  const [currentWeight, setCurrentWeight] = useState(0);
  const [targetWeight, setTargetWeight] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [newTargetWeight, setNewTargetWeight] = useState('');
  const [newCurrentWeight, setNewCurrentWeight] = useState('');
  const [loading, setLoading] = useState(false);
  const [weightLogs, setWeightLogs] = useState([]);
  const [goalRate, setGoalRate] = useState(0); // Weekly weight change goal (e.g., 0.5 for gain, -0.5 for loss)

  const styles = createStyles(theme);

  // Fetch weight data from Firebase
  const fetchWeightData = async () => {
    if (!user) return;

    try {
      // Fetch current weight from user profile
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data() || {};
        const profile = userData.profile || {};

        if (typeof profile.weightKg === 'number') {
          setCurrentWeight(profile.weightKg);
        }
      }

      // Fetch target weight from health profile
      const healthProfileRef = doc(db, 'users', user.uid, 'private', 'health_profile');
      const healthProfileSnap = await getDoc(healthProfileRef);

      if (healthProfileSnap.exists()) {
        const healthData = healthProfileSnap.data() || {};
        
        // Check if targetWeight exists in Goal.items first
        if (healthData.Goal?.items?.targetWeight && typeof healthData.Goal.items.targetWeight === 'number') {
          setTargetWeight(healthData.Goal.items.targetWeight);
        }
        // Fallback to old location for backward compatibility
        else if (typeof healthData.targetWeight === 'number') {
          setTargetWeight(healthData.targetWeight);
        }

        // Fetch weekly weight change goal (e.g., 0.5 for gain, -0.5 for loss)
        if (healthData.Goal?.items?.weeklyWeightChange && typeof healthData.Goal.items.weeklyWeightChange === 'number') {
          // Check the goal type to determine if it should be positive or negative
          const goalType = healthData.Goal?.items?.type || '';
          const weeklyChange = healthData.Goal.items.weeklyWeightChange;
          
          // If goal is weight loss (lose/loss), make it negative
          if (goalType.toLowerCase().includes('loss') || goalType.toLowerCase().includes('lose')) {
            setGoalRate(-Math.abs(weeklyChange));
          } 
          // If goal is weight gain, make it positive
          else if (goalType.toLowerCase().includes('gain')) {
            setGoalRate(Math.abs(weeklyChange));
          }
          // Otherwise use the value as-is
          else {
            setGoalRate(weeklyChange);
          }
        }
      }

      // Fetch weight logs from weight_log
      const weightLogRef = doc(db, 'users', user.uid, 'private', 'health_profile', 'weight_log', 'main');
      const weightLogSnap = await getDoc(weightLogRef);

      if (weightLogSnap.exists()) {
        const logData = weightLogSnap.data() || {};
        const logs = logData.logs || [];
        
        // Sort by date (newest first) and take last 7 entries - keep newest to oldest for display
        const sortedLogs = logs
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 7);
        
        setWeightLogs(sortedLogs);
      }
    } catch (error) {
      console.error('Error fetching weight data:', error);
    }
  };

  useEffect(() => {
    fetchWeightData();
  }, [user]);

  const handleSaveWeights = async () => {
    const newTarget = parseFloat(newTargetWeight);
    const newCurrent = parseFloat(newCurrentWeight);

    if ((newTargetWeight && (!newTarget || newTarget <= 0)) || 
        (newCurrentWeight && (!newCurrent || newCurrent <= 0))) {
      Alert.alert('Invalid Input', 'Please enter valid weight values.');
      return;
    }

    try {
      setLoading(true);
      const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

      // Update target weight if changed
      if (newTargetWeight && newTarget !== targetWeight) {
        const healthProfileRef = doc(db, 'users', user.uid, 'private', 'health_profile');
        
        // Get existing Goal data first
        const healthProfileSnap = await getDoc(healthProfileRef);
        const existingGoal = healthProfileSnap.exists() ? healthProfileSnap.data()?.Goal?.items : {};
        
        await updateDoc(healthProfileRef, {
          'Goal.items': {
            ...existingGoal,
            targetWeight: newTarget,
            updatedAt: new Date().toISOString()
          }
        });

        setTargetWeight(newTarget);
      }

      // Update current weight if changed
      if (newCurrentWeight && newCurrent !== currentWeight) {
        // Update user profile
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          'profile.weightKg': newCurrent
        });

        setCurrentWeight(newCurrent);
      }

      // Save to weight_log if either weight changed
      if ((newCurrentWeight && newCurrent !== currentWeight) || (newTargetWeight && newTarget !== targetWeight)) {
        const weightLogRef = doc(db, 'users', user.uid, 'private', 'health_profile', 'weight_log', 'main');
        const weightLogSnap = await getDoc(weightLogRef);

        let existingLogs = [];
        if (weightLogSnap.exists()) {
          existingLogs = weightLogSnap.data()?.logs || [];
        }

        // Create new log entry
        const newLog = {
          date: currentDate,
          currentWeight: newCurrentWeight ? newCurrent : currentWeight,
          targetWeight: newTargetWeight ? newTarget : targetWeight,
        };

        // Check if log for today already exists
        const todayLogIndex = existingLogs.findIndex(log => log.date === currentDate);
        
        if (todayLogIndex >= 0) {
          // Update today's log
          existingLogs[todayLogIndex] = newLog;
        } else {
          // Add new log
          existingLogs.push(newLog);
        }

        // Sort logs by date (newest first)
        existingLogs.sort((a, b) => new Date(b.date) - new Date(a.date));

        await updateDoc(weightLogRef, {
          logs: existingLogs
        });

        // Re-fetch weight logs to update the chart immediately
        const updatedLogs = existingLogs
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 7);
        setWeightLogs(updatedLogs);
      }

      setModalVisible(false);
      setNewTargetWeight('');
      setNewCurrentWeight('');
      
      // Re-fetch all data to ensure charts are updated
      await fetchWeightData();
      
      Alert.alert('Success', 'Weight data updated successfully!');
    } catch (error) {
      console.error('Error saving weight data:', error);
      Alert.alert('Error', 'Failed to save weight data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = () => {
    setNewTargetWeight(targetWeight > 0 ? targetWeight.toString() : '');
    setNewCurrentWeight(currentWeight > 0 ? currentWeight.toString() : '');
    setModalVisible(true);
  };

  // Chart data for bar chart (current snapshot)
  const chartData = {
    labels: ['Target', 'Current'],
    datasets: [
      {
        data: [targetWeight || 0, currentWeight || 0]
      }
    ]
  };

  // Chart data for line chart (historical trend)
  const lineChartData = (() => {
    if (weightLogs.length === 0) {
      return {
        labels: ['--'],
        datasets: [
          {
            data: [0],
            color: (opacity = 1) => theme.altAccent || '#FF6B35',
            strokeWidth: 3
          },
          {
            data: [0],
            color: (opacity = 1) => theme.primaryDark || '#4ECDC4',
            strokeWidth: 3
          }
        ]
      };
    }

    // Reverse the logs to show latest on the right (newest first in array becomes rightmost on chart)
    const reversedLogs = [...weightLogs].reverse();

    // Get all weight values to calculate min/max
    const allWeights = reversedLogs.flatMap(log => [log.targetWeight || 0, log.currentWeight || 0]);
    const minWeight = Math.min(...allWeights);
    const maxWeight = Math.max(...allWeights);

    // Add 10kg padding above and below
    const paddingTop = maxWeight + 10;
    const paddingBottom = Math.max(0, minWeight - 10); // Don't go below 0

    const targetData = reversedLogs.map(log => log.targetWeight || 0);
    const currentData = reversedLogs.map(log => log.currentWeight || 0);

    return {
      labels: reversedLogs.map(log => {
        const date = new Date(log.date);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${month}/${day}`;
      }),
      datasets: [
        {
          data: targetData,
          color: (opacity = 1) => theme.altAccent || '#FF6B35',
          strokeWidth: 3
        },
        {
          data: currentData,
          color: (opacity = 1) => theme.primaryDark || '#4ECDC4',
          strokeWidth: 3
        },
        {
          // Hidden dataset for padding - sets y-axis range
          data: [paddingTop, paddingBottom],
          withDots: false,
          strokeWidth: 0,
          color: (opacity = 0) => 'transparent'
        }
      ]
    };
  })();

  return (
    
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Progress Tracker</Text>
          <Text style={styles.headerSubtitle}>Your weight journey</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: theme.altAccent + '15' }]}>
            <Text style={styles.statLabel}>Target</Text>
            <Text style={[styles.statValue, { color: theme.altAccent }]}>{targetWeight || '—'}</Text>
            <Text style={styles.statUnit}>kg</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.primaryDark + '15' }]}>
            <Text style={styles.statLabel}>Current</Text>
            <Text style={[styles.statValue, { color: theme.primaryDark }]}>{currentWeight || '—'}</Text>
            <Text style={styles.statUnit}>kg</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.accent + '15' }]}>
            <Text style={styles.statLabel}>Variance</Text>
            <Text style={[styles.statValue, { color: theme.accent }]}>
              {currentWeight && targetWeight 
                ? Math.abs(currentWeight - targetWeight).toFixed(1) 
                : '—'}
            </Text>
            <Text style={styles.statUnit}>kg</Text>
          </View>
        </View>

      {/* Bar Chart Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Current Snapshot</Text>
          <View style={styles.sectionIcon}>
            <MaterialIcons name="camera" size={24} color={theme.text} />
          </View>
        </View>
        <View style={styles.chartCard}>
          <BarChart
            data={chartData}
            width={320}
            height={380}
            yAxisSuffix=" kg"
            chartConfig={{
              backgroundColor: theme.background,
              backgroundGradientFrom: theme.background,
              backgroundGradientTo: theme.background,
              decimalPlaces: 1,
              color: (opacity = 1, index) => {
                // Target bar in altAccent, Current bar in primaryDark
                return index === 0 ? theme.altAccent : theme.primaryDark;
              },
              labelColor: (opacity = 1) => theme.text,
              style: {
                borderRadius: 16,
              },
              propsForBackgroundLines: {
                strokeDasharray: '',
                stroke: theme.border || '#333',
              },
              barPercentage: 2,
            }}
            style={styles.chart}
            showValuesOnTopOfBars={true}
            fromZero={true}
            withInnerLines={true}
            withVerticalLabels={true}
            withHorizontalLabels={true}
          />
        </View>
      </View>
      
      {/* Line Chart Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Progress Over Time</Text>
          <View style={styles.sectionIcon}>
            <MaterialIcons name="auto-graph" size={24} color={theme.text} />
          </View>
        </View>
      
      {weightLogs.length > 0 ? (
        <View style={styles.chartCard}>
          <LineChart
            data={lineChartData}
            width={320}
            height={200}
            yAxisSuffix=" kg"
            chartConfig={{
              backgroundColor: theme.background,
              backgroundGradientFrom: theme.background,
              backgroundGradientTo: theme.background,
              decimalPlaces: 1,
              color: (opacity = 1) => theme.background,
              labelColor: (opacity = 1) => theme.text,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '5',
                strokeWidth: '2',
              },
              propsForBackgroundLines: {
                strokeDasharray: '',
                stroke: theme.border || '#e0e0e0',
              }
            }}
            style={styles.chart}
            fromZero={false}
            withInnerLines={true}
            withVerticalLabels={true}
            withHorizontalLabels={true}
            withVerticalLines={false}
          />
          
          {/* Legend */}
          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: theme.altAccent || '#FF6B35' }]} />
              <Text style={styles.legendText}>Target</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: theme.primaryDark || '#4ECDC4' }]} />
              <Text style={styles.legendText}>Current</Text>
            </View>
          </View>

          {/* Goal Progress Message */}
          {currentWeight > 0 && targetWeight > 0 && (
            <View style={styles.goalMessageContainer}>
              <Text style={styles.goalMessageText}>
                {currentWeight < targetWeight 
                  ? `${(targetWeight - currentWeight).toFixed(1)} kg more to gain to reach your goal` 
                  : currentWeight > targetWeight
                  ? `${(currentWeight - targetWeight).toFixed(1)} kg more to lose to reach your goal`
                  : 'You have reached your goal weight! 🎉'}
              </Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.noDataCard}>
          <Text style={styles.noDataIcon}>📊</Text>
          <Text style={styles.noDataText}>No weight history yet</Text>
          <Text style={styles.noDataSubtext}>Start logging your weights to see progress!</Text>
        </View>
      )}
      </View>

      <View style={styles.placeholder2}></View>
      </ScrollView>

      {/* Floating Edit Button */}
      <View style={styles.floatingButtonContainer}>
        <TouchableOpacity style={styles.floatingButton} onPress={openEditModal}>
          <MaterialIcons name="edit" size={24} color={theme.text} />
          <Text style={styles.floatingButtonText}>Edit Weights</Text>
        </TouchableOpacity>
      </View>

      

      {/* Modal for Editing Weights */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Weights</Text>
            
            <Text style={styles.modalLabel}>Current Weight (kg)</Text>
            <TextInput
              style={styles.modalInput}
              value={newCurrentWeight}
              onChangeText={setNewCurrentWeight}
              placeholder="Enter current weight"
              placeholderTextColor={theme.textSecondary}
              keyboardType="numeric"
            />

            <Text style={styles.modalLabel}>Target Weight (kg)</Text>
            <TextInput
              style={styles.modalInput}
              value={newTargetWeight}
              onChangeText={setNewTargetWeight}
              placeholder="Enter target weight"
              placeholderTextColor={theme.textSecondary}
              keyboardType="numeric"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  setNewTargetWeight('');
                  setNewCurrentWeight('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton, loading && styles.disabledButton]}
                onPress={handleSaveWeights}
                disabled={loading}
              >
                <Text style={styles.saveButtonText}>
                  {loading ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: theme.background,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  backText: {
    color: theme.text,
    fontSize: 20,
    fontWeight: '600',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: theme.textSecondary,
  },
  placeholder: {
    width: 40,
  },
  placeholder2: {
    height: 100,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  statLabel: {
    fontSize: 12,
    color: theme.textSecondary,
    marginBottom: 8,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statUnit: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.background,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,

  },
  chartCard: {
    backgroundColor: theme.background,
    borderRadius: 20,
    padding: 20,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  chart: {
    borderRadius: 16,
    marginVertical: 0,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    gap: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 13,
    color: theme.text,
    fontWeight: '500',
  },
  goalMessageContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    alignItems: 'center',
  },
  goalMessageText: {
    fontSize: 13,
    color: theme.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  noDataCard: {
    backgroundColor: theme.surface,
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  noDataIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  noDataText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 8,
  },
  noDataSubtext: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
  },
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
  },
  floatingButton: {
    flexDirection: 'row',
    backgroundColor: theme.primary,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    gap: 10,
  },
  floatingButtonIcon: {
    fontSize: 20,
  },
  floatingButtonText: {
    color: theme.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.background,
    borderRadius: 24,
    padding: 28,
    width: '85%',
    maxWidth: 400,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 24,
    textAlign: 'center',
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalInput: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: theme.text,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  cancelButtonText: {
    color: theme.text,
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: theme.primary,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.6,
  },
});
