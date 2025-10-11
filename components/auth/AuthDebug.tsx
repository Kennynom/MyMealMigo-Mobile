import { useAuth } from '@/context/AuthContext';
import { getAuth, signOut } from 'firebase/auth';
import React, { useState } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export function AuthDebug() {
    // Temporary toggle: set to true to show the debug overlay again.
    // Keep this file in the repo but disable the visual debug UI while testing.
    const ENABLE_AUTH_DEBUG = false;

    if (!ENABLE_AUTH_DEBUG) return null;

    const { user, userRole, isAdmin, isNutritionist, canAccessWeb, canAccessMobile, loading } = useAuth();
    const [isExpanded, setIsExpanded] = useState(false);

    const handleSignOut = async () => {
        try {
            const auth = getAuth();
            await signOut(auth);
        } catch (error) {
            console.error('Sign out error:', error);
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <TouchableOpacity 
                    style={styles.toggleButton}
                    onPress={() => setIsExpanded(!isExpanded)}
                >
                    <Text style={styles.toggleText}>
                        🔐 Auth Debug {isExpanded ? '▼' : '▶'} (Loading...)
                    </Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <TouchableOpacity 
                style={styles.toggleButton}
                onPress={() => setIsExpanded(!isExpanded)}
            >
                <Text style={styles.toggleText}>
                    🔐 Auth Debug {isExpanded ? '▼' : '▶'} ({user ? user.email : 'No user'})
                </Text>
            </TouchableOpacity>
            
            {isExpanded && (
            <>
                <View style={styles.infoCard}>
                    <Text style={styles.label}>Platform:</Text>
                    <Text style={styles.value}>{Platform.OS}</Text>
                </View>

                <View style={styles.infoCard}>
                    <Text style={styles.label}>User:</Text>
                    <Text style={styles.value}>{user ? user.email : 'Not logged in'}</Text>
                </View>

                <View style={styles.infoCard}>
                    <Text style={styles.label}>User Role:</Text>
                    <Text style={[styles.value, styles.roleText]}>{userRole}</Text>
                </View>

                <View style={styles.infoCard}>
                    <Text style={styles.label}>Is Admin:</Text>
                    <Text style={[styles.value, isAdmin ? styles.greenText : styles.redText]}>
                        {isAdmin ? 'Yes' : 'No'}
                    </Text>
                </View>

                <View style={styles.infoCard}>
                    <Text style={styles.label}>Is Nutritionist:</Text>
                    <Text style={[styles.value, isNutritionist ? styles.greenText : styles.redText]}>
                        {isNutritionist ? 'Yes' : 'No'}
                    </Text>
                </View>

                <View style={styles.infoCard}>
                    <Text style={styles.label}>Can Access Web:</Text>
                    <Text style={[styles.value, canAccessWeb ? styles.greenText : styles.redText]}>
                        {canAccessWeb ? 'Yes' : 'No'}
                    </Text>
                </View>

                <View style={styles.infoCard}>
                    <Text style={styles.label}>Can Access Mobile:</Text>
                    <Text style={[styles.value, canAccessMobile ? styles.greenText : styles.redText]}>
                        {canAccessMobile ? 'Yes' : 'No'}
                    </Text>
                </View>

                {user && (
                    <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                        <Text style={styles.signOutText}>Sign Out</Text>
                    </TouchableOpacity>
                )}
            </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: Platform.OS === 'web' ? 20 : 50,
        right: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        padding: 16,
        borderRadius: 8,
        minWidth: 250,
        zIndex: 1000,
    },
    title: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center',
    },
    loadingText: {
        color: '#58e221',
        fontSize: 14,
        textAlign: 'center',
    },
    infoCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
        paddingVertical: 4,
    },
    label: {
        color: '#cccccc',
        fontSize: 12,
        flex: 1,
    },
    value: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '500',
        flex: 1,
        textAlign: 'right',
    },
    roleText: {
        color: '#58e221',
        fontWeight: 'bold',
    },
    greenText: {
        color: '#10b981',
    },
    redText: {
        color: '#ef4444',
    },
    signOutButton: {
        backgroundColor: '#ef4444',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 4,
        marginTop: 12,
        alignItems: 'center',
    },
    signOutText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '600',
    },
    toggleButton: {
        padding: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderRadius: 6,
        marginBottom: 8,
    },
    toggleText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
});