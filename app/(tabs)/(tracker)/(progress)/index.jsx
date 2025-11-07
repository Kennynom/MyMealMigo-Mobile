// app/(tabs)/(tracker)/(progress)/index.jsx
import { db } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';
import { ThemeContext } from '@/context/ThemeContext';
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

  const styles = createStyles(theme);

  // Fetch weight data from Firebase
  useEffect(() => {
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
        }

        // Fetch weight logs from weight_log
        const weightLogRef = doc(db, 'users', user.uid, 'private', 'health_profile', 'weight_log', 'main');
        const weightLogSnap = await getDoc(weightLogRef);

        if (weightLogSnap.exists()) {
          const logData = weightLogSnap.data() || {};
          const logs = logData.logs || [];
          
          // Sort by date (newest first) and take last 7 entries
          const sortedLogs = logs
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 7)
            .reverse(); // Reverse so oldest comes first in chart
          
          setWeightLogs(sortedLogs);
        }
      } catch (error) {
        console.error('Error fetching weight data:', error);
      }
    };

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
      }

      setModalVisible(false);
      setNewTargetWeight('');
      setNewCurrentWeight('');
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
        ],
        legend: ['Target Weight', 'Current Weight']
      };
    }

    // Get all weight values to calculate min/max
    const allWeights = weightLogs.flatMap(log => [log.targetWeight || 0, log.currentWeight || 0]);
    const minWeight = Math.min(...allWeights);
    const maxWeight = Math.max(...allWeights);

    // Add 10kg padding above and below
    const paddingTop = maxWeight + 10;
    const paddingBottom = Math.max(0, minWeight - 10); // Don't go below 0

    const targetData = weightLogs.map(log => log.targetWeight || 0);
    const currentData = weightLogs.map(log => log.currentWeight || 0);

    return {
      labels: weightLogs.map(log => {
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
      ],
      legend: ['Target Weight', 'Current Weight']
    };
  })();

  return (
    
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Progress Tracker</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView>
      {/* Combined Bar Chart */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Current Weight Progress</Text>
      </View>
      <View style={styles.chartContainer}>
        <BarChart
          data={chartData}
          width={300}
          height={400}
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
          style={styles.combinedChart}
          showValuesOnTopOfBars={true}
          fromZero={true}
          withInnerLines={true}
          withVerticalLabels={true}
          withHorizontalLabels={true}
        />
      </View>
      
      {/* Weight Progress Over Time - Line Chart */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Weight Progress Over Time</Text>
      </View>
      
      {weightLogs.length > 0 ? (
        <View style={styles.chartContainer}>
          <LineChart
            data={lineChartData}
            width={360}
            height={220}
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
            style={styles.lineChart}
            bezier
            fromZero={false}
            withInnerLines={true}
            withVerticalLabels={true}
            withHorizontalLabels={true}
            withVerticalLines={false}
          />
          
          
        </View>
      ) : (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No weight history yet. Start logging your weights!</Text>
        </View>
      )}
      </ScrollView>

      {/* Edit Weights Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.editButton} onPress={openEditModal}>
          <Text style={styles.editButtonText}>Edit Weights</Text>
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
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  backButton: {
    padding: 5,
  },
  backText: {
    color: theme.text,
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text,
  },
  placeholder: {
    width: 50,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    width: '100%',
  },
  combinedChart: {
    borderRadius: 16,
    alignSelf: 'center',
  },
  cardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  weightCard: {
    backgroundColor: theme.surface,
    borderRadius: 30,
    padding: 16,
    alignItems: 'center',
    width: 150,
    borderWidth: 1,
    borderColor: theme.border,
  },
  colorIndicator: {
    width: 40,
    height: 8,
    borderRadius: 4,
    marginBottom: 12,
  },
  weightLabel: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 8,
    fontWeight: '500',
  },
  weightValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.text,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  editButton: {
    backgroundColor: theme.primaryDark,
    borderRadius: 15,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.background,
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.text,
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: theme.surface,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: theme.text,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
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
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.6,
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.text,
  },
  lineChart: {
    borderRadius: 16,
    marginVertical: 8,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  legendText: {
    fontSize: 14,
    color: theme.text,
    fontWeight: '500',
  },
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  noDataText: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
  },
});
