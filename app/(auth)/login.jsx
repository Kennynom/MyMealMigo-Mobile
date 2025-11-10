import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  getAuth,
  reload,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import React, { useState } from 'react';
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
const DARK = '#0f172a';
const BLACK = '#000';
const WHITE = '#fff';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const handleLogin = async () => {
    setError('');
    setInfo('');
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setLoading(true);
    try {
      const auth = getAuth();
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);

      await reload(cred.user);
      if (!cred.user.emailVerified) {
        try {
          await sendEmailVerification(cred.user);
          setInfo(`Verification link sent to ${cred.user.email}. Please verify then sign in again.`);
        } catch {
          setInfo('Please verify your email before signing in.');
        }
        await signOut(auth);
        return;
      }
      router.replace('/(tabs)/(home)');
    } catch (e) {
      setError(e?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: GREEN }}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient colors={[GREEN, GREEN_DARK]} style={s.wrap} start={{x:0.15,y:0}} end={{x:0.85,y:1}}>
        <Text style={s.brand}>MYMEALMIGO</Text>

        <View style={s.card}>
          <Text style={s.title}>Sign In</Text>
          <Text style={s.sub}>Welcome back! Let’s continue your journey.</Text>

          <TextInput
            style={[s.input, error && s.inputErr]}
            placeholder="Email"
            placeholderTextColor="#9ca3af"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={[s.input, error && s.inputErr]}
            placeholder="Password"
            placeholderTextColor="#9ca3af"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {!!error && <Text style={s.errTxt}>{error}</Text>}
          {!!info && <Text style={s.infoTxt}>{info}</Text>}

          <TouchableOpacity style={[s.primary, loading && s.disabled]} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color={WHITE} /> : <Text style={s.primaryTxt}>Sign In</Text>}
          </TouchableOpacity>

        
        </View>

        <Text style={s.footer}>Terms of Service | Privacy Policy{'\n'}© 2025 MyMealMigo</Text>
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
    padding: 22,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  title: { fontSize: 22, fontWeight: '800', color: DARK, marginBottom: 6 },
  sub: { color: '#475569', marginBottom: 16 },
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
  primary: { backgroundColor: BLACK, borderRadius: 28, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  primaryTxt: { color: WHITE, fontWeight: '800', fontSize: 16 },
  disabled: { opacity: 0.6 },
  secondary: { backgroundColor: WHITE, borderRadius: 28, paddingVertical: 14, alignItems: 'center', marginTop: 10 },
  secondaryTxt: { color: DARK, fontWeight: '700' },
  errTxt: { color: '#ef4444', textAlign: 'center', marginBottom: 6 },
  infoTxt: { color: '#059669', textAlign: 'center', marginBottom: 6 },
  footer: { textAlign: 'center', color: DARK, opacity: 0.7, marginBottom: 16, fontSize: 12 },
});
