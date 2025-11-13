import { db } from '@/config/firebase';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { createUserWithEmailAndPassword, deleteUser, getAuth } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import React, { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const GREEN = '#58e221';
const GREEN_DARK = '#3bc40a';
const BLACK = '#000';
const WHITE = '#fff';
const { width } = Dimensions.get('window');
const rf = (n: number) => Math.round((width / 375) * n);

function ScaleButton({ children, onPress, disabled, bg = BLACK, textColor = WHITE }: any) {
  const anim = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={{ transform: [{ scale: anim }] }}>
      <Pressable
        onPressIn={() => !disabled && Animated.spring(anim, { toValue: 0.98, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(anim, { toValue: 1, useNativeDriver: true }).start()}
        onPress={onPress}
        disabled={disabled}
        android_ripple={{ color: '#ffffff25' }}
        style={[styles.btnBase, { backgroundColor: disabled ? '#9ca3af' : bg }]}
      >
        <Text style={[styles.btnText, { color: textColor }]}>{children}</Text>
      </Pressable>
    </Animated.View>
  );
}

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
      allergies: { items: [], other: '', completed: true },
      conditions: { items: [], other: '' },
      consent: { healthConsentAt: new Date().toISOString(), shareWithCoach: false },
      constraints: {
        heat: true,
        hiImpact: true,
        notes: 'Diet: no_preference | Cooking time: 10-20 | Budget: medium',
        overheadLifts: true
      },
      createdAt: serverTimestamp(),
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
    };

    try {
      console.log('Writing health_profile to', profileRef.path);
      await setDoc(profileRef, profileData);
    } catch (err) {
      console.error('Failed to write health_profile:', err, 'profileRef:', profileRef?.path);
      throw err;
    }
  };

  const initializeCalorieLogs = async (uid: string) => {
    const healthProfileDocRef = doc(db, 'users', uid, 'private', 'health_profile');
    const calorieLogDocRef = doc(healthProfileDocRef, 'calorie_logs', 'main');
    const weightLogDocRef = doc(healthProfileDocRef, 'weight_log', 'main');
    const reflectionLogDocRef = doc(healthProfileDocRef, 'reflection_log', 'main');
    const mealLogDocRef = doc(healthProfileDocRef, 'meal_logs', 'main');

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

      const userDocRef = doc(db, 'users', uid);
      await setDoc(userDocRef, {
        email,
        name: name || '',
        role: 'free',
        accountStatus: 'Active',
        createdAt: serverTimestamp(),
      });

      await seedHealthProfile(uid);
      await initializeCalorieLogs(uid);

      onSuccess?.();
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.message || 'Signup failed');

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
    <LinearGradient
      colors={[GREEN, GREEN_DARK]}
      start={{ x: 0.15, y: 0 }}
      end={{ x: 0.85, y: 1 }}
      style={styles.gradient}
    >
      {/* Decorative blobs */}
      <View style={[styles.blob, { top: -50, right: -40, opacity: 0.12 }]} />
      <View style={[styles.blob, { bottom: -60, left: -50, width: 200, height: 200, borderRadius: 100, opacity: 0.1 }]} />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Brand Header */}
        <View style={styles.brandSection}>
          <Text style={styles.brand}>MYMEALMIGO</Text>
          <Text style={styles.subtitle}>Start Your Journey</Text>
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          <Text style={styles.title}>Create an account</Text>

          <View style={styles.form}>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Name"
                placeholderTextColor="#94a3b8"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#94a3b8"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#94a3b8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <View style={styles.inputWrapper}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor="#94a3b8"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>

            {error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={18} color="#dc2626" style={{ marginRight: 8 }} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <ScaleButton
              onPress={handleSignUp}
              disabled={loading}
              bg={BLACK}
              textColor={WHITE}
            >
              {loading ? 'Creating. . .' : 'Get Started'}
            </ScaleButton>
          </View>
        </View>


      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#fff',
  },
  container: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  brandSection: {
    marginBottom: 32,
    alignItems: 'center',
  },
  brand: {
    fontSize: rf(32),
    fontWeight: Platform.select({ ios: '900', android: 'bold' }),
    letterSpacing: 0.5,
    color: BLACK,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: rf(16),
    fontWeight: '700',
    color: BLACK,
    opacity: 0.7,
  },
  formCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 22,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  title: {
    fontSize: rf(22),
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 20,
  },
  form: {
    gap: 14,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: rf(16),
    color: '#0f172a',
    fontWeight: '600',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    borderColor: '#fca5a5',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  errorText: {
    color: '#dc2626',
    fontSize: rf(14),
    fontWeight: '600',
    flex: 1,
  },
  btnBase: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  btnText: {
    fontSize: rf(18),
    fontWeight: '800',
  },
  benefitsPreview: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 16,
    padding: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  benefitIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitText: {
    color: '#0f172a',
    fontSize: rf(15),
    fontWeight: '700',
  },
});