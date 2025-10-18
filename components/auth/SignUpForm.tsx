import { db } from '@/config/firebase';
import { createUserWithEmailAndPassword, deleteUser, getAuth } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export function SignUpForm({ onSuccess }: { onSuccess?: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const seedHealthProfile = async (uid: string) => {
    const profileRef = doc(db, 'users', uid, 'private', 'health_profile');

    const profileData = {
      // allergies
      allergies: { items: [], other: '', completed: true },
      // conditions
      conditions: { items: [], other: '' },
      // consent
      consent: { healthConsentAt: new Date().toISOString(), shareWithCoach: false },
      // constraints
      constraints: {
        heat: true,
        hiImpact: true,
        notes: 'Diet: no_preference | Cooking time: 10-20 | Budget: medium',
        overheadLifts: true
      },
      createdAt: serverTimestamp(),
      demographics: { birthYear: 2013, heightCm: 170, weightKg: 65 },
      doctorClearance: { hasClearance: false },
      fitness: { equipment: [], goal: 'muscle_gain', preferredIntensity: 'medium' },
      injuries: { items: [], notes: '' },
      medications: [],
      parqPlus: {
        notes: '',
        q1_chestPain: false,
        q2_dizziness: false,
        q3_boneJointProblem: false,
        q4_prescriptionMeds: false,
        q5_heartCondition: false,
        q6_bloodPressureIssue: false,
        q7_otherReason: false,
        riskLevel: 'low'
      },
      updatedAt: serverTimestamp(),
      version: 1
      // calorieTracker REMOVED
    };

    // debug log
    try {
      console.log('Writing health_profile to', profileRef.path);
      await setDoc(profileRef, profileData);
    } catch (err) {
      console.error('Failed to write health_profile:', err, 'profileRef:', profileRef?.path);
      throw err;
    }
  };

  // Initialize empty calorie logs
  const initializeCalorieLogs = async (uid: string) => {
    const healthProfileDocRef = doc(db, 'users', uid, 'private', 'health_profile');
    const calorieLogDocRef = doc(healthProfileDocRef, 'calorie_logs', 'main');        // Also initialize calorie_logs subcollection
    const weightLogDocRef = doc(healthProfileDocRef, 'weight_log', 'main');           // Also initialize weight_log subcollection
    const reflectionLogDocRef = doc(healthProfileDocRef, 'reflection_log', 'main');   // Also initialize reflection_log subcollection
    const mealLogDocRef = doc(healthProfileDocRef, 'meal_logs', 'main');               // Also initialize meal_logs subcollection

    await setDoc(calorieLogDocRef, {
      dailyLogs: [],
      weeklyLogs: [],
      monthlyLogs: [],
    });
    
    await setDoc(weightLogDocRef, {
      logs: [],
    });

    await setDoc(reflectionLogDocRef, {
      entries: [],
    });

    await setDoc(mealLogDocRef, {
      dailyLogs: [],
    });
  };

  const handleSignUp = async () => {
    setError('');
    if (!email || !password) return setError('Please enter email and password');
    if (password !== confirmPassword) return setError('Passwords do not match');
    setLoading(true);

    try {
      const auth = getAuth();
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCred.user.uid;

      // Create users/{uid} basic doc
      const userDocRef = doc(db, 'users', uid);
      await setDoc(userDocRef, {
        email,
        name: name || '',
        role: 'free',
        accountStatus: 'Active',
        createdAt: serverTimestamp(),
      });

      // Seed full health_profile (including updated intake structures) and initial calorie log
      await seedHealthProfile(uid);
      await initializeCalorieLogs(uid);

      onSuccess?.();
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.message || 'Signup failed');

      // If auth user exists but firestore failed, attempt rollback
      try {
        const auth = getAuth();
        if (auth.currentUser) await deleteUser(auth.currentUser);
      } catch (rollbackErr) {
        console.error('Rollback failed:', rollbackErr);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create an account</Text>

      <TextInput style={styles.input} placeholder="Name" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
      <TextInput style={styles.input} placeholder="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleSignUp} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Creating...' : 'Sign Up'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, marginBottom: 8 },
  button: { backgroundColor: '#059669', padding: 14, borderRadius: 8, alignItems: 'center' },
  buttonDisabled: { backgroundColor: '#9ca3af' },
  buttonText: { color: '#fff', fontWeight: '700' },
  error: { color: '#ef4444', marginBottom: 8 },
});
