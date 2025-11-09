import { db } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';
import { ThemeContext } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { deleteUser } from 'firebase/auth';
import { deleteDoc, doc, getDoc } from 'firebase/firestore';
import { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';


export default function ProfileScreen() {
    const { theme, colorScheme, toggleTheme } = useContext(ThemeContext);
    const styles = createStyles(theme);
    const { user, userRole, loading: authLoading, logout } = useAuth();
    const [userDoc, setUserDoc] = useState(null);
    const [profileDoc, setProfileDoc] = useState(null);
    const [loading, setLoading] = useState(true);

    // For logout navigation
    const handleLogout = async () => {
        try {
            await logout();
            router.replace('/(auth)/login');
        } catch (e) {
            // Optionally show error
        }
    };

    // Handler for delete account
    const handleDeleteAccount = async () => {
        if (!user) return;
        
        Alert.alert(
            'Delete Account',
            'Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data.',
            [
                {
                    text: 'Cancel',
                    style: 'cancel'
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // Delete Firestore data first
                            // Delete private health profile
                            const healthProfileRef = doc(db, 'users', user.uid, 'private', 'health_profile');
                            await deleteDoc(healthProfileRef);
                            
                            // Delete main user document
                            const userRef = doc(db, 'users', user.uid);
                            await deleteDoc(userRef);
                            
                            // Delete Firebase Auth user
                            await deleteUser(user);
                            
                            // Navigate to login
                            Alert.alert('Success', 'Your account has been deleted.');
                            router.replace('/(auth)/login');
                        } catch (error) {
                            console.error('Error deleting account:', error);
                            if (error.code === 'auth/requires-recent-login') {
                                Alert.alert(
                                    'Re-authentication Required',
                                    'For security reasons, please log out and log back in before deleting your account.'
                                );
                            } else {
                                Alert.alert('Error', 'Failed to delete account. Please try again.');
                            }
                        }
                    }
                }
            ]
        );
    };

    useEffect(() => {
        if (!user) {
            setUserDoc(null);
            setProfileDoc(null);
            setLoading(false);
            return;
        }
        setLoading(true);
        const fetchData = async () => {
            try {
                // Get public user doc
                const userSnap = await getDoc(doc(db, 'users', user.uid));
                setUserDoc(userSnap.exists() ? userSnap.data() : null);
                // Get private health profile doc
                const profileSnap = await getDoc(doc(db, 'users', user.uid, 'private', 'health_profile'));
                setProfileDoc(profileSnap.exists() ? profileSnap.data() : null);
            } catch (err) {
                setUserDoc(null);
                setProfileDoc(null);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

    // Personal Info
    const displayName = userDoc?.name || user?.displayName || 'User';
    const displayEmail = userDoc?.email || user?.email || 'user@example.com';
    
    // Create initials from display name for avatar
    const getInitials = (name) => {
        if (!name) return 'U';
        const nameParts = name.trim().split(' ');
        if (nameParts.length === 1) return nameParts[0][0].toUpperCase();
        return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
    };
    
    const userInitials = getInitials(displayName);

    if (authLoading || loading) {
        return (
            <View style={[styles.wrapper, { justifyContent: 'center', alignItems: 'center' }]}> 
                <ActivityIndicator size="large" color={theme.primaryGreen || '#58e221'} />
            </View>
        );
    }

    return (
        <ScrollView style={styles.wrapper} contentContainerStyle={styles.scrollContent}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backText}>←</Text>
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>Profile</Text>
                    <Text style={styles.headerSubtitle}>Manage your account</Text>
                </View>
                <TouchableOpacity onPress={toggleTheme} style={styles.themeToggleButton}>
                    <Ionicons 
                        name={colorScheme === 'dark' ? 'moon' : 'sunny'} 
                        size={22} 
                        color={colorScheme === 'dark' ? '#FFD700' : '#FFA500'} 
                    />
                </TouchableOpacity>
            </View>

            {/* Profile Header */}
            <View style={styles.profileHeader}>
                <View style={styles.profileImageContainer}>
                    <View style={styles.avatarGradient}>
                        <Text style={styles.avatarInitials}>{userInitials}</Text>
                    </View>
                    <TouchableOpacity style={styles.editIconButton}>
                        <Ionicons name="pencil" size={18} color="#fff" />
                    </TouchableOpacity>
                </View>
                <Text style={styles.profileName}>{displayName}</Text>
                <Text style={styles.profileEmail}>{displayEmail}</Text>
            </View>

            {/* Menu Section */}
            <View style={styles.menuSection}>
                {/* Personal Information */}
                <TouchableOpacity 
                    style={styles.menuItem} 
                    onPress={() => router.push('/(tabs)/(home)/(profile)/(personal)')}>
                    <View style={styles.menuItemLeft}>
                        <View style={[styles.iconCircle, { backgroundColor: theme.primary + '20' }]}>
                            <Ionicons name="person-outline" size={22} color={theme.primary} />
                        </View>
                        <Text style={styles.menuItemText}>Personal Information</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
                </TouchableOpacity>

                {/* Health Information */}
                <TouchableOpacity 
                    style={styles.menuItem} 
                    onPress={() => router.push('/(tabs)/(home)/(profile)/(health)')}>
                    <View style={styles.menuItemLeft}>
                        <View style={[styles.iconCircle, { backgroundColor: '#FF6B6B20' }]}>
                            <Ionicons name="fitness-outline" size={22} color="#FF6B6B" />
                        </View>
                        <Text style={styles.menuItemText}>Health Information</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
                </TouchableOpacity>

                {/* Subscription */}
                <TouchableOpacity 
                    style={styles.menuItem}
                    onPress={() => router.push('/(tabs)/(home)/(profile)/(subscription)')}>
                    <View style={styles.menuItemLeft}>
                        <View style={[styles.iconCircle, { backgroundColor: '#1ABC9C20' }]}>
                            <Ionicons name="cash-outline" size={22} color="#1ABC9C" />
                        </View>
                        <Text style={styles.menuItemText}>Subscription</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
                </TouchableOpacity>
            </View>

            {/* Logout Button */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={22} color="#FF6B6B" />
                <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>

            {/* Delete Account Button */}
            <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
                <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                <Text style={styles.deleteText}>Delete Account</Text>
            </TouchableOpacity>
            
            <View style={{height: 30}} />
        </ScrollView>
    );
}

const createStyles = (theme) => StyleSheet.create({
    wrapper: {
        flex: 1,
        backgroundColor: theme.background,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 20,
        backgroundColor: theme.background,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.surface,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    backText: {
        color: theme.text,
        fontSize: 20,
        fontWeight: '600',
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: theme.text,
        marginBottom: 2,
    },
    headerSubtitle: {
        fontSize: 13,
        color: theme.textSecondary,
    },
    themeToggleButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.surface,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    profileHeader: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    profileImageContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    avatarGradient: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 4,
        borderColor: theme.primary,
        backgroundColor: theme.primary,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    avatarInitials: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#fff',
        letterSpacing: 2,
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 4,
        borderColor: theme.primary,
    },
    editIconButton: {
        position: 'absolute',
        right: 0,
        bottom: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: theme.primary,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: theme.background,
    },
    profileName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.text,
        marginBottom: 4,
    },
    profileEmail: {
        fontSize: 14,
        color: theme.textSecondary,
    },
    menuSection: {
        marginHorizontal: 20,
        marginTop: 10,
        backgroundColor: theme.cardBackground,
        borderRadius: 16,
        padding: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.border || '#f0f0f0',
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    menuItemText: {
        fontSize: 16,
        color: theme.text,
        fontWeight: '500',
    },
    menuItemRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    languageText: {
        fontSize: 14,
        color: theme.textSecondary,
        marginRight: 4,
    },
    toggle: {
        width: 50,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#E0E0E0',
        padding: 2,
        justifyContent: 'center',
    },
    toggleActive: {
        backgroundColor: theme.primary,
    },
    toggleCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    toggleCircleActive: {
        alignSelf: 'flex-end',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 20,
        marginTop: 30,
        paddingVertical: 16,
        backgroundColor: theme.cardBackground,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FF6B6B',
        gap: 8,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FF6B6B',
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 20,
        marginTop: 12,
        paddingVertical: 14,
        gap: 6,
    },
    deleteText: {
        fontSize: 14,
        color: '#FF3B30',
        fontWeight: '500',
    },
});