import { db } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';
import { ThemeContext } from '@/context/ThemeContext';
import { Feather, Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { deleteUser } from 'firebase/auth';
import { deleteDoc, doc, getDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import React, { useContext, useEffect, useState } from 'react';
import {
    ActivityIndicator, Alert, Image, Modal, Platform, ScrollView,
    StyleSheet, Text, TextInput, TouchableOpacity, View
} from 'react-native';

export default function ProfileScreen() {
  const { theme, colorScheme, toggleTheme } = useContext(ThemeContext);
  const styles = createStyles(theme);
  const { user, loading: authLoading, logout } = useAuth();

  const [userDoc, setUserDoc] = useState(null);
  const [profileDoc, setProfileDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

  const [picker, setPicker] = useState({ field: null, visible: false });
  const [pickerValue, setPickerValue] = useState('');
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  // Derived display values (with legacy fallbacks)
  const displayName     = userDoc?.name || user?.displayName || 'Unknown';
  const displayEmail    = userDoc?.email || user?.email || 'Unknown';
  const displaySex      =
    profileDoc?.sexAtBirth ??
    userDoc?.profile?.sexAtBirth ??
    userDoc?.profile?.sex ??
    '-';
  const displayBirthday =
    profileDoc?.birthDate ??
    userDoc?.profile?.birthDate ??
    userDoc?.profile?.birthday ??
    '-';
  const displayHeight   =
    profileDoc?.heightCm ??
    userDoc?.profile?.heightCm ??
    '-';
  const displayWeight   =
    profileDoc?.weightKg ??
    userDoc?.profile?.weightKg ??
    '-';

  const profileImageUrl = 'https://www.gravatar.com/avatar/?d=mp&s=200';

  // Editable fields
  const [editFields, setEditFields] = useState({
    name: '',
    email: '',
    sexAtBirth: '',
    birthDate: '',
    heightCm: '',
    weightKg: '',
  });

  // Logout
  const handleLogout = async () => {
    try { await logout(); router.replace('/(auth)/login'); } catch {}
  };

  // Fetch user + health profile
  useEffect(() => {
    (async () => {
      if (!user) { setUserDoc(null); setProfileDoc(null); setLoading(false); return; }
      setLoading(true);
      try {
        const mainSnap = await getDoc(doc(db, 'users', user.uid));
        setUserDoc(mainSnap.exists() ? mainSnap.data() : null);

        // ✅ Correct path used by onboarding/signup
        const hpSnap = await getDoc(doc(db, 'users', user.uid, 'private', 'healthProfile'));
        setProfileDoc(hpSnap.exists() ? hpSnap.data() : null);
      } catch (e) {
        setUserDoc(null);
        setProfileDoc(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  // Seed edit fields whenever data is ready
  useEffect(() => {
    setEditFields({
      name: displayName,
      email: displayEmail,
      sexAtBirth: displaySex === '-' ? '' : displaySex,
      birthDate: displayBirthday === '-' ? '' : displayBirthday,
      heightCm: displayHeight === '-' ? '' : String(displayHeight),
      weightKg: displayWeight === '-' ? '' : String(displayWeight),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayName, displayEmail, displaySex, displayBirthday, displayHeight, displayWeight]);

  const handleFieldChange = (field, value) =>
    setEditFields(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!user) return;
    try {
      const uid = user.uid;

      // Calculate age for legacy main user profile if you still want to keep it
      let age = null;
      if (editFields.birthDate) {
        const b = new Date(editFields.birthDate);
        if (!isNaN(b.getTime())) {
          const t = new Date();
          age = t.getFullYear() - b.getFullYear();
          const md = t.getMonth() - b.getMonth();
          if (md < 0 || (md === 0 && t.getDate() < b.getDate())) age--;
        }
      }

      const batch = writeBatch(db);

      // Update main user doc for name/email + (optional) legacy mirror
      const userRef = doc(db, 'users', uid);
      batch.update(userRef, {
        name: editFields.name,
        email: editFields.email,
        'profile.sexAtBirth': editFields.sexAtBirth || null,
        'profile.birthDate':  editFields.birthDate  || null,
        'profile.birthday':   editFields.birthDate  || null, // legacy key if present elsewhere
        'profile.age':        age,
        'profile.heightCm':   editFields.heightCm ? Number(editFields.heightCm) : null,
        'profile.weightKg':   editFields.weightKg ? Number(editFields.weightKg) : null,
        updatedAt:            serverTimestamp(),
      });

      // Update private + public health docs (source of truth)
      const hpPriv = doc(db, 'users', uid, 'private', 'healthProfile');
      const hpPub  = doc(db, 'users', uid, 'public',  'healthInformation');

      const payload = {
        sexAtBirth: editFields.sexAtBirth || null,
        birthDate:  editFields.birthDate  || null,
        heightCm:   editFields.heightCm ? Number(editFields.heightCm) : null,
        weightKg:   editFields.weightKg ? Number(editFields.weightKg) : null,
        updatedAt:  serverTimestamp(),
      };

      batch.set(hpPriv, payload, { merge: true });
      batch.set(hpPub,  payload, { merge: true });

      await batch.commit();

      // reflect locally
      setUserDoc(prev => ({
        ...(prev || {}),
        name: editFields.name,
        email: editFields.email,
        profile: {
          ...((prev && prev.profile) || {}),
          sexAtBirth: editFields.sexAtBirth || null,
          birthDate:  editFields.birthDate  || null,
          birthday:   editFields.birthDate  || null,
          age,
          heightCm:   editFields.heightCm ? Number(editFields.heightCm) : null,
          weightKg:   editFields.weightKg ? Number(editFields.weightKg) : null,
        },
      }));
      setProfileDoc(prev => ({
        ...(prev || {}),
        ...payload,
      }));

      setEditMode(false);
      Alert.alert('Success', 'Profile updated successfully.');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to update profile.');
    }
  };

  const handleCancel = () => {
    setEditFields({
      name: displayName,
      email: displayEmail,
      sexAtBirth: displaySex === '-' ? '' : displaySex,
      birthDate: displayBirthday === '-' ? '' : displayBirthday,
      heightCm: displayHeight === '-' ? '' : String(displayHeight),
      weightKg: displayWeight === '-' ? '' : String(displayWeight),
    });
    setEditMode(false);
  };

  // Delete account (kept your logic but fixed private doc path)
  const handleDeleteAccount = async () => {
    if (!user) return;
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive', onPress: async () => {
            try {
              const uid = user.uid;
              await deleteDoc(doc(db, 'users', uid, 'private', 'healthProfile'));
              await deleteDoc(doc(db, 'users', uid)); // main doc
              await deleteUser(user);
              Alert.alert('Success', 'Your account has been deleted.');
              router.replace('/(auth)/login');
            } catch (error) {
              console.error('Error deleting account:', error);
              if (error?.code === 'auth/requires-recent-login') {
                Alert.alert('Re-authentication Required', 'Please log out and back in before deleting your account.');
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
      {/* Header */}
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

      {/* Card */}
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

        {editMode ? (
          <>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Name:</Text>
              <TextInput
                style={[styles.input, styles.clickableField]}
                value={editFields.name}
                onChangeText={(v) => handleFieldChange('name', v)}
              />
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Email:</Text>
              <TextInput
                style={[styles.input, styles.clickableField]}
                value={editFields.email}
                onChangeText={(v) => handleFieldChange('email', v)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              style={styles.detailRow}
              activeOpacity={0.7}
              onPress={() => { setPicker({ field: 'sexAtBirth', visible: true }); setPickerValue(editFields.sexAtBirth || 'male'); }}
            >
              <Text style={styles.detailLabel}>Sex at birth:</Text>
              <Text style={[styles.detailValue, styles.clickableField]}>
                {editFields.sexAtBirth || 'Select'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.detailRow}
              activeOpacity={0.7}
              onPress={() => setDatePickerVisible(true)}
            >
              <Text style={styles.detailLabel}>Birth date:</Text>
              <Text style={[styles.detailValue, styles.clickableField]}>
                {editFields.birthDate || 'Select'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.detailRow}
              activeOpacity={0.7}
              onPress={() => { setPicker({ field: 'heightCm', visible: true }); setPickerValue(editFields.heightCm || '160'); }}
            >
              <Text style={styles.detailLabel}>Height (cm):</Text>
              <Text style={[styles.detailValue, styles.clickableField]}>
                {editFields.heightCm || 'Select'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.detailRow}
              activeOpacity={0.7}
              onPress={() => { setPicker({ field: 'weightKg', visible: true }); setPickerValue(editFields.weightKg || '60'); }}
            >
              <Text style={styles.detailLabel}>Weight (kg):</Text>
              <Text style={[styles.detailValue, styles.clickableField]}>
                {editFields.weightKg || 'Select'}
              </Text>
            </TouchableOpacity>

            {/* Picker Modal */}
            <Modal
              visible={picker.visible}
              transparent
              animationType="slide"
              onRequestClose={() => setPicker({ field: null, visible: false })}
            >
              <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)' }}>
                <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                    <TouchableOpacity onPress={() => setPicker({ field: null, visible: false })}>
                      <Text style={{ color: theme.error || '#F44336', fontWeight: 'bold' }}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => {
                      setEditFields(prev => ({ ...prev, [picker.field]: pickerValue }));
                      setPicker({ field: null, visible: false });
                    }}>
                      <Text style={{ color: theme.primaryGreen || '#58e221', fontWeight: 'bold' }}>Save</Text>
                    </TouchableOpacity>
                  </View>

                  {picker.field === 'sexAtBirth' && (
                    <View>
                      {['male', 'female', 'intersex', 'prefer_not_to_say'].map(option => (
                        <TouchableOpacity key={option} style={{ padding: 16, alignItems: 'center' }} onPress={() => setPickerValue(option)}>
                          <Text style={{ fontSize: 20, textTransform: 'capitalize', color: pickerValue === option ? theme.primaryGreen || '#58e221' : theme.primaryDark }}>
                            {option.replace(/_/g,' ')}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {picker.field === 'heightCm' && (
                    <View style={{ alignItems: 'center' }}>
                      <ScrollView style={{ maxHeight: 220 }}>
                        {[...Array(221).keys()].slice(120).map(h => (
                          <TouchableOpacity key={h} style={{ padding: 12 }} onPress={() => setPickerValue(String(h))}>
                            <Text style={{ fontSize: 20, color: pickerValue === String(h) ? theme.primaryGreen || '#58e221' : theme.primaryDark }}>{h} cm</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}

                  {picker.field === 'weightKg' && (
                    <View style={{ alignItems: 'center' }}>
                      <ScrollView style={{ maxHeight: 220 }}>
                        {[...Array(201).keys()].slice(30).map(w => (
                          <TouchableOpacity key={w} style={{ padding: 12 }} onPress={() => setPickerValue(String(w))}>
                            <Text style={{ fontSize: 20, color: pickerValue === String(w) ? theme.primaryGreen || '#58e221' : theme.primaryDark }}>{w} kg</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              </View>
            </Modal>

            {/* Date Picker */}
            <Modal
              visible={datePickerVisible}
              transparent
              animationType="slide"
              onRequestClose={() => setDatePickerVisible(false)}
            >
              <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)' }}>
                <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                    <TouchableOpacity onPress={() => setDatePickerVisible(false)}>
                      <Text style={{ color: theme.error || '#F44336', fontWeight: 'bold' }}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setDatePickerVisible(false)}>
                      <Text style={{ color: theme.primaryGreen || '#58e221', fontWeight: 'bold' }}>Done</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={
                      !editFields.birthDate || isNaN(new Date(editFields.birthDate).getTime())
                        ? new Date(2000, 0, 1)
                        : new Date(editFields.birthDate)
                    }
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, date) => {
                      if (date) {
                        const iso = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().split('T')[0];
                        setEditFields(prev => ({ ...prev, birthDate: iso }));
                      }
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
            <View style={styles.detailRow}><Text style={styles.detailLabel}>Sex at birth:</Text><Text style={styles.detailValue}>{displaySex}</Text></View>
            <View style={styles.detailRow}><Text style={styles.detailLabel}>Birth date:</Text><Text style={styles.detailValue}>{displayBirthday}</Text></View>
            <View style={styles.detailRow}><Text style={styles.detailLabel}>Height (cm):</Text><Text style={styles.detailValue}>{displayHeight}</Text></View>
            <View style={styles.detailRow}><Text style={styles.detailLabel}>Weight (kg):</Text><Text style={styles.detailValue}>{displayWeight}</Text></View>
          </>
        )}
      </View>
    </View>
  );
}

const createStyles = (theme) => StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: theme.background },
  headerCard: {
    backgroundColor: theme.primaryDark,
    borderBottomLeftRadius: 30, borderBottomRightRadius: 30,
    paddingBottom: 30, paddingTop: 20, paddingHorizontal: 20,
    alignItems: 'center', shadowColor: theme.shadow, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 10 },
  headerTitleBig: { fontSize: 22, fontWeight: 'bold', color: theme.altText },
  profileImageWrapper: {
    marginTop: 10, marginBottom: 10, borderWidth: 4, borderColor: '#fff',
    borderRadius: 999, padding: 4, backgroundColor: '#fff', alignItems: 'center',
    justifyContent: 'center', overflow: 'hidden',
  },
  profileImageBig: { width: 120, height: 120, borderRadius: 60, resizeMode: 'cover' },
  backButton: { marginRight: 12, padding: 6, borderRadius: 28, backgroundColor: theme.translucent },
  themeButton: { marginLeft: 'auto', padding: 6, borderRadius: 28, backgroundColor: theme.translucent },
  themeIcon: { fontSize: 20 },

  detailCard: {
    backgroundColor: theme.background || '#fff',
    borderRadius: 28, marginHorizontal: 18, marginTop: -30, padding: 30,
    shadowColor: theme.shadow || '#000', shadowOpacity: 0.5, shadowRadius: 8, elevation: 2,
  },
  detailTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  detailTitle: { fontSize: 20, fontWeight: 'bold', color: theme.primaryDark, marginBottom: 18, textAlign: 'center' },

  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  detailLabel: { fontSize: 16, color: theme.textSecondary || '#888', fontWeight: 'bold' },
  detailValue: { fontSize: 16, color: theme.primaryDark, fontWeight: 'bold' },

  input: {
    flex: 1, backgroundColor: theme.cardBackground, borderRadius: 8, padding: 8, fontSize: 16,
    color: theme.primaryDark, borderWidth: 1, borderColor: theme.textSecondary, marginLeft: 8,
    minWidth: 180, maxWidth: 180,
  },
  clickableField: {
    backgroundColor: theme.cardBackground || '#f2fdf6',
    borderRadius: 10, borderWidth: 1, borderColor: theme.primaryGreen || '#e0f5e7',
    paddingVertical: 10, paddingHorizontal: 12, marginBottom: 12, minHeight: 44, width: 180,
  },
  iconBtn: { marginLeft: 8, padding: 6, borderRadius: 8, backgroundColor: theme.translucent },
});
