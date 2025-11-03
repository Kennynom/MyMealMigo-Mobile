import { db } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';
import { ThemeContext } from '@/context/ThemeContext';
import { Feather, Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { deleteUser } from 'firebase/auth';
import { deleteDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';


export default function ProfileScreen() {
    const { theme, colorScheme, toggleTheme } = useContext(ThemeContext);
    const styles = createStyles(theme);
    const { user, userRole, loading: authLoading, logout } = useAuth();
    const [userDoc, setUserDoc] = useState(null);
    const [profileDoc, setProfileDoc] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedTab, setSelectedTab] = useState('about');
    const [editMode, setEditMode] = useState(false);
    const [editFields, setEditFields] = useState({
        name: '',
        email: '',
        sex: '',
        birthday: '',
        height: '',
        weight: '',
    });
    const [picker, setPicker] = useState({ field: null, visible: false });
    const [pickerValue, setPickerValue] = useState('');
    const [datePickerVisible, setDatePickerVisible] = useState(false);

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

    // Update editFields when data loads or changes
    useEffect(() => {
        setEditFields({
            name: displayName,
            email: displayEmail,
            sex: displaySex,
            birthday: displayBirthday,
            height: userDoc?.profile?.heightCm?.toString() || '',
            weight: userDoc?.profile?.weightKg?.toString() || '',
        });
    }, [displayName, displayEmail, displaySex, displayBirthday, userDoc]);

    // Personal Info
    const displayName = userDoc?.name || user?.displayName || 'Unknown';
    const displayEmail = userDoc?.email || user?.email || 'Unknown';
    const displayBirthday = userDoc?.profile?.birthday || profileDoc?.birthday || '-';
    const displaySex = userDoc?.profile?.sex || profileDoc?.sex || '-';
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

    // Handle field change
    const handleFieldChange = (field, value) => {
        setEditFields(prev => ({ ...prev, [field]: value }));
    };

    // Save changes to Firestore
    const handleSave = async () => {
        if (!user) return;
        try {
            // Calculate age from birthday
            let age = null;
            if (editFields.birthday) {
                const birthDate = new Date(editFields.birthday);
                const today = new Date();
                age = today.getFullYear() - birthDate.getFullYear();
                const monthDiff = today.getMonth() - birthDate.getMonth();
                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                    age--;
                }
            }

            // Update users/{uid} doc
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                name: editFields.name,
                email: editFields.email,
                'profile.birthday': editFields.birthday,
                'profile.age': age,
                'profile.sex': editFields.sex,
                'profile.heightCm': parseInt(editFields.height) || null,
                'profile.weightKg': parseInt(editFields.weight) || null,
            });
            // Immediately update local state so UI reflects changes
            setUserDoc(prev => ({
                ...prev,
                name: editFields.name,
                email: editFields.email,
                profile: {
                    ...((prev && prev.profile) || {}),
                    birthday: editFields.birthday,
                    age: age,
                    sex: editFields.sex,
                    heightCm: parseInt(editFields.height) || null,
                    weightKg: parseInt(editFields.weight) || null,
                },
            }));
            setEditMode(false);
            Alert.alert('Success', 'Profile updated successfully.');
        } catch (err) {
            Alert.alert('Error', 'Failed to update profile.');
        }
    };

    // Cancel edit
    const handleCancel = () => {
        setEditFields({
            name: displayName,
            email: displayEmail,
            sex: displaySex,
            birthday: displayBirthday,
            height: userDoc?.profile?.heightCm?.toString() || '',
            weight: userDoc?.profile?.weightKg?.toString() || '',
        });
        setEditMode(false);
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
                    <Text style={styles.headerTitleBig}>Personal Information</Text>
                    <TouchableOpacity onPress={toggleTheme} style={styles.themeButton}>
                        <Text style={styles.themeIcon}>{colorScheme === 'dark' ? '☀️' : '🌙'}</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.profileImageWrapper}>
                    <Image source={{ uri: profileImageUrl }} style={styles.profileImageBig} />
                </View>
            </View>
            <View style={styles.detailCard}>
                <View style={styles.detailTitleRow}>
                    <Text style={styles.detailTitle}>Personal Information</Text>
                    {!editMode ? (
                        <TouchableOpacity style={styles.iconBtn} onPress={() => setEditMode(true)}>
                            <Feather name="edit-2" size={20} color={theme.primaryDark} />
                        </TouchableOpacity>
                    ) : (
                        <View style={{ flexDirection: 'row' }}>
                            <TouchableOpacity style={styles.iconBtn} onPress={handleSave}>
                                <Feather name="check" size={20} color={theme.primaryGreen || '#58e221'} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.iconBtn} onPress={handleCancel}>
                                <Feather name="x" size={20} color={theme.error || '#F44336'} />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
                {/* Editable fields */}
                {editMode ? (
                    <>
                        <View style={styles.detailRow}><Text style={styles.detailLabel}>Name:</Text><TextInput style={[styles.input, styles.clickableField]} value={editFields.name} onChangeText={v => handleFieldChange('name', v)} /></View>
                        <View style={styles.detailRow}><Text style={styles.detailLabel}>Email:</Text><TextInput style={[styles.input, styles.clickableField]} value={editFields.email} onChangeText={v => handleFieldChange('email', v)} keyboardType="email-address" /></View>
                        <TouchableOpacity style={styles.detailRow} activeOpacity={0.7} onPress={() => { setPicker({ field: 'sex', visible: true }); setPickerValue(editFields.sex || 'Male'); }}>
                            <Text style={styles.detailLabel}>Sex:</Text>
                            <Text style={[styles.detailValue, styles.clickableField]}>{editFields.sex || 'Select'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.detailRow} activeOpacity={0.7} onPress={() => setDatePickerVisible(true)}>
                            <Text style={styles.detailLabel}>Birthday:</Text>
                            <Text style={[styles.detailValue, styles.clickableField]}>{editFields.birthday || 'Select'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.detailRow} activeOpacity={0.7} onPress={() => { setPicker({ field: 'height', visible: true }); setPickerValue(editFields.height || '160'); }}>
                            <Text style={styles.detailLabel}>Height (cm):</Text>
                            <Text style={[styles.detailValue, styles.clickableField]}>{editFields.height || 'Select'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.detailRow} activeOpacity={0.7} onPress={() => { setPicker({ field: 'weight', visible: true }); setPickerValue(editFields.weight || '60'); }}>
                            <Text style={styles.detailLabel}>Weight (kg):</Text>
                            <Text style={[styles.detailValue, styles.clickableField]}>{editFields.weight || 'Select'}</Text>
                        </TouchableOpacity>
                        {/* Picker Modal */}
                        <Modal visible={picker.visible} transparent animationType="slide" onRequestClose={() => setPicker({ field: null, visible: false })}>
                            <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)' }}>
                                <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16 }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                                        <TouchableOpacity onPress={() => setPicker({ field: null, visible: false })}><Text style={{ color: theme.error || '#F44336', fontWeight: 'bold' }}>Cancel</Text></TouchableOpacity>
                                        <TouchableOpacity onPress={() => {
                                            setEditFields(prev => ({ ...prev, [picker.field]: pickerValue }));
                                            setPicker({ field: null, visible: false });
                                        }}><Text style={{ color: theme.primaryGreen || '#58e221', fontWeight: 'bold' }}>Save</Text></TouchableOpacity>
                                    </View>
                                    {picker.field === 'sex' && (
                                        <View>
                                            {['Male', 'Female', 'Other'].map(option => (
                                                <TouchableOpacity key={option} style={{ padding: 16, alignItems: 'center' }} onPress={() => setPickerValue(option)}>
                                                    <Text style={{ fontSize: 24, color: pickerValue === option ? theme.primaryGreen || '#58e221' : theme.primaryDark }}>{option}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    )}
                                    {picker.field === 'height' && (
                                        <View style={{ alignItems: 'center' }}>
                                            <ScrollView style={{ maxHeight: 200 }}>
                                                {[...Array(221).keys()].slice(100).map(h => (
                                                    <TouchableOpacity key={h} style={{ padding: 12 }} onPress={() => setPickerValue(String(h))}>
                                                        <Text style={{ fontSize: 24, color: pickerValue === String(h) ? theme.primaryGreen || '#58e221' : theme.primaryDark }}>{h} cm</Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </ScrollView>
                                        </View>
                                    )}
                                    {picker.field === 'weight' && (
                                        <View style={{ alignItems: 'center' }}>
                                            <ScrollView style={{ maxHeight: 200 }}>
                                                {[...Array(201).keys()].slice(30).map(w => (
                                                    <TouchableOpacity key={w} style={{ padding: 12 }} onPress={() => setPickerValue(String(w))}>
                                                        <Text style={{ fontSize: 24, color: pickerValue === String(w) ? theme.primaryGreen || '#58e221' : theme.primaryDark }}>{w} kg</Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </ScrollView>
                                        </View>
                                    )}
                                </View>
                            </View>
                        </Modal>
                        {/* Date Picker Modal */}
                        <Modal visible={datePickerVisible} transparent animationType="slide" onRequestClose={() => setDatePickerVisible(false)}>
                            <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)' }}>
                                <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16 }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                                        <TouchableOpacity onPress={() => setDatePickerVisible(false)}><Text style={{ color: theme.error || '#F44336', fontWeight: 'bold' }}>Cancel</Text></TouchableOpacity>
                                        <TouchableOpacity onPress={() => setDatePickerVisible(false)}><Text style={{ color: theme.primaryGreen || '#58e221', fontWeight: 'bold' }}>Done</Text></TouchableOpacity>
                                    </View>
                                    <DateTimePicker
                                        value={(!editFields.birthday || isNaN(new Date(editFields.birthday).getTime())) ? new Date(2025, 0, 1) : new Date(editFields.birthday)}
                                        mode="date"
                                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                        onChange={(event, date) => {
                                            if (date) setEditFields(prev => ({ ...prev, birthday: date.toISOString().split('T')[0] }));
                                        }}
                                        style={{ width: '100%' }}
                                    />
                                </View>
                            </View>
                        </Modal>
                    </>
                ) : (
                    <>
                        <View style={styles.detailRow}><Text style={styles.detailLabel}>Name:</Text><Text style={styles.detailValue}>{displayName}</Text></View>
                        <View style={styles.detailRow}><Text style={styles.detailLabel}>Email:</Text><Text style={styles.detailValue}>{displayEmail}</Text></View>
                        <View style={styles.detailRow}><Text style={styles.detailLabel}>Sex:</Text><Text style={styles.detailValue}>{displaySex}</Text></View>
                        <View style={styles.detailRow}><Text style={styles.detailLabel}>Birthday:</Text><Text style={styles.detailValue}>{displayBirthday}</Text></View>
                        <View style={styles.detailRow}><Text style={styles.detailLabel}>Height (cm):</Text><Text style={styles.detailValue}>{displayHeight}</Text></View>
                        <View style={styles.detailRow}><Text style={styles.detailLabel}>Weight (kg):</Text><Text style={styles.detailValue}>{displayWeight}</Text></View>
                    </>
                )}
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
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        backgroundColor: '#fff',
        borderRadius: 0,
        marginBottom: 0,
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
    themeButton: {
        marginLeft: 'auto',
        padding: 6,
        borderRadius: 28,
        backgroundColor: theme.translucent,
    },
    themeIcon: {
        fontSize: 20,
    },
    detailCard: {
        backgroundColor: theme.background || '#fff',
        borderRadius: 28,
        marginHorizontal: 18,
        marginTop: -30,
        padding: 30,
        shadowColor: theme.shadow || '#000',
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 2,
    },
    detailScroll: {
        flexGrow: 0,
        backgroundColor: 'transparent',
        borderRadius: 8,
        marginHorizontal: 0,
        marginTop: 24,
        marginBottom: 0,
        padding: 8,
        position: 'relative',
        top: undefined,
        left: undefined,
        right: undefined,
        zIndex: undefined,
    },
    detailTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.primaryDark,
        marginBottom: 18,
        textAlign: 'center',
    },
    detailTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    clickableField: {
        backgroundColor: theme.cardBackground || '#f2fdf6',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: theme.primaryGreen || '#e0f5e7',
        paddingVertical: 10,
        paddingHorizontal: 12,
        marginBottom: 12,
        minHeight: 44,
        width: 180,
    },
    clickableValue: {
        color: theme.primaryGreen || '#1db954',
        fontWeight: '600',
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
    iconBtn: {
        marginLeft: 8,
        padding: 6,
        borderRadius: 8,
        backgroundColor: theme.translucent,
    },
    input: {
        flex: 1,
        backgroundColor: theme.cardBackground,
        borderRadius: 8,
        padding: 8,
        fontSize: 16,
        color: theme.primaryDark,
        borderWidth: 1,
        borderColor: theme.textSecondary,
        marginLeft: 8,
        minWidth: 180,
        maxWidth: 180,
    },
    saveBtn: {
        backgroundColor: theme.primaryGreen || '#58e221',
        borderRadius: 8,
        paddingVertical: 6,
        paddingHorizontal: 18,
        marginRight: 10,
    },
    saveBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    cancelBtn: {
        backgroundColor: theme.error || '#F44336',
        borderRadius: 8,
        paddingVertical: 6,
        paddingHorizontal: 18,
    },
    cancelBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});