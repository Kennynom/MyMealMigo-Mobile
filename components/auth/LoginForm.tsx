import { LinearGradient } from "expo-linear-gradient";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import React, { useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    Platform,
    Pressable,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TextStyle,
    View,
    ViewStyle,
} from "react-native";

const GREEN = "#58e221";
const GREEN_DARK = "#3bc40a";
const BLACK = "#000";
const WHITE = "#fff";
const { width } = Dimensions.get("window");
const rf = (n: number): number => Math.round((width / 375) * n);

interface ScaleButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  bg?: string;
  textColor?: string;
  label?: string;
}

function ScaleButton({
  children,
  onPress,
  style,
  bg = BLACK,
  textColor = WHITE,
  label,
}: ScaleButtonProps) {
  const anim = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={[{ transform: [{ scale: anim }] }, style]}>
      <Pressable
        onPressIn={() =>
          Animated.spring(anim, { toValue: 0.98, useNativeDriver: true }).start()
        }
        onPressOut={() =>
          Animated.spring(anim, { toValue: 1, useNativeDriver: true }).start()
        }
        onPress={onPress}
        android_ripple={{ color: "#ffffff25" }}
        style={[styles.btnBase, { backgroundColor: bg }]}
        accessibilityRole="button"
        accessibilityLabel={label || (typeof children === "string" ? children : "action")}
        hitSlop={10}
      >
        <Text style={[styles.btnText, { color: textColor }]}>{children}</Text>
      </Pressable>
    </Animated.View>
  );
}

interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const handleLogin = async (): Promise<void> => {
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const auth = getAuth();
      await signInWithEmailAndPassword(auth, email.trim(), password);
      onSuccess?.();
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient
        colors={[GREEN, GREEN_DARK]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={styles.gradient}
      >
        {/* decorative blobs */}
        <View style={[styles.blob, { top: -70, right: -40, opacity: 0.16 }]} />
        <View
          style={[
            styles.blob,
            {
              bottom: -90,
              left: -60,
              width: 240,
              height: 240,
              borderRadius: 120,
              opacity: 0.12,
            },
          ]}
        />

        {/* brand */}
        <View style={styles.header}>
          <Text style={styles.brand}>MYMEALMIGO</Text>
          <Text style={styles.subtitle}>Your Personal Meal Assistant</Text>
        </View>

        {/* white card */}
        <View style={styles.card}>
          <View style={styles.field}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={[styles.input, error ? styles.inputError : null]}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor="#9ca3af"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={[styles.input, error ? styles.inputError : null]}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor="#9ca3af"
              secureTextEntry
              autoComplete="password"
            />
          </View>

          {!!error && <Text style={styles.errorText}>{error}</Text>}

          <ScaleButton
            onPress={handleLogin}
            bg={BLACK}
            textColor={WHITE}
            label="Sign In"
            style={{ marginTop: 8 }}
          >
            {loading ? "Signing In..." : "Sign In"}
          </ScaleButton>
        </View>

        {/* footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Terms of Service | Privacy Policy</Text>
          <Text style={styles.footerText}>© 2025 MyMealMigo</Text>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { 
    flex: 1, 
    backgroundColor: GREEN 
  } as ViewStyle,
  gradient: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    overflow: 'hidden',
  } as ViewStyle,
  header: {
    alignItems: "center",
    marginTop: 30,
  } as ViewStyle,
  brand: {
    fontSize: rf(38),
    fontWeight: Platform.select({ ios: "900", android: "bold" }) as TextStyle["fontWeight"],
    letterSpacing: 1,
    color: BLACK,
    textAlign: "center",
  } as TextStyle,
  subtitle: {
    fontSize: rf(16),
    color: "#0f172a",
    opacity: 0.8,
    marginTop: 4,
    textAlign: "center",
  } as TextStyle,
  blob: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#fff",
  } as ViewStyle,
  card: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 22,
    paddingVertical: 18,
    paddingHorizontal: 16,
    gap: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  } as ViewStyle,
  field: { 
    gap: 8 
  } as ViewStyle,
  label: {
    fontSize: rf(14),
    fontWeight: "700",
    color: "#0f172a",
  } as TextStyle,
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: rf(16),
    color: "#0f172a",
    backgroundColor: "#ffffff",
  } as TextStyle,
  inputError: { 
    borderColor: "#ef4444" 
  } as TextStyle,
  errorText: {
    color: "#ef4444",
    fontSize: rf(14),
    textAlign: "center",
    marginTop: -4,
  } as TextStyle,
  footer: {
    marginBottom: 32,
    alignItems: "center",
  } as ViewStyle,
  footerText: {
    fontSize: rf(12),
    color: "#0f172a",
    opacity: 0.75,
    textAlign: "center",
  } as TextStyle,
  btnBase: {
    borderRadius: 28,
    paddingVertical: 18,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  } as ViewStyle,
  btnText: { 
    fontSize: rf(20), 
    fontWeight: "800" 
  } as TextStyle,
});