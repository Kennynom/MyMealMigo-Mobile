import { db } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';
import { ThemeContext } from '@/context/ThemeContext';
import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';


export default function ProfileScreen() {
    const { theme } = useContext(ThemeContext);
    const styles = createStyles(theme);
    const { user, userRole, loading: authLoading, logout } = useAuth();
    const [userDoc, setUserDoc] = useState(null);
    const [profileDoc, setProfileDoc] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedTab, setSelectedTab] = useState('about');

    // For logout navigation
    const handleLogout = async () => {
        try {
            await logout();
            router.replace('/(auth)/login');
        } catch (e) {
            // Optionally show error
        }
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
    const displayName = userDoc?.name || user?.displayName || 'Unknown';
    const displayEmail = userDoc?.email || user?.email || 'Unknown';
    const displayBirthday = userDoc?.profile?.birthday || profileDoc?.birthday || '-';
    const displaySex = userDoc?.profile?.sex || profileDoc?.sex || '-';
    const displayLocation = userDoc?.location || '-';
    // Health Info
    const displayHeight = userDoc?.profile?.heightCm || profileDoc?.heightCm || '-';
    const displayWeight = userDoc?.profile?.weightKg || profileDoc?.weightKg || '-';
    const displayAllergies = profileDoc?.allergies?.items?.other || 'None';
    const displayConditions = profileDoc?.conditions?.items?.other || 'None';
    // PAR-Q
    const parq = profileDoc?.parqPlus || {};
    const parqQuestions = [
        { key: 'q1_chestPain', label: 'Chest Pain' },
        { key: 'q2_dizziness', label: 'Dizziness' },
        { key: 'q3_boneJointProblem', label: 'Bone/Joint Problem' },
        { key: 'q4_prescriptionMeds', label: 'Prescription Meds' },
        { key: 'q5_heartCondition', label: 'Heart Condition' },
        { key: 'q6_bloodPressureIssue', label: 'Blood Pressure Issue' },
        { key: 'q7_otherReason', label: 'Other Reason' },
    ];
    // const profileImageUrl = userDoc?.photoURL || 'https://www.gravatar.com/avatar/?d=mp&s=200';
    const profileImageUrl = 'https://www.gravatar.com/avatar/?d=mp&s=200';

    if (authLoading || loading) {
        return (
            <View style={[styles.wrapper, { justifyContent: 'center', alignItems: 'center' }]}> 
                <ActivityIndicator size="large" color={theme.primaryGreen || '#58e221'} />
            </View>
        );
    }

    return (
        <View style={styles.wrapper}>
            {/* Header Card */}
            <View style={styles.headerCard}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitleBig}>My Profile</Text>
                    <Ionicons name="notifications-outline" size={24} color={theme.text} style={{marginLeft: 'auto'}} />
                </View>
                <View style={styles.profileImageWrapper}>
                    <Image source={{ uri: profileImageUrl }} style={styles.profileImageBig} />
                </View>
            </View>

            <View style={styles.menuList}>
                <TouchableOpacity style={styles.menuItem} onPress={() => router.push('(personal)')}>
                    <FontAwesome5 name="user" size={20} color={theme.primaryDark} style={styles.menuIcon} />
                    <Text style={styles.menuText}>Personal Information</Text>
                    <MaterialIcons name="keyboard-arrow-right" size={24} color={theme.primaryDark} style={{marginLeft: 'auto'}} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={() => router.push('(health)')}>
                    <FontAwesome5 name="heartbeat" size={20} color={theme.primaryDark} style={styles.menuIcon} />
                    <Text style={styles.menuText}>Health Information</Text>
                    <MaterialIcons name="keyboard-arrow-right" size={24} color={theme.primaryDark} style={{marginLeft: 'auto'}} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={() => router.push('(questionnaire)')}>
                    <FontAwesome5 name="clipboard-list" size={20} color={theme.primaryDark} style={styles.menuIcon} />
                    <Text style={styles.menuText}>Questionnaire</Text>
                    <MaterialIcons name="keyboard-arrow-right" size={24} color={theme.primaryDark} style={{marginLeft: 'auto'}} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={() => router.push('(subscription)')}>
                    <FontAwesome5 name="file-invoice-dollar" size={20} color={theme.primaryDark} style={styles.menuIcon} />
                    <Text style={styles.menuText}>Subscription</Text>
                    <MaterialIcons name="keyboard-arrow-right" size={24} color={theme.primaryDark} style={{marginLeft: 'auto'}} />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.menuItem, styles.menuItemLogout]} onPress={handleLogout}>
                    <MaterialIcons name="logout" size={20} color={theme.primaryDark} style={styles.menuIcon} />
                    <Text style={styles.menuText}>Logout</Text>
                    <MaterialIcons name="keyboard-arrow-right" size={24} color={theme.primaryDark} style={{marginLeft: 'auto'}} />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.menuItem, styles.menuItemLogout]} onPress={handleDeleteAccount}>
                    <MaterialIcons name="delete" size={20} color={theme.error || '#F44336'} style={styles.menuIcon} />
                    <Text style={[styles.menuText, {color: theme.error || '#F44336'}]}>Delete Account</Text>
                    <MaterialIcons name="keyboard-arrow-right" size={24} color={theme.error || '#F44336'} style={{marginLeft: 'auto'}} />
                </TouchableOpacity>
            </View>
            
        </View>
    );
}

const createStyles = (theme) => StyleSheet.create({
    wrapper: {
        flex: 1,
        backgroundColor: theme.background,
    },
    headerCard: {
        backgroundColor: theme.primaryDark,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        paddingBottom: 30,
        paddingTop: 20,
        paddingHorizontal: 20,
        alignItems: 'center',
        shadowColor: theme.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginBottom: 10,
    },
    headerTitleBig: {
        fontSize: 22,
        fontWeight: 'bold',
        color: theme.altText,
    },
    profileImageWrapper: {
        marginTop: 10,
        marginBottom: 10,
        borderWidth: 4,
        borderColor: '#fff',
        borderRadius: 999,
        padding: 4,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    profileImageBig: {
        width: 120,
        height: 120,
        borderRadius: 60,
        resizeMode: 'cover',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 8,
        width: '100%',
    },
    menuList: {
        backgroundColor: theme.background || '#fff',
        borderRadius: 28,
        marginHorizontal: 18,
        marginTop: -30,
        paddingTop: 30,
        paddingBottom: 10,
        shadowColor: theme.shadow || '#000',
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 2,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 18,
        paddingHorizontal: 18,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        backgroundColor: '#fff',
        borderRadius: 28,
        marginBottom: 8,
    },
    menuIcon: {
        marginRight: 16,
    },
    menuText: {
        fontSize: 16,
        color: theme.primaryDark,
        fontWeight: 'bold',
    },
    backButton: {
        marginRight: 12,
        padding: 6,
        borderRadius: 28,
        backgroundColor: theme.translucent,
    },
    detailCard: {
        backgroundColor: theme.cardBackground || '#fff',
        borderRadius: 18,
        marginHorizontal: 18,
        marginTop: 0,
        paddingTop: 30,
        paddingBottom: 20,
        paddingHorizontal: 20,
        shadowColor: theme.shadow || '#000',
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    detailScroll: {
        flexGrow: 0,
        backgroundColor: 'transparent',
        borderRadius: 18,
        marginHorizontal: 0,
        marginTop: 210,
        marginBottom: 0,
        padding: 15,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    detailTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.primaryDark,
        marginBottom: 18,
        textAlign: 'center',
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    detailLabel: {
        fontSize: 16,
        color: theme.textSecondary || '#888',
        fontWeight: 'bold',
    },
    detailValue: {
        fontSize: 16,
        color: theme.primaryDark,
        fontWeight: 'bold',
    },
    detailBackBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        marginTop: 18,
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: 16,
        backgroundColor: theme.translucent || '#eaeaea',
    },
    detailBackText: {
        fontSize: 16,
        color: theme.primaryDark,
        marginLeft: 6,
        fontWeight: 'bold',
    },
});

// Add the handler for delete account
const handleDeleteAccount = async () => {
    // TODO: Implement account deletion logic (Firebase Auth + Firestore cleanup)
    alert('Account deletion is not yet implemented.');
};