// app/(profile)/(health)/index.jsx
import { db } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';
import { ThemeContext } from '@/context/ThemeContext';
import { Feather, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { doc, getDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const toArray = (v) => (Array.isArray(v) ? v : v ? [v] : []);
const uniqClean = (arr) =>
  Array.from(new Set(toArray(arr).map((x) => `${x}`.trim()).filter(Boolean)));

function normalizeProfile(raw) {
  if (!raw) {
    return {
      allergies: [],
      conditions: [],
      injuries: [],
      medications: '',
      fitness: { goal: '' },
      updatedAt: null,
      completed: false,
    };
  }

  const mergeBucket = (bucket) => {
    if (!bucket) return [];
    if (Array.isArray(bucket)) return uniqClean(bucket);
    const items = Array.isArray(bucket.items) ? bucket.items : [];
    const other = bucket?.items?.other || bucket?.other || '';
    const notes = bucket?.items?.notes || bucket?.notes || '';
    return uniqClean([...items, other || notes].filter(Boolean));
  };

  const allergies = mergeBucket(raw.allergies);
  const conditions = mergeBucket(raw.conditions);
  const injuries = mergeBucket(raw.injuries);

  let medications = '';
  if (typeof raw?.medications === 'string') {
    medications = raw.medications;
  } else if (Array.isArray(raw?.medications)) {
    medications = uniqClean(raw.medications).join(', ');
  } else if (raw?.medications?.items) {
    const medItems = Array.isArray(raw.medications.items) ? raw.medications.items : [];
    const notes = raw.medications.items?.notes || raw.medications?.notes || '';
    medications = uniqClean([...medItems, notes].filter(Boolean)).join(', ');
  } else if (raw?.medications?.notes) {
    medications = `${raw.medications.notes}`;
  }

  const goal = raw?.fitness?.goal || raw?.fitnessGoal || '';

  return {
    allergies,
    conditions,
    injuries,
    medications,
    fitness: { goal: `${goal}` },
    updatedAt: raw?.updatedAt || null,
    completed: !!raw?.completed,
  };
}

export default function HealthInfoScreen() {
  const { theme } = useContext(ThemeContext);
  const styles = useMemo(() => createStyles(theme), [theme]);

  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [profileDoc, setProfileDoc] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [picker, setPicker] = useState({ field: null, visible: false });
  const [pickerValue, setPickerValue] = useState('');

  const [editFields, setEditFields] = useState({
    allergies: '',
    conditions: '',
    injuries: '',
    medications: '',
    fitness: '',
  });

  // Fetch: new private (source of truth), then new public, then legacy
  useEffect(() => {
    let mounted = true;
    const run = async () => {
      if (!user) {
        mounted && setProfileDoc(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const refNewPriv = doc(db, 'users', user.uid, 'private', 'healthProfile');
        const refNewPub = doc(db, 'users', user.uid, 'public', 'healthInformation'); // ✅ fixed
        const refOld = doc(db, 'users', user.uid, 'private', 'health_profile'); // legacy

        const [s1, s2, s3] = await Promise.all([getDoc(refNewPriv), getDoc(refNewPub), getDoc(refOld)]);
        const raw = s1.exists() ? s1.data() : s2.exists() ? s2.data() : s3.exists() ? s3.data() : null;
        const norm = normalizeProfile(raw);

        if (!mounted) return;
        setProfileDoc(norm);
        setEditFields({
          allergies: '',
          conditions: '',
          injuries: '',
          medications: norm.medications || '',
          fitness: norm.fitness?.goal || '',
        });
      } catch (e) {
        if (!mounted) return;
        setProfileDoc(normalizeProfile(null));
      } finally {
        if (mounted) setLoading(false);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, [user]);

  const handleFieldChange = (field, value) => {
    setEditFields((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!user) return;

    const next = {
      allergies: uniqClean([...(profileDoc?.allergies || []), editFields.allergies].filter(Boolean)),
      conditions: uniqClean([...(profileDoc?.conditions || []), editFields.conditions].filter(Boolean)),
      injuries: uniqClean([...(profileDoc?.injuries || []), editFields.injuries].filter(Boolean)),
      medications: (editFields.medications || '').trim(),
      fitness: { goal: (editFields.fitness || '').trim() },
      updatedAt: serverTimestamp(),
    };

    try {
      const batch = writeBatch(db);
      const refPrivate = doc(db, 'users', user.uid, 'private', 'healthProfile');
      const refPublic = doc(db, 'users', user.uid, 'public', 'healthInformation'); // ✅ fixed

      batch.set(refPrivate, next, { merge: true });
      batch.set(refPublic, next, { merge: true });
      await batch.commit();

      setProfileDoc((prev) => ({ ...(prev || {}), ...next }));
      setEditMode(false);
      Alert.alert('Success', 'Health information updated successfully.');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to update health information.');
    }
  };

  const handleCancel = () => {
    setEditFields({
      allergies: '',
      conditions: '',
      injuries: '',
      medications: profileDoc?.medications || '',
      fitness: profileDoc?.fitness?.goal || '',
    });
    setEditMode(false);
    setPicker({ field: null, visible: false });
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
      {/* Header */}
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitleBig}>Health Information</Text>
        </View>
      </View>

      <ScrollView style={styles.detailScroll} showsVerticalScrollIndicator={false}>
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
              <TouchableOpacity
                style={styles.detailRow}
                activeOpacity={0.7}
                onPress={() => {
                  setPicker({ field: 'allergies', visible: true });
                  setPickerValue(editFields.allergies);
                }}
              >
                <Text style={styles.detailLabel}>Allergies:</Text>
                <Text
                  style={[styles.detailValue, styles.clickableField]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {editFields.allergies || 'Select'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.detailRow}
                activeOpacity={0.7}
                onPress={() => {
                  setPicker({ field: 'conditions', visible: true });
                  setPickerValue(editFields.conditions);
                }}
              >
                <Text style={styles.detailLabel}>Conditions:</Text>
                <Text
                  style={[styles.detailValue, styles.clickableField]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {editFields.conditions || 'Select'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.detailRow}
                activeOpacity={0.7}
                onPress={() => {
                  setPicker({ field: 'injuries', visible: true });
                  setPickerValue(editFields.injuries);
                }}
              >
                <Text style={styles.detailLabel}>Injuries:</Text>
                <Text
                  style={[styles.detailValue, styles.clickableField]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {editFields.injuries || 'Select'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.detailRow}
                activeOpacity={0.7}
                onPress={() => {
                  setPicker({ field: 'fitness', visible: true });
                  setPickerValue(editFields.fitness);
                }}
              >
                <Text style={styles.detailLabel}>Fitness Goal:</Text>
                <Text
                  style={[styles.detailValue, styles.clickableField]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {editFields.fitness || 'Select'}
                </Text>
              </TouchableOpacity>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Medications:</Text>
                <TextInput
                  style={[styles.detailValue, styles.clickableField]}
                  value={editFields.medications}
                  onChangeText={(v) => handleFieldChange('medications', v)}
                  placeholder="Enter medications (comma-separated)"
                />
              </View>

              <Modal
                visible={picker.visible}
                transparent
                animationType="slide"
                onRequestClose={() => setPicker({ field: null, visible: false })}
              >
                <View
                  style={{
                    flex: 1,
                    justifyContent: 'flex-end',
                    backgroundColor: 'rgba(0,0,0,0.3)',
                  }}
                >
                  <View
                    style={{
                      backgroundColor: '#fff',
                      borderTopLeftRadius: 16,
                      borderTopRightRadius: 16,
                      padding: 16,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        marginBottom: 12,
                      }}
                    >
                      <TouchableOpacity
                        onPress={() => setPicker({ field: null, visible: false })}
                      >
                        <Text
                          style={{ color: theme.error || '#F44336', fontWeight: 'bold' }}
                        >
                          Cancel
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          setEditFields((prev) => ({ ...prev, [picker.field]: pickerValue }));
                          setPicker({ field: null, visible: false });
                        }}
                      >
                        <Text
                          style={{
                            color: theme.primaryGreen || '#58e221',
                            fontWeight: 'bold',
                          }}
                        >
                          Save
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {picker.field === 'allergies' && (
                      <ScrollView style={{ maxHeight: 220 }}>
                        {[
                          'peanuts',
                          'shellfish',
                          'milk',
                          'eggs',
                          'soy',
                          'wheat',
                          'tree_nuts',
                          'fish',
                          'sesame',
                          'other',
                        ].map((opt) => (
                          <TouchableOpacity
                            key={opt}
                            style={{ padding: 16, alignItems: 'center' }}
                            onPress={() => setPickerValue(opt)}
                          >
                            <Text
                              style={{
                                fontSize: 22,
                                color:
                                  pickerValue === opt
                                    ? theme.primaryGreen || '#58e221'
                                    : theme.primaryDark,
                              }}
                            >
                              {opt.replace(/_/g, ' ')}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    )}

                    {picker.field === 'conditions' && (
                      <ScrollView style={{ maxHeight: 220 }}>
                        {[
                          'asthma',
                          'diabetes',
                          'hypertension',
                          'thyroid',
                          'anxiety',
                          'depression',
                          'eczema',
                          'other',
                        ].map((opt) => (
                          <TouchableOpacity
                            key={opt}
                            style={{ padding: 16, alignItems: 'center' }}
                            onPress={() => setPickerValue(opt)}
                          >
                            <Text
                              style={{
                                fontSize: 22,
                                color:
                                  pickerValue === opt
                                    ? theme.primaryGreen || '#58e221'
                                    : theme.primaryDark,
                              }}
                            >
                              {opt.replace(/_/g, ' ')}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    )}

                    {picker.field === 'injuries' && (
                      <ScrollView style={{ maxHeight: 220 }}>
                        {['knee', 'shoulder', 'back', 'ankle', 'hip', 'other'].map((opt) => (
                          <TouchableOpacity
                            key={opt}
                            style={{ padding: 16, alignItems: 'center' }}
                            onPress={() => setPickerValue(opt)}
                          >
                            <Text
                              style={{
                                fontSize: 22,
                                color:
                                  pickerValue === opt
                                    ? theme.primaryGreen || '#58e221'
                                    : theme.primaryDark,
                              }}
                            >
                              {opt.replace(/_/g, ' ')}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    )}

                    {picker.field === 'fitness' && (
                      <ScrollView style={{ maxHeight: 220 }}>
                        {[
                          { k: 'Weight Loss', t: 'Weight Loss' },
                          { k: 'Cardio', t: 'Cardio' },
                          { k: 'Strength', t: 'Strength' },
                          { k: 'Mobility', t: 'Mobility' },
                          { k: 'Muscle Gain', t: 'Muscle Gain' },
                        ].map((opt) => (
                          <TouchableOpacity
                            key={opt.k}
                            style={{ padding: 16, alignItems: 'center' }}
                            onPress={() => setPickerValue(opt.k)}
                          >
                            <Text
                              style={{
                                fontSize: 22,
                                color:
                                  pickerValue === opt.k
                                    ? theme.primaryGreen || '#58e221'
                                    : theme.primaryDark,
                              }}
                            >
                              {opt.t}
                            </Text>
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
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Allergies:</Text>
                <Text style={styles.detailValue}>
                  {profileDoc?.allergies?.length ? profileDoc.allergies.join(', ') : 'None'}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Conditions:</Text>
                <Text style={styles.detailValue}>
                  {profileDoc?.conditions?.length ? profileDoc.conditions.join(', ') : 'None'}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Medications:</Text>
                <Text style={styles.detailValue}>
                  {profileDoc?.medications ? profileDoc.medications : 'None'}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Injuries:</Text>
                <Text style={styles.detailValue}>
                  {profileDoc?.injuries?.length ? profileDoc.injuries.join(', ') : 'None'}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Fitness Goal:</Text>
                <Text style={styles.detailValue}>{profileDoc?.fitness?.goal || 'None'}</Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (theme) =>
  StyleSheet.create({
    wrapper: { flex: 1, backgroundColor: theme.background },
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
    headerTitleBig: { fontSize: 22, fontWeight: 'bold', color: theme.altText },
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
    iconBtn: { marginLeft: 8, padding: 6, borderRadius: 8, backgroundColor: theme.translucent },
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
    detailLabel: { fontSize: 16, color: theme.textSecondary || '#888', fontWeight: 'bold' },
    detailValue: {
      fontSize: 16,
      color: theme.primaryDark,
      fontWeight: 'bold',
      flexShrink: 1,
      textAlign: 'right',
      marginLeft: 12,
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
      minHeight: 44,
      width: 180,
      textAlign: 'right',
    },
    clickableValue: { color: theme.primaryGreen || '#1db954', fontWeight: '600' },
  });
