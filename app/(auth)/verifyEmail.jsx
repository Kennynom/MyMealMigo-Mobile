import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const GREEN = '#58e221';
const GREEN_DARK = '#3bc40a';
const BLACK = '#000';
const WHITE = '#fff';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: GREEN }}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient
        colors={[GREEN, GREEN_DARK]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={s.wrap}
      >
        <Text style={s.brand}>MYMEALMIGO</Text>

        <View style={s.card}>
          <Text style={s.title}>Verify Your Email</Text>
          <Text style={s.sub}>
            We’ve sent a verification link to{'\n'}
            <Text style={s.email}>{email}</Text>
          </Text>

          <Text style={s.body}>
            Please check your inbox (and spam folder) to verify your account.
            Once verified, you can sign in to continue.
          </Text>

          <TouchableOpacity
            style={s.btnPrimary}
            onPress={() => router.replace('/(auth)/login')}
          >
            <Text style={s.btnPrimaryTxt}>Go to Sign In</Text>
          </TouchableOpacity>
        </View>

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
    fontWeight: '900',
    letterSpacing: 1,
    color: BLACK,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  title: { fontSize: 24, fontWeight: '900', color: BLACK, marginBottom: 8 },
  sub: { fontSize: 16, color: '#475569', marginBottom: 12, textAlign: 'center' },
  email: { fontWeight: '700', color: '#111827' },
  body: {
    color: '#374151',
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  btnPrimary: {
    backgroundColor: BLACK,
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnPrimaryTxt: { color: WHITE, fontWeight: '800', fontSize: 16 },
  footer: {
    textAlign: 'center',
    color: '#0f172a',
    opacity: 0.7,
    marginBottom: 16,
    fontSize: 12,
  },
});
