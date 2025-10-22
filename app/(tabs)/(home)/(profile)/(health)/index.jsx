import { db } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';
import { ThemeContext } from '@/context/ThemeContext';
import { Feather, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function HealthInfoScreen() {
    const [picker, setPicker] = useState({ field: null, visible: false });
    const [pickerValue, setPickerValue] = useState('');
    const { theme } = useContext(ThemeContext);
    const styles = createStyles(theme);
    const { user, loading: authLoading } = useAuth();
    const [profileDoc, setProfileDoc] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [editFields, setEditFields] = useState({ allergies: '', conditions: '', medications: '', injuries: '', fitness: '' });

    useEffect(() => {
        if (!user) {
            setProfileDoc(null);
            setLoading(false);
            return;
        }
        setLoading(true);
        const fetchData = async () => {
            try {
                const profileSnap = await getDoc(doc(db, 'users', user.uid, 'private', 'health_profile'));
                setProfileDoc(profileSnap.exists() ? profileSnap.data() : null);
            } catch (err) {
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
            allergies: profileDoc?.allergies?.items?.other || '',
            conditions: profileDoc?.conditions?.items?.other || '',
            medications: profileDoc?.medications?.items?.notes || '',
            injuries: profileDoc?.injuries?.items?.notes || '',
            fitness: profileDoc?.fitness?.goal || '',
        });
    }, [profileDoc]);

    const handleFieldChange = (field, value) => {
        setEditFields(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        if (!user) return;
        try {
            const profileRef = doc(db, 'users', user.uid, 'private', 'health_profile');
            await updateDoc(profileRef, {
                'allergies.items.other': editFields.allergies,
                'conditions.items.other': editFields.conditions,
                'medications.items.notes': editFields.medications,
                'injuries.items.notes': editFields.injuries,
                'fitness.goal': editFields.fitness,
            });
            setProfileDoc(prev => ({
                ...prev,
                allergies: { ...((prev && prev.allergies) || {}), items: { ...(((prev && prev.allergies) && prev.allergies.items) || {}), other: editFields.allergies } },
                conditions: { ...((prev && prev.conditions) || {}), items: { ...(((prev && prev.conditions) && prev.conditions.items) || {}), other: editFields.conditions } },
                medications: { ...((prev && prev.medications) || {}), items: { ...(((prev && prev.medications) && prev.medications.items) || {}), notes: editFields.medications } },
                injuries: { ...((prev && prev.injuries) || {}), items: { ...(((prev && prev.injuries) && prev.injuries.items) || {}), notes: editFields.injuries } },
                fitness: { ...((prev && prev.fitness) || {}), goal: editFields.fitness },
            }));
            setEditMode(false);
            Alert.alert('Success', 'Health information updated successfully.');
        } catch (err) {
            Alert.alert('Error', 'Failed to update health information.');
        }
    };
    const handleCancel = () => {
        setEditFields({
            allergies: profileDoc?.allergies?.items?.other || '',
            conditions: profileDoc?.conditions?.items?.other || '',
            medications: profileDoc?.medications?.items?.notes || '',
            injuries: profileDoc?.injuries?.items?.notes || '',
            fitness: profileDoc?.fitness?.goal || '',
        });
        setEditMode(false);
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
                    <Text style={styles.headerTitleBig}>Health Information</Text>
                </View>
            </View>
            <ScrollView style={styles.detailScroll} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}>
                <View style={styles.detailCard}>
                    <View style={styles.detailTitleRow}>
                        <Text style={styles.detailTitle}>Health Information</Text>
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
                    {editMode ? (
                        <>
                            <TouchableOpacity style={styles.detailRow} activeOpacity={0.7} onPress={() => { setPicker({ field: 'allergies', visible: true }); setPickerValue(editFields.allergies); }}>
                                <Text style={styles.detailLabel}>Allergies:</Text>
                                <Text style={[styles.detailValue, styles.clickableField]} numberOfLines={1} ellipsizeMode="tail">{editFields.allergies || 'Select'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.detailRow} activeOpacity={0.7} onPress={() => { setPicker({ field: 'conditions', visible: true }); setPickerValue(editFields.conditions); }}>
                                <Text style={styles.detailLabel}>Conditions:</Text>
                                <Text style={[styles.detailValue, styles.clickableField]} numberOfLines={1} ellipsizeMode="tail">{editFields.conditions || 'Select'}</Text>
                            </TouchableOpacity>
                            {/* Move Medications to bottom, so skip rendering here */}
                            <TouchableOpacity style={styles.detailRow} activeOpacity={0.7} onPress={() => { setPicker({ field: 'injuries', visible: true }); setPickerValue(editFields.injuries); }}>
                                <Text style={styles.detailLabel}>Injuries:</Text>
                                <Text style={[styles.detailValue, styles.clickableField]} numberOfLines={1} ellipsizeMode="tail">{editFields.injuries || 'Select'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.detailRow} activeOpacity={0.7} onPress={() => { setPicker({ field: 'fitness', visible: true }); setPickerValue(editFields.fitness); }}>
                                <Text style={styles.detailLabel}>Fitness Goal:</Text>
                                <Text style={[styles.detailValue, styles.clickableField]} numberOfLines={1} ellipsizeMode="tail">{editFields.fitness || 'Select'}</Text>
                            </TouchableOpacity>
                            {/* Medications at the bottom */}
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Medications:</Text>
                                <TextInput
                                    style={[styles.detailValue, styles.clickableField]}
                                    value={editFields.medications}
                                    onChangeText={v => handleFieldChange('medications', v)}
                                    placeholder="Enter medications"
                                />
                            </View>
                            {/* Picker Modal for scrollable options for allergies, conditions, injuries, and fitness goal */}
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
                                        {picker.field === 'allergies' && (
                                            <ScrollView style={{ maxHeight: 200 }}>
                                                {['peanuts','shellfish','milk','eggs','soy','wheat','tree_nuts','fish','sesame','other'].map(opt => (
                                                    <TouchableOpacity key={opt} style={{ padding: 16, alignItems: 'center' }} onPress={() => setPickerValue(opt)}>
                                                        <Text style={{ fontSize: 24, color: pickerValue === opt ? theme.primaryGreen || '#58e221' : theme.primaryDark }}>{opt.replace(/_/g,' ')}</Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </ScrollView>
                                        )}
                                        {picker.field === 'conditions' && (
                                            <ScrollView style={{ maxHeight: 200 }}>
                                                {['asthma','diabetes','hypertension','thyroid','anxiety','depression','eczema','other'].map(opt => (
                                                    <TouchableOpacity key={opt} style={{ padding: 16, alignItems: 'center' }} onPress={() => setPickerValue(opt)}>
                                                        <Text style={{ fontSize: 24, color: pickerValue === opt ? theme.primaryGreen || '#58e221' : theme.primaryDark }}>{opt.replace(/_/g,' ')}</Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </ScrollView>
                                        )}
                                        {picker.field === 'injuries' && (
                                            <ScrollView style={{ maxHeight: 200 }}>
                                                {['knee','shoulder','back','ankle','hip','other'].map(opt => (
                                                    <TouchableOpacity key={opt} style={{ padding: 16, alignItems: 'center' }} onPress={() => setPickerValue(opt)}>
                                                        <Text style={{ fontSize: 24, color: pickerValue === opt ? theme.primaryGreen || '#58e221' : theme.primaryDark }}>{opt.replace(/_/g,' ')}</Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </ScrollView>
                                        )}
                                        {picker.field === 'fitness' && (
                                            <ScrollView style={{ maxHeight: 200 }}>
                                                {[
                                                    {k:'weight_loss',t:'Weight Loss'},
                                                    {k:'cardio',t:'Cardio'},
                                                    {k:'strength',t:'Strength'},
                                                    {k:'mobility',t:'Mobility'},
                                                    {k:'muscle_gain',t:'Muscle Gain'}
                                                ].map(opt => (
                                                    <TouchableOpacity key={opt.k} style={{ padding: 16, alignItems: 'center' }} onPress={() => setPickerValue(opt.k)}>
                                                        <Text style={{ fontSize: 24, color: pickerValue === opt.k ? theme.primaryGreen || '#58e221' : theme.primaryDark }}>{opt.t}</Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </ScrollView>
                                        )}
                                    </View>
                                </View>
                            </Modal>
                        </>
                    ) : (
                        <>
                            <View style={styles.detailRow}><Text style={styles.detailLabel}>Allergies:</Text><Text style={styles.detailValue}>{
                                (profileDoc?.allergies?.items && Array.isArray(profileDoc.allergies.items) && profileDoc.allergies.items.length > 0)
                                    ? profileDoc.allergies.items.join(', ')
                                    : (profileDoc?.allergies?.items?.other || 'None')
                            }</Text></View>
                            <View style={styles.detailRow}><Text style={styles.detailLabel}>Conditions:</Text><Text style={styles.detailValue}>{
                                (profileDoc?.conditions?.items && Array.isArray(profileDoc.conditions.items) && profileDoc.conditions.items.length > 0)
                                    ? profileDoc.conditions.items.join(', ')
                                    : (profileDoc?.conditions?.items?.other || 'None')
                            }</Text></View>
                            <View style={styles.detailRow}><Text style={styles.detailLabel}>Medications:</Text><Text style={styles.detailValue}>{
                                (profileDoc?.medications && Array.isArray(profileDoc.medications) && profileDoc.medications.length > 0)
                                    ? profileDoc.medications.join(', ')
                                    : (profileDoc?.medications?.items && Array.isArray(profileDoc.medications.items) && profileDoc.medications.items.length > 0)
                                        ? profileDoc.medications.items.join(', ')
                                        : (typeof profileDoc?.medications === 'string' && profileDoc.medications)
                                            ? profileDoc.medications
                                            : (profileDoc?.medications?.items?.notes || 'None')
                            }</Text></View>
                            <View style={styles.detailRow}><Text style={styles.detailLabel}>Injuries:</Text><Text style={styles.detailValue}>{
                                (profileDoc?.injuries?.items && Array.isArray(profileDoc.injuries.items) && profileDoc.injuries.items.length > 0)
                                    ? profileDoc.injuries.items.join(', ')
                                    : (profileDoc?.injuries?.items?.notes || 'None')
                            }</Text></View>
                            <View style={styles.detailRow}><Text style={styles.detailLabel}>Fitness Goal:</Text><Text style={styles.detailValue}>{profileDoc?.fitness?.goal || 'None'}</Text></View>
                        </>
                    )}
                </View>
            </ScrollView>
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
        marginBottom: 170,
    },
    headerTitleBig: {
        fontSize: 22,
        fontWeight: 'bold',
        color: theme.altText,
    },
    backButton: {
        marginRight: 12,
        padding: 6,
        borderRadius: 28,
        backgroundColor: theme.translucent,
    },
    detailCard: {
        backgroundColor: theme.cardBackground || '#fff',
        borderRadius: 28,
        marginHorizontal: 18,
        marginTop: 0,
        padding: 30,
        paddingHorizontal: 20,
        shadowColor: theme.shadow || '#000',
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 2,
    },
    detailScroll: {
        flexGrow: 0,
        backgroundColor: 'transparent',
        borderRadius: 18,
        marginHorizontal: 0,
        marginTop: 200,
        marginBottom: 0,
        padding: 15,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    detailTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    iconBtn: {
        marginLeft: 8,
        padding: 6,
        borderRadius: 8,
        backgroundColor: theme.translucent,
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
});
