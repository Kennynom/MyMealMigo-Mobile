import { useRouter } from 'expo-router';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import React, { useState } from "react";
import { Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export function LoginForm({ onSuccess }: { onSuccess?: () => void }) {
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
                    <Text style={styles.logo}>MyMealMigo</Text>
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
                            placeholderTextColor="#9ca3af"
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
                            placeholderTextColor="#9ca3af"
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
                            <TouchableOpacity style={styles.loginButton} onPress={() => router.push({ pathname: '/(auth)/signup' } as any)}>
                                <Text style={styles.loginButtonText}>Sign Up</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity style={styles.guestButton} onPress={() => onSuccess?.()}>
                                <Text style={styles.guestButtonText}>Login as Guest</Text>
                            </TouchableOpacity>
                        </>
                        
                    ) : (
                        <></>
                    )}

                </View>
                
                {Platform.OS === 'web' ? (
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>
                            For admin and nutritionist access only
                        </Text>
                    </View>
                ) : (
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>
                            Terms of Service | Privacy Policy
                        </Text>
                        <Text style={styles.footerText}>
                            © 2025 MyMealMigo
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
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
        marginBottom: 32,
    },
    logo: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#059669',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center',
    },
    form: {
        gap: 20,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 4,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ffffff',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: '#1f2937',
        backgroundColor: '#ffffff',
        ...Platform.select({
            web: {
                outlineStyle: 'none',
                borderColor: '#ffffff',
                ':focus': {
                    borderColor: '#059669',
                    outlineStyle: 'none',
                },
            },
        }),
    },
    inputError: {
        borderColor: '#ef4444',
    },
    errorText: {
        color: '#ef4444',
        fontSize: 14,
        textAlign: 'center',
        marginTop: -8,
    },
    loginButton: {
        backgroundColor: '#059669',
        borderRadius: 8,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    loginButtonDisabled: {
        backgroundColor: '#9ca3af',
    },
    loginButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    footer: {
        marginTop: 24,
        paddingTop: 24,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        color: '#9ca3af',
        textAlign: 'center',
    },
    guestLoginText: {
        marginTop: 16,
    },
    guestButton: {
        marginTop: 12,
        backgroundColor: 'transparent',
        alignItems: 'center',
        paddingVertical: 12,
    },
    guestButtonText: {
        color: '#374151',
        fontSize: 16,
    },
});