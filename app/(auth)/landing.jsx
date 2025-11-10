// app/(auth)/landing.jsx
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useRef } from 'react';
import {
    Animated,
    Dimensions,
    Platform,
    Pressable,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from 'react-native';

const GREEN = '#58e221';
const GREEN_DARK = '#3bc40a';
const BLACK = '#000';
const WHITE = '#fff';
const { width, height } = Dimensions.get('window');
const rf = (n) => Math.round((width / 375) * n); // responsive font baseline

function ScaleButton({ children, style, onPress, bg = BLACK, textColor = WHITE, label }) {
  const anim = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={[{ transform: [{ scale: anim }] }, style]}>
      <Pressable
        onPressIn={() => Animated.spring(anim, { toValue: 0.98, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(anim, { toValue: 1, useNativeDriver: true }).start()}
        onPress={onPress}
        android_ripple={{ color: '#ffffff25' }}
        style={[styles.btnBase, { backgroundColor: bg }]}
        accessibilityRole="button"
        accessibilityLabel={label || (typeof children === 'string' ? children : 'action')}
        hitSlop={10}
      >
        <Text style={[styles.btnText, { color: textColor }]}>{children}</Text>
      </Pressable>
    </Animated.View>
  );
}

function BenefitRow({ icon, text }) {
  return (
    <View style={styles.row}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={22} color="#0f172a" />
      </View>
      <Text style={styles.rowText}>{text}</Text>
    </View>
  );
}

export default function LandingScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient
        colors={[GREEN, GREEN_DARK]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={styles.wrap}
      >
        {/* decorative blobs */}
        <View style={[styles.blob, { top: -70, right: -40, opacity: 0.16 }]} />
        <View style={[styles.blob, { bottom: -90, left: -60, width: 240, height: 240, borderRadius: 120, opacity: 0.12 }]} />

        {/* brand */}
        <View style={[styles.section, { marginTop: height * 0.06 }]}>
          <Text style={styles.brand}>MYMEALMIGO</Text>
        </View>

        {/* benefits with icons */}
        <View style={styles.benefitsCard}>
          <BenefitRow icon="sparkles-outline" text="Guided by AI" />
          <BenefitRow icon="flame-outline" text="Calories Track" />
          <BenefitRow icon="trophy-outline" text="Reach your goals" />
        </View>

        {/* CTAs */}
        <View style={[styles.section, { marginBottom: height * 0.06 }]}>
          <ScaleButton
            onPress={() => router.push('/(auth)/signup')} 
            style={{ marginBottom: 14 }}
            bg={BLACK}
            textColor={WHITE}
            label="Get Started"
          >
            Get Started
          </ScaleButton>

          <ScaleButton
            onPress={() => router.push('/(auth)/login')}
            bg={WHITE}
            textColor={BLACK}
            label="Sign In"
          >
            Sign In
          </ScaleButton>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: GREEN },
  wrap: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  section: { width: '100%' },

  brand: {
    fontSize: rf(44),
    fontWeight: Platform.select({ ios: '900', android: 'bold' }),
    letterSpacing: 1,
    color: BLACK,
  },

  // card that holds benefits
  benefitsCard: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 22,
    paddingVertical: 18,
    paddingHorizontal: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 6,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  rowText: {
    color: '#0f172a',
    fontSize: rf(20),
    fontWeight: '800',
  },

  blob: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#fff',
  },

  btnBase: {
    borderRadius: 28,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  btnText: { fontSize: rf(22), fontWeight: '800' },
});
