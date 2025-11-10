import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  createUserWithEmailAndPassword,
  getAuth,
  sendEmailVerification,
  updateProfile,
} from 'firebase/auth';
import { doc, getFirestore, serverTimestamp, setDoc } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Modal,
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
const rf = (n: number): number => Math.round((width / 375) * n);

type SignUpModalProps = {
  isOpen: boolean;
  onClose: () => void;
  initialRole?: 'free' | 'premium';
};

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

export function SignUpModal({ isOpen, onClose }: SignUpModalProps) {
  const auth = getAuth();
  const db = getFirestore();
  const { user } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      onClose();
    }
  }, [isOpen, user, onClose]);

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const created = cred.user;

      if (name.trim()) {
        await updateProfile(created, { displayName: name.trim() });
      }

      await setDoc(
        doc(db, 'users', created.uid),
        {
          name: name.trim() || null,
          email: created.email,
          role: 'free',
          accountStatus: 'Active',
          createdAt: serverTimestamp(),
          subscription: {
            plan: 'free',
            active: false,
            startedAt: serverTimestamp(),
          },
        },
        { merge: true }
      );

      await sendEmailVerification(created);
      
      Alert.alert(
        'Account Created!',
        'Please check your email to verify your account.',
        [{ text: 'OK', onPress: onClose }]
      );
      
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={isOpen}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={[GREEN, GREEN_DARK]}
            start={{ x: 0.15, y: 0 }}
            end={{ x: 0.85, y: 1 }}
            style={styles.gradient}
          >
            {/* Decorative blob */}
            <View style={[styles.blob, { top: -40, right: -30, opacity: 0.12 }]} />
            
            <ScrollView 
              contentContainerStyle={styles.scrollContent} 
              showsVerticalScrollIndicator={false}
            >
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.brand}>MYMEALMIGO</Text>
                <Pressable onPress={onClose} style={styles.closeButton} hitSlop={10}>
                  <Ionicons name="close" size={28} color={BLACK} />
                </Pressable>
              </View>

              {/* Form Card */}
              <View style={styles.formCard}>
                <Text style={styles.title}>Create your free account</Text>
                
                <View style={styles.form}>
                  <View style={styles.inputGroup}>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="person-outline" size={20} color="#64748b" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                        placeholder="Your name"
                        placeholderTextColor="#94a3b8"
                        autoCapitalize="words"
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="mail-outline" size={20} color="#64748b" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        placeholder="you@example.com"
                        placeholderTextColor="#94a3b8"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="lock-closed-outline" size={20} color="#64748b" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        value={password}
                        onChangeText={setPassword}
                        placeholder="••••••••"
                        placeholderTextColor="#94a3b8"
                        secureTextEntry
                        autoComplete="password"
                      />
                    </View>
                  </View>

                  {error && (
                    <View style={styles.errorContainer}>
                      <Ionicons name="alert-circle" size={18} color="#dc2626" style={{ marginRight: 8 }} />
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  )}

                  <ScaleButton
                    onPress={handleSubmit}
                    disabled={loading}
                    bg={BLACK}
                    textColor={WHITE}
                  >
                    {loading ? 'Creating…' : 'Get Started'}
                  </ScaleButton>

                  <Text style={styles.footerText}>
                    Already have an account?{' '}
                    <Text style={styles.loginLink} onPress={onClose}>Sign In</Text>
                  </Text>
                </View>
              </View>
            </ScrollView>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    borderRadius: 24,
    width: '100%',
    maxWidth: 420,
    maxHeight: '85%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
  },
  gradient: {
    flex: 1,
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  brand: {
    fontSize: rf(24),
    fontWeight: Platform.select({ ios: '900', android: 'bold' }),
    letterSpacing: 0.5,
    color: BLACK,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
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
    marginBottom: 24,
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
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
  footerText: {
    textAlign: 'center',
    fontSize: rf(14),
    color: '#475569',
    marginTop: 16,
    fontWeight: '600',
  },
  loginLink: {
    color: BLACK,
    fontWeight: '800',
  },
});