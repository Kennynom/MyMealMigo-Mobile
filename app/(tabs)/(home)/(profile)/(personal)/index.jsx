// Modern Personal Information Screen - Save this to replace the existing index.jsx
import { db } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';
import { ThemeContext } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function PersonalInformationScreen() {
    const { theme } = useContext(ThemeContext);
    const styles = createStyles(theme);
    const { user } = useAuth();
    const [userDoc, setUserDoc] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [editFields, setEditFields] = useState({
        name: '',
        email: '',
        birthday: '',
        sex: '',
    });

    useEffect(() => {
        if (!user) return;
        const fetchData = async () => {
            try {
                const userSnap = await getDoc(doc(db, 'users', user.uid));
                const data = userSnap.exists() ? userSnap.data() : null;
                setUserDoc(data);
                setEditFields({
                    name: data?.name || '',
                    email: data?.email || user.email || '',
                    birthday: data?.profile?.birthday || '',
                    sex: data?.profile?.sex || '',
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
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                name: editFields.name,
                email: editFields.email,
                'profile.birthday': editFields.birthday,
                'profile.sex': editFields.sex,
            });
            setUserDoc(prev => ({
                ...prev,
                name: editFields.name,
                email: editFields.email,
                profile: { ...(prev?.profile || {}), birthday: editFields.birthday, sex: editFields.sex }
            }));
            setEditMode(false);
            Alert.alert('Success', 'Personal information updated successfully.');
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
                    <Text style={styles.headerTitle}>Personal Info</Text>
                    <Text style={styles.headerSubtitle}>Manage your details</Text>
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
                {/* Info Cards */}
                <View style={styles.section}>
                    {/* Name */}
                    <View style={styles.infoCard}>
                        <View style={styles.infoHeader}>
                            <View style={[styles.iconCircle, { backgroundColor: theme.primary + '20' }]}>
                                <Ionicons name="person-outline" size={20} color={theme.primary} />
                            </View>
                            <Text style={styles.infoLabel}>Full Name</Text>
                        </View>
                        {editMode ? (
                            <TextInput
                                style={styles.input}
                                value={editFields.name}
                                onChangeText={(v) => setEditFields(prev => ({ ...prev, name: v }))}
                                placeholder="Enter your name"
                                placeholderTextColor={theme.textSecondary}
                            />
                        ) : (
                            <Text style={styles.infoValue}>{editFields.name || 'Not set'}</Text>
                        )}
                    </View>

                    {/* Email */}
                    <View style={styles.infoCard}>
                        <View style={styles.infoHeader}>
                            <View style={[styles.iconCircle, { backgroundColor: '#FF6B6B20' }]}>
                                <Ionicons name="mail-outline" size={20} color="#FF6B6B" />
                            </View>
                            <Text style={styles.infoLabel}>Email</Text>
                        </View>
                        {editMode ? (
                            <TextInput
                                style={styles.input}
                                value={editFields.email}
                                onChangeText={(v) => setEditFields(prev => ({ ...prev, email: v }))}
                                placeholder="Enter your email"
                                placeholderTextColor={theme.textSecondary}
                                keyboardType="email-address"
                            />
                        ) : (
                            <Text style={styles.infoValue}>{editFields.email || 'Not set'}</Text>
                        )}
                    </View>

                    {/* Birthday */}
                    <View style={styles.infoCard}>
                        <View style={styles.infoHeader}>
                            <View style={[styles.iconCircle, { backgroundColor: '#4ECDC420' }]}>
                                <Ionicons name="calendar-outline" size={20} color="#4ECDC4" />
                            </View>
                            <Text style={styles.infoLabel}>Birthday</Text>
                        </View>
                        {editMode ? (
                            <TextInput
                                style={styles.input}
                                value={editFields.birthday}
                                onChangeText={(v) => setEditFields(prev => ({ ...prev, birthday: v }))}
                                placeholder="YYYY-MM-DD"
                                placeholderTextColor={theme.textSecondary}
                            />
                        ) : (
                            <Text style={styles.infoValue}>{editFields.birthday || 'Not set'}</Text>
                        )}
                    </View>

                    {/* Sex */}
                    <View style={styles.infoCard}>
                        <View style={styles.infoHeader}>
                            <View style={[styles.iconCircle, { backgroundColor: '#9B59B620' }]}>
                                <Ionicons name="male-female-outline" size={20} color="#9B59B6" />
                            </View>
                            <Text style={styles.infoLabel}>Sex</Text>
                        </View>
                        {editMode ? (
                            <View style={styles.sexSelector}>
                                {['Male', 'Female', 'Other'].map(option => (
                                    <TouchableOpacity
                                        key={option}
                                        style={[
                                            styles.sexOption,
                                            editFields.sex === option && styles.sexOptionActive
                                        ]}
                                        onPress={() => setEditFields(prev => ({ ...prev, sex: option }))}
                                    >
                                        <Text style={[
                                            styles.sexOptionText,
                                            editFields.sex === option && styles.sexOptionTextActive
                                        ]}>
                                            {option}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        ) : (
                            <Text style={styles.infoValue}>{editFields.sex || 'Not set'}</Text>
                        )}
                    </View>
                </View>

                {editMode && (
                    <TouchableOpacity 
                        style={styles.cancelButton}
                        onPress={() => {
                            setEditFields({
                                name: userDoc?.name || '',
                                email: userDoc?.email || user.email || '',
                                birthday: userDoc?.profile?.birthday || '',
                                sex: userDoc?.profile?.sex || '',
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
    section: {
        marginHorizontal: 20,
        marginTop: 10,
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
    sexSelector: {
        flexDirection: 'row',
        gap: 8,
        marginLeft: 48,
    },
    sexOption: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: theme.surface,
        alignItems: 'center',
    },
    sexOptionActive: {
        backgroundColor: theme.primary,
    },
    sexOptionText: {
        fontSize: 14,
        color: theme.text,
        fontWeight: '500',
    },
    sexOptionTextActive: {
        color: '#fff',
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
