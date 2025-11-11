import { ThemeContext } from '@/context/ThemeContext';
import { useRouter } from 'expo-router';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import React, { useContext, useState } from "react";
import { Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export function LoginForm({ onSuccess }: { onSuccess?: () => void }) {
    const { theme } = useContext(ThemeContext) as any;
    const styles = createStyles(theme);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async () => {
        if (!email || !password) {
            setError('Please enter both email and password');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const auth = getAuth();
            await signInWithEmailAndPassword(auth, email, password);
            onSuccess?.();
        } catch (error: any) {
            console.error('Login error:', error);
            setError(error.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const router = useRouter();

    return (
        <View style={styles.container}>
            <View style={styles.loginCard}>
                <View style={styles.header}>
                    <Text style={styles.subtitle}>Your Personal Meal Assistant</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email Address</Text>
                        <TextInput
                            style={[styles.input, error ? styles.inputError : {}]}
                            value={email}
                            onChangeText={setEmail}
                            placeholder="Enter your email"
                            placeholderTextColor={theme.textSecondary}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoComplete="email"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Password</Text>
                        <TextInput
                            style={[styles.input, error ? styles.inputError : {}]}
                            value={password}
                            onChangeText={setPassword}
                            placeholder="Enter your password"
                            placeholderTextColor={theme.textSecondary}
                            secureTextEntry
                            autoComplete="password"
                        />
                    </View>

                    {error ? (
                        <Text style={styles.errorText}>{error}</Text>
                    ) : null}

                    <TouchableOpacity
                        style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        <Text style={styles.loginButtonText}>
                            {loading ? 'Signing In...' : 'Sign In'}
                        </Text>
                    </TouchableOpacity>

                    {Platform.OS !== 'web' ? (
                        <>
                            <TouchableOpacity style={styles.signupButton} onPress={() => router.push({ pathname: '/(auth)/signup' } as any)}>
                                <Text style={styles.signupButtonText}>Sign Up</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity style={styles.guestButton} onPress={() => onSuccess?.()}>
                                <Text style={styles.guestButtonText}>Login as Guest</Text>
                            </TouchableOpacity>
                        </>
                        
                    ) : (
                        <></>
                    )}

                </View>
            </View>
        </View>
    );
}

const createStyles = (theme: any) => StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loginCard: {
        width: '100%',
    },
    header: {
        alignItems: 'center',
        marginBottom: 28,
    },
    subtitle: {
        fontSize: 15,
        color: theme.textSecondary,
        textAlign: 'center',
        fontWeight: '500',
    },
    form: {
        gap: 16,
    },
    inputGroup: {
        gap: 6,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.text,
        marginBottom: 4,
    },
    input: {
        borderWidth: 1,
        borderColor: theme.border,
        backgroundColor: theme.surface,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: theme.text,
        shadowColor: theme.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 3,
        elevation: 1,
    },
    inputError: {
        borderColor: theme.error,
    },
    errorText: {
        color: theme.error,
        fontSize: 13,
        textAlign: 'center',
        marginTop: -6,
    },
    loginButton: {
        backgroundColor: theme.primary,
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 8,
        shadowColor: theme.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    loginButtonDisabled: {
        backgroundColor: theme.textSecondary,
        opacity: 0.6,
    },
    loginButtonText: {
        color: theme.altText,
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.3,
    },
    signupButton: {
        backgroundColor: theme.secondary,
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 4,
        shadowColor: theme.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    signupButtonText: {
        color: theme.altText,
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.3,
    },
    guestButton: {
        marginTop: 12,
        backgroundColor: 'transparent',
        alignItems: 'center',
        paddingVertical: 12,
    },
    guestButtonText: {
        color: theme.textSecondary,
        fontSize: 15,
        fontWeight: '600',
    },
});