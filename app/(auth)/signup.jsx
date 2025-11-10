// app/(auth)/signup.jsx
import { db } from '@/lib/firebase';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  createUserWithEmailAndPassword,
  getAuth,
  sendEmailVerification,
} from 'firebase/auth';
import { doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const GREEN = '#58e221';
const GREEN_DARK = '#3bc40a';
const BLACK = '#000';
const WHITE = '#fff';
const DARK = '#0f172a';

export default function SignUpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Safely parse onboarding data if present
  const onboarding = useMemo(() => {
    try {
      return params && params.onboardingData
        ? JSON.parse(params.onboardingData)
        : null;
    } catch {
      return null;
    }
  }, [params]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const handleSignUp = async () => {
    setError('');
    setInfo('');

    if (!email || !password || !confirm) {
      setError('Please fill in all fields.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const auth = getAuth();
      const cred = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      const uid = cred.user.uid;

      // Fire off verification email (non-blocking)
      try {
        await sendEmailVerification(cred.user);
        setInfo(`Verification email sent to ${cred.user.email}.`);
      } catch (err) {
        console.warn('Verification email failed:', err);
      }

      // Build and save profile (private + public)
      const timestamps = {
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      const finalProfile = onboarding
        ? { ...onboarding, version: 1, completed: true, ...timestamps }
        : {
            version: 1,
            completed: false,
            fitness: {},
            parq: { hasRedFlags: false, notes: '' },
            ...timestamps,
          };

      const batch = writeBatch(db);
      const refPrivate = doc(db, 'users', uid, 'private', 'healthProfile');
      const refPublic = doc(db, 'users', uid, 'public', 'healthInformation');
      batch.set(refPrivate, finalProfile, { merge: true });
      batch.set(refPublic, finalProfile, { merge: true });
      await batch.commit();

      // Go to verification screen (then user will Sign In after verifying)
      router.replace({
        pathname: '/(auth)/verifyEmail',
        params: { email: cred.user.email || '' },
      });
    } catch (e) {
      console.error(e);
      const msg =
        e && e.code === 'permission-denied'
          ? 'We could not save your profile due to permissions. Please try again soon.'
          : e?.message || 'Sign up failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: GREEN }}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient
        colors={[GREEN, GREEN_DARK]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={s.wrap}
      >
        {/* App title */}
        <Text style={s.brand}>MYMEALMIGO</Text>

        {/* Sign-up card */}
        <View style={s.card}>
          <Text style={s.title}>Create Account</Text>
          <Text style={s.subtitle}>
            Join MyMealMigo and start your healthy journey!
          </Text>

          <TextInput
            style={[s.input, error ? s.inputErr : null]}
            placeholder="Email address"
            placeholderTextColor="#9ca3af"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={[s.input, error ? s.inputErr : null]}
            placeholder="Password"
            placeholderTextColor="#9ca3af"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <TextInput
            style={[s.input, error ? s.inputErr : null]}
            placeholder="Confirm password"
            placeholderTextColor="#9ca3af"
            secureTextEntry
            value={confirm}
            onChangeText={setConfirm}
          />

          {error ? <Text style={s.error}>{error}</Text> : null}
          {info ? <Text style={s.info}>{info}</Text> : null}

          <TouchableOpacity
            style={[s.btnPrimary, loading ? s.disabled : null]}
            onPress={handleSignUp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={WHITE} />
            ) : (
              <Text style={s.btnPrimaryTxt}>Sign Up</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={s.footer}>
          Terms of Service | Privacy Policy{'\n'}© 2025 MyMealMigo
        </Text>
      </LinearGradient>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, paddingHorizontal: 24, justifyContent: 'space-between' },

  brand: {
    marginTop: 28,
    fontSize: 44,
    fontWeight: Platform.select({ ios: '900', android: 'bold' }),
    letterSpacing: 1,
    color: BLACK,
    textAlign: 'center'
  },

  card: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },

  title: { fontSize: 24, fontWeight: '900', color: DARK },
  subtitle: { color: '#475569', marginBottom: 16, fontSize: 15 },

  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: DARK,
    marginBottom: 12,
  },
  inputErr: { borderColor: '#ef4444' },

  error: {
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
  },
  info: {
    color: '#059669',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
  },

  btnPrimary: {
    backgroundColor: BLACK,
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  btnPrimaryTxt: { color: WHITE, fontWeight: '800', fontSize: 16 },
  disabled: { opacity: 0.6 },

  footer: {
    textAlign: 'center',
    color: DARK,
    opacity: 0.7,
    marginBottom: 16,
    fontSize: 12,
  },
});
