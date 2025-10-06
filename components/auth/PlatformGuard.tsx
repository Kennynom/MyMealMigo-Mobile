import { useAuth } from '@/context/AuthContext';
import React from "react";
import { Platform, StyleSheet, Text, View } from 'react-native';

interface PlatformGuardProps {
    children: React.ReactNode;
}

export function PlatformGuard({ children }: PlatformGuardProps) {
    const { user, loading, canAccessWeb, canAccessMobile, userRole } = useAuth();

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }

    // WEB PLATFORM - Show home page by default, admin features available after login
    if (Platform.OS === 'web') {
        // Always show the home page content for web users
        // Admin/nutritionist features will be conditionally shown within components
        return <>{children}</>;
    }

    // MOBILE PLATFORM - Guests, free, and premium users allowed
    if (!canAccessMobile && user) {
        return (
            <View style={styles.accessDeniedContainer}>
                <Text style={styles.accessDeniedTitle}>Access Restricted</Text>
                <Text style={styles.accessDeniedText}>
                    Mobile access is for guest, free, and premium users only.
                </Text>
                <Text style={styles.accessDeniedSubtext}>
                    Current role: {userRole}
                </Text>
                <Text style={styles.accessDeniedHint}>
                    Please use the web portal for admin/nutritionist features.
                </Text>
            </View>
        );
    }

    // Mobile users can access without login (guest mode) or with appropriate accounts
    return <>{children}</>;
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
    },
    loadingText: {
        fontSize: 18,
        color: '#58e221',
        fontWeight: '500',
    },
    accessDeniedContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        padding: 32,
    },
    accessDeniedTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ef4444',
        marginBottom: 16,
        textAlign: 'center',
    },
    accessDeniedText: {
        fontSize: 16,
        color: '#374151',
        textAlign: 'center',
        marginBottom: 12,
        lineHeight: 24,
    },
    accessDeniedSubtext: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
        marginBottom: 8,
    },
    accessDeniedHint: {
        fontSize: 14,
        color: '#9ca3af',
        textAlign: 'center',
        fontStyle: 'italic',
    },
});