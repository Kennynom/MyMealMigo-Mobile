// Modern Health Information Screen - Save this to replace the existing index.jsx
import { db } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';
import { ThemeContext } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function HealthInformationScreen() {
    const { theme } = useContext(ThemeContext);
    const styles = createStyles(theme);
    const { user } = useAuth();
    const [userDoc, setUserDoc] = useState(null);
    const [profileDoc, setProfileDoc] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [editFields, setEditFields] = useState({
        height: '',
        weight: '',
        allergies: '',
        conditions: '',
        medications: '',
    });

    useEffect(() => {
        if (!user) return;
        const fetchData = async () => {
            try {
                const userSnap = await getDoc(doc(db, 'users', user.uid));
                const profileSnap = await getDoc(doc(db, 'users', user.uid, 'private', 'health_profile'));
                
                const userData = userSnap.exists() ? userSnap.data() : null;
                const profileData = profileSnap.exists() ? profileSnap.data() : null;
                
                setUserDoc(userData);
                setProfileDoc(profileData);
                
                setEditFields({
                    height: userData?.profile?.heightCm?.toString() || '',
                    weight: userData?.profile?.weightKg?.toString() || '',
                    allergies: profileData?.allergies?.items?.other || '',
                    conditions: profileData?.conditions?.items?.other || '',
                    medications: profileData?.medications?.items?.notes || '',
                });
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

    const handleSave = async () => {
        if (!user) return;
        try {
            // Update height and weight in user profile
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                'profile.heightCm': parseFloat(editFields.height) || 0,
                'profile.weightKg': parseFloat(editFields.weight) || 0,
            });

            // Update health information in private profile
            const profileRef = doc(db, 'users', user.uid, 'private', 'health_profile');
            await updateDoc(profileRef, {
                'allergies.items.other': editFields.allergies,
                'conditions.items.other': editFields.conditions,
                'medications.items.notes': editFields.medications,
            });

            setUserDoc(prev => ({
                ...prev,
                profile: {
                    ...(prev?.profile || {}),
                    heightCm: parseFloat(editFields.height) || 0,
                    weightKg: parseFloat(editFields.weight) || 0,
                }
            }));

            setProfileDoc(prev => ({
                ...prev,
                allergies: { ...prev?.allergies, items: { ...prev?.allergies?.items, other: editFields.allergies } },
                conditions: { ...prev?.conditions, items: { ...prev?.conditions?.items, other: editFields.conditions } },
                medications: { ...prev?.medications, items: { ...prev?.medications?.items, notes: editFields.medications } },
            }));

            setEditMode(false);
            Alert.alert('Success', 'Health information updated successfully.');
        } catch (err) {
            Alert.alert('Error', 'Failed to update information.');
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}> 
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backText}>←</Text>
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>Health Info</Text>
                    <Text style={styles.headerSubtitle}>Track your health</Text>
                </View>
                <TouchableOpacity 
                    onPress={() => editMode ? handleSave() : setEditMode(true)} 
                    style={styles.editButton}>
                    <Ionicons 
                        name={editMode ? 'checkmark' : 'pencil'} 
                        size={20} 
                        color={editMode ? '#4CAF50' : theme.text} 
                    />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Physical Measurements */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Physical Measurements</Text>
                </View>

                <View style={styles.section}>
                    {/* Height */}
                    <View style={styles.infoCard}>
                        <View style={styles.infoHeader}>
                            <View style={[styles.iconCircle, { backgroundColor: '#4ECDC420' }]}>
                                <Ionicons name="resize-outline" size={20} color="#4ECDC4" />
                            </View>
                            <Text style={styles.infoLabel}>Height (cm)</Text>
                        </View>
                        {editMode ? (
                            <TextInput
                                style={styles.input}
                                value={editFields.height}
                                onChangeText={(v) => setEditFields(prev => ({ ...prev, height: v }))}
                                placeholder="Enter height in cm"
                                placeholderTextColor={theme.textSecondary}
                                keyboardType="numeric"
                            />
                        ) : (
                            <Text style={styles.infoValue}>{editFields.height || 'Not set'}</Text>
                        )}
                    </View>

                    {/* Weight */}
                    <View style={styles.infoCard}>
                        <View style={styles.infoHeader}>
                            <View style={[styles.iconCircle, { backgroundColor: '#FF6B6B20' }]}>
                                <Ionicons name="fitness-outline" size={20} color="#FF6B6B" />
                            </View>
                            <Text style={styles.infoLabel}>Weight (kg)</Text>
                        </View>
                        {editMode ? (
                            <TextInput
                                style={styles.input}
                                value={editFields.weight}
                                onChangeText={(v) => setEditFields(prev => ({ ...prev, weight: v }))}
                                placeholder="Enter weight in kg"
                                placeholderTextColor={theme.textSecondary}
                                keyboardType="numeric"
                            />
                        ) : (
                            <Text style={styles.infoValue}>{editFields.weight || 'Not set'}</Text>
                        )}
                    </View>
                </View>

                {/* Medical Information */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Medical Information</Text>
                </View>

                <View style={styles.section}>
                    {/* Allergies */}
                    <View style={styles.infoCard}>
                        <View style={styles.infoHeader}>
                            <View style={[styles.iconCircle, { backgroundColor: '#FFA50020' }]}>
                                <Ionicons name="warning-outline" size={20} color="#FFA500" />
                            </View>
                            <Text style={styles.infoLabel}>Allergies</Text>
                        </View>
                        {editMode ? (
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={editFields.allergies}
                                onChangeText={(v) => setEditFields(prev => ({ ...prev, allergies: v }))}
                                placeholder="List any allergies"
                                placeholderTextColor={theme.textSecondary}
                                multiline
                                numberOfLines={3}
                            />
                        ) : (
                            <Text style={styles.infoValue}>{editFields.allergies || 'None'}</Text>
                        )}
                    </View>

                    {/* Medical Conditions */}
                    <View style={styles.infoCard}>
                        <View style={styles.infoHeader}>
                            <View style={[styles.iconCircle, { backgroundColor: '#E74C3C20' }]}>
                                <Ionicons name="medical-outline" size={20} color="#E74C3C" />
                            </View>
                            <Text style={styles.infoLabel}>Medical Conditions</Text>
                        </View>
                        {editMode ? (
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={editFields.conditions}
                                onChangeText={(v) => setEditFields(prev => ({ ...prev, conditions: v }))}
                                placeholder="List any medical conditions"
                                placeholderTextColor={theme.textSecondary}
                                multiline
                                numberOfLines={3}
                            />
                        ) : (
                            <Text style={styles.infoValue}>{editFields.conditions || 'None'}</Text>
                        )}
                    </View>

                    {/* Medications */}
                    <View style={styles.infoCard}>
                        <View style={styles.infoHeader}>
                            <View style={[styles.iconCircle, { backgroundColor: '#9B59B620' }]}>
                                <Ionicons name="medkit-outline" size={20} color="#9B59B6" />
                            </View>
                            <Text style={styles.infoLabel}>Medications</Text>
                        </View>
                        {editMode ? (
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={editFields.medications}
                                onChangeText={(v) => setEditFields(prev => ({ ...prev, medications: v }))}
                                placeholder="List current medications"
                                placeholderTextColor={theme.textSecondary}
                                multiline
                                numberOfLines={3}
                            />
                        ) : (
                            <Text style={styles.infoValue}>{editFields.medications || 'None'}</Text>
                        )}
                    </View>
                </View>

                {editMode && (
                    <TouchableOpacity 
                        style={styles.cancelButton}
                        onPress={() => {
                            setEditFields({
                                height: userDoc?.profile?.heightCm?.toString() || '',
                                weight: userDoc?.profile?.weightKg?.toString() || '',
                                allergies: profileDoc?.allergies?.items?.other || '',
                                conditions: profileDoc?.conditions?.items?.other || '',
                                medications: profileDoc?.medications?.items?.notes || '',
                            });
                            setEditMode(false);
                        }}
                    >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const createStyles = (theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
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
    editButton: {
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
    sectionHeader: {
        marginHorizontal: 20,
        marginTop: 20,
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.text,
    },
    section: {
        marginHorizontal: 20,
    },
    infoCard: {
        backgroundColor: theme.cardBackground,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    infoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    iconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    infoLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.textSecondary,
    },
    infoValue: {
        fontSize: 16,
        color: theme.text,
        marginLeft: 48,
    },
    input: {
        fontSize: 16,
        color: theme.text,
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: theme.surface,
        borderRadius: 8,
        marginLeft: 48,
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    cancelButton: {
        marginHorizontal: 20,
        marginTop: 10,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.border,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        color: theme.textSecondary,
    },
});
