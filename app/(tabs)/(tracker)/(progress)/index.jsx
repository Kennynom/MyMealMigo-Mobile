// app/(tabs)/(tracker)/(progress)/index.jsx
import { db } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';
import { ThemeContext } from '@/context/ThemeContext';
import { router } from 'expo-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useContext, useEffect, useState } from 'react';
import { Alert, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { BarChart } from 'react-native-chart-kit';

export default function ProgressTrackerScreen() {
  const { theme } = useContext(ThemeContext);
  const { user } = useAuth();
  const [currentWeight, setCurrentWeight] = useState(0);
  const [targetWeight, setTargetWeight] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [newTargetWeight, setNewTargetWeight] = useState('');
  const [loading, setLoading] = useState(false);

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
      } catch (error) {
        console.error('Error fetching weight data:', error);
      }
    };

    fetchWeightData();
  }, [user]);

  const handleSaveTargetWeight = async () => {
    const newTarget = parseFloat(newTargetWeight);

    if (!newTarget || newTarget <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid target weight.');
      return;
    }

    try {
      setLoading(true);
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
      setModalVisible(false);
      setNewTargetWeight('');
      Alert.alert('Success', 'Target weight updated successfully!');
    } catch (error) {
      console.error('Error saving target weight:', error);
      Alert.alert('Error', 'Failed to save target weight. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = () => {
    setNewTargetWeight(targetWeight > 0 ? targetWeight.toString() : '');
    setModalVisible(true);
  };

  // Chart data
  const chartData = {
    labels: ['Target', 'Current'],
    datasets: [
      {
        data: [targetWeight || 0, currentWeight || 0]
      }
    ]
  };

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

      {/* Combined Bar Chart */}
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

      {/* Edit Target Weight Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.editButton} onPress={openEditModal}>
          <Text style={styles.editButtonText}>Edit Target Weight</Text>
        </TouchableOpacity>
      </View>

      {/* Modal for Editing Target Weight */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Target Weight</Text>
            
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
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton, loading && styles.disabledButton]}
                onPress={handleSaveTargetWeight}
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
});
