import { MaterialIcons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { router } from 'expo-router';
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Circle, G, Svg } from 'react-native-svg';

import { db } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';
import { ThemeContext } from '@/context/ThemeContext';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';


const DAILY_GOAL_KCAL = 1000; // adjust your goal
const ACTIVITY_TYPES = ['Running', 'Walking', 'Cycling', 'Swimming', 'Weights', 'Yoga', 'HIIT'];

export default function ActivityTrackerScreen() {
  const { theme, colorScheme } = useContext(ThemeContext);
  const styles = useMemo(() => createStyles(theme), [theme, colorScheme]);
  const { user } = useAuth();

  // UI
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form
  const [type, setType] = useState('Running');
  const [calories, setCalories] = useState('');    // string for controlled input
  const [distanceKm, setDistanceKm] = useState('');
  const [durationMin, setDurationMin] = useState('');
  const [notes, setNotes] = useState('');

  // Inputs refs for better Android focus behavior
  const kcalRef = useRef(null);
  const distRef = useRef(null);
  const durRef  = useRef(null);
  const notesRef= useRef(null);

  // Calorie Burn Goal Ring + Stats
  const [goalKcal, setGoalKcal] = useState(1000);
  const [editingGoal, setEditingGoal] = useState(false);

  // Data
  const [activities, setActivities] = useState([]);

  // Today
  const { startISO, titleDate } = useMemo(() => {
    const start = dayjs().startOf('day');
    return { startISO: start.format('YYYY-MM-DD'), titleDate: dayjs().format('MMMM D') };
  }, []);

  // Listen to today's activities (NO orderBy ⇒ NO composite index)
  useEffect(() => {
    if (!user?.uid) return;

    const colRef = collection(db, 'users', user.uid, 'activity_log');
    const qy = query(colRef, where('dateISO', '==', startISO));

    const unsub = onSnapshot(qy, (snap) => {
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() || {}) }));
      // sort client-side by createdAt desc
      list.sort((a, b) => (b?.createdAt?.seconds || 0) - (a?.createdAt?.seconds || 0));
      setActivities(list);
    });

    return () => unsub();
  }, [user?.uid, startISO]);

    // Totals + progress ring
    const totalKcal = useMemo(
    () => activities.reduce((sum, a) => sum + Number(a.calories || 0), 0),
    [activities]
    );
  // progress uses the user's goal (not the hardcoded constant)
const progress = Math.max(
  0,
  Math.min(1, totalKcal / Math.max(1, Number(goalKcal) || 1000))
);

// size + stroke scale with goal
const ring = useMemo(() => {
  // Map goal ⇒ size:
  //   200 kcal → 120px
  //  1000 kcal → 160px
  //  4000 kcal → 220px
  const g = Math.max(200, Math.min(4000, Number(goalKcal) || 1000));
  const size = Math.round(120 + ((g - 200) / (4000 - 200)) * (220 - 120));

  // stroke width scales with size (kept in a nice range)
  const stroke = Math.max(12, Math.min(24, Math.round(size * 0.12)));

  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const dash = circumference * progress;

  return { size, stroke, r, circumference, dash };
}, [goalKcal, progress]);

    // Load or create daily burn goal
    useEffect(() => {
    if (!user?.uid) return;
    const docRef = doc(db, 'users', user.uid, 'private', 'activity_settings');
    const unsub = onSnapshot(docRef, (snap) => {
        if (snap.exists()) {
        const data = snap.data();
        if (data.goalKcal) setGoalKcal(data.goalKcal);
        }
    });
    return () => unsub();
    }, [user?.uid]);

    const saveGoal = async (newGoal) => {
    if (!user?.uid) return;
    try {
        await setDoc(
        doc(db, 'users', user.uid, 'private', 'activity_settings'),
        { goalKcal: Number(newGoal) || 1000 },
        { merge: true }
        );
    } catch (e) {
        console.error('Failed to save goal', e);
    }
    };


  // Helpers
  const resetForm = () => {
    setEditingId(null);
    setType('Running');
    setCalories('');
    setDistanceKm('');
    setDurationMin('');
    setNotes('');
  };

  const openForCreate = () => {
    resetForm();
    setShowModal(true);
    setTimeout(() => kcalRef.current?.focus(), 100);
  };

  const openForEdit = (item) => {
    setEditingId(item.id);
    setType(item.type || 'Running');
    setCalories(item.calories != null ? String(item.calories) : '');
    setDistanceKm(item.distanceKm != null ? String(item.distanceKm) : '');
    setDurationMin(item.durationMin != null ? String(item.durationMin) : '');
    setNotes(item.notes || '');
    setShowModal(true);
    setTimeout(() => kcalRef.current?.focus(), 100);
  };

  // Validation + persist
  const saveActivity = async () => {
    if (!user?.uid) {
      Alert.alert('Not signed in', 'Please sign in first.');
      return;
    }
    if (!type) {
      Alert.alert('Missing type', 'Please select an activity type.');
      return;
    }
    if (!calories && !distanceKm && !durationMin) {
      Alert.alert('Missing details', 'Enter at least calories, distance or duration.');
      return;
    }

    const toNum = (v) => {
      const n = parseFloat(String(v).replace(',', '.'));
      return Number.isFinite(n) ? n : null;
    };

    const payload = {
      type,
      calories: toNum(calories),
      distanceKm: ['Running', 'Walking', 'Cycling', 'Swimming'].includes(type) ? toNum(distanceKm) : null,
      durationMin: toNum(durationMin),
      notes: notes?.trim() || null,
      dateISO: dayjs().format('YYYY-MM-DD'),
      ...(editingId ? {} : { createdAt: serverTimestamp() }),
      updatedAt: serverTimestamp(),
    };

    try {
      setSaving(true);
      const base = collection(db, 'users', user.uid, 'activity_log');

      if (editingId) {
        await updateDoc(doc(base, editingId), payload);
      } else {
        await addDoc(base, payload);
      }

      setShowModal(false);
      resetForm();
    } catch (e) {
      console.error('Save error:', e);
      Alert.alert('Error', 'Could not save activity. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async (id) => {
    if (!user?.uid || !id) return;
    Alert.alert('Delete Activity', 'Are you sure you want to delete this entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDoc(doc(db, 'users', user.uid, 'activity_log', id));
          } catch (e) {
            console.error('Delete error:', e);
            Alert.alert('Error', 'Failed to delete.');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Activity Tracker</Text>
          <Text style={styles.headerSubtitle}>Track your daily burn</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/(tabs)/(tracker)/(activity)/history')} style={styles.historyButton}>
          <MaterialIcons name="history" size={22} color={theme.text} />
        </TouchableOpacity>
      </View>

      {/* Goal card */}
    <View style={styles.heroCard}>
        <View style={[styles.ringWrap, { width: ring.size, height: ring.size }]}>
            <Svg width={ring.size} height={ring.size}>
                <G rotation="-90" origin={`${ring.size / 2}, ${ring.size / 2}`}>
                <Circle
                    cx={ring.size / 2}
                    cy={ring.size / 2}
                    r={ring.r}
                    stroke={theme.inactive}
                    strokeWidth={ring.stroke}
                    fill="none"
                />
                <Circle
                    cx={ring.size / 2}
                    cy={ring.size / 2}
                    r={ring.r}
                    stroke={theme.primary}
                    strokeWidth={ring.stroke}
                    strokeDasharray={ring.circumference}
                    strokeDashoffset={ring.circumference - ring.dash}
                    strokeLinecap="round"
                    fill="none"
                />
                </G>
            </Svg>
        </View>
        
        <View style={styles.heroText}>
            <Text style={styles.heroLabel}>Burned</Text>
            <Text style={styles.heroKcal}>
            {totalKcal}/{goalKcal}{' '}
            <Text style={styles.heroSub}>KCAL</Text>
            </Text>

            <TouchableOpacity
            onPress={() => setEditingGoal(true)}
            style={{ marginTop: 6 }}
            >
            <Text style={{ color: theme.primary, fontWeight: '700', fontSize: 13 }}>
                Edit Daily Goal
            </Text>
            </TouchableOpacity>
        </View>
    </View>
      {/* Date pill */}
      <View style={styles.dayPill}>
        <Text style={styles.dayTxt}>{titleDate}</Text>
      </View>

      {/* List */}
      <ScrollView
        style={{ flex: 1, paddingHorizontal: 16 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {activities.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTxt}>No activities logged yet</Text>
          </View>
        ) : (
          activities.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemTitle}>{item.type}</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity onPress={() => openForEdit(item)}>
                    <MaterialIcons name="edit" size={20} color={theme.textSecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => confirmDelete(item.id)}>
                    <MaterialIcons name="delete-outline" size={20} color={theme.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.itemRow}>
                {item.calories != null && <Text style={styles.itemMetric}>🔥 {item.calories} kcal</Text>}
                {item.distanceKm != null && <Text style={styles.itemMetric}>📏 {item.distanceKm} km</Text>}
                {item.durationMin != null && <Text style={styles.itemMetric}>⏱ {item.durationMin} min</Text>}
              </View>

              {!!item.notes && <Text style={styles.itemNotes}>{item.notes}</Text>}
            </View>
          ))
        )}

        {/* Shadow feature */}
        <View style={styles.connectCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <MaterialIcons name="watch" size={20} color={theme.text} />
            <Text style={[styles.connectTitle, { marginLeft: 8 }]}>Smart Device</Text>
          </View>
          <Text style={styles.connectText}>
            Coming soon: connect your sport watch or fitness tracker to sync data automatically.
          </Text>
          <TouchableOpacity style={[styles.connectBtn, { backgroundColor: theme.inactive }]} disabled>
            <Text style={[styles.connectBtnTxt, { color: theme.textSecondary }]}>Connect Device (soon)</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={[styles.fab, { backgroundColor: theme.primary }]} onPress={openForCreate}>
        <MaterialIcons name="add" size={28} color="#fff" />
      </TouchableOpacity>

        {/* Goal Edit Modal */}
        <Modal visible={editingGoal} transparent animationType="fade">
        <View style={styles.goalOverlay}>
            <View style={styles.goalCard}>
            <Text style={styles.goalTitle}>Set Daily Burn Goal</Text>
            <TextInput
                value={String(goalKcal)}
                onChangeText={setGoalKcal}
                keyboardType="numeric"
                inputMode="numeric"
                style={{
                backgroundColor: theme.surface,
                color: theme.text,
                borderWidth: 1,
                borderColor: theme.border,
                borderRadius: 10,
                padding: 12,
                fontSize: 18,
                textAlign: 'center',
                marginVertical: 14,
                }}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <TouchableOpacity
                onPress={() => setEditingGoal(false)}
                style={[
                    styles.cancelBtn,
                    { borderColor: theme.border, flex: 1, marginRight: 6 },
                ]}
                >
                <Text style={[styles.cancelTxt, { color: theme.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                onPress={() => {
                    saveGoal(goalKcal);
                    setEditingGoal(false);
                }}
                style={[
                    styles.saveBtn,
                    { backgroundColor: theme.primary, flex: 1, marginLeft: 6 },
                ]}
                >
                <Text style={styles.saveTxt}>Save</Text>
                </TouchableOpacity>
            </View>
            </View>
        </View>
        </Modal>


      {/* Add / Edit Modal */}
        <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
        >
        <KeyboardAvoidingView
            style={styles.modalOverlay}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            // keeps content visible when keyboard up
            keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
        >
            <View style={styles.modalCard}>
            {/* Header */}
            <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{editingId ? 'Edit Activity' : 'Add Activity'}</Text>
                <TouchableOpacity onPress={() => setShowModal(false)}>
                <MaterialIcons name="close" size={22} color={theme.text} />
                </TouchableOpacity>
            </View>

            {/* Body (scrollable) */}
            <ScrollView
                style={{ flex: 1 }}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 28 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Type pills */}
                <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: 14 }}
                contentContainerStyle={{ paddingHorizontal: 2 }}
                >
                <View style={{ flexDirection: 'row', gap: 8 }}>
                    {ACTIVITY_TYPES.map((t) => {
                    const active = t === type;
                    return (
                        <TouchableOpacity
                        key={t}
                        onPress={() => setType(t)}
                        style={[
                            styles.typePill,
                            { backgroundColor: active ? theme.primary : theme.inactive },
                        ]}
                        >
                        <Text style={[styles.typePillTxt, { color: active ? '#fff' : theme.text }]}>
                            {t}
                        </Text>
                        </TouchableOpacity>
                    );
                    })}
                </View>
                </ScrollView>

                {/* Inputs */}
                <View style={styles.row}>
                <LabeledInput
                    ref={kcalRef}
                    label="Calories burned (kcal)"
                    placeholder="e.g. 230"
                    value={calories}
                    onChangeText={setCalories}
                    inputMode="decimal"
                    keyboardType={Platform.OS === 'ios' ? 'decimal-pad' : 'numeric'}
                    returnKeyType="next"
                    onSubmitEditing={() => distRef.current?.focus()}
                    theme={theme}
                />
                </View>

                {['Running', 'Walking', 'Cycling', 'Swimming'].includes(type) && (
                <View style={styles.row}>
                    <LabeledInput
                    ref={distRef}
                    label="Distance (km)"
                    placeholder="e.g. 5.2"
                    value={distanceKm}
                    onChangeText={setDistanceKm}
                    inputMode="decimal"
                    keyboardType={Platform.OS === 'ios' ? 'decimal-pad' : 'numeric'}
                    returnKeyType="next"
                    onSubmitEditing={() => durRef.current?.focus()}
                    theme={theme}
                    />
                </View>
                )}

                <View style={styles.row}>
                <LabeledInput
                    ref={durRef}
                    label="Time (minutes)"
                    placeholder="e.g. 40"
                    value={durationMin}
                    onChangeText={setDurationMin}
                    inputMode="numeric"
                    keyboardType="numeric"
                    returnKeyType="next"
                    onSubmitEditing={() => notesRef.current?.focus()}
                    theme={theme}
                />
                </View>

                <View style={styles.row}>
                <LabeledInput
                    ref={notesRef}
                    label="Notes (optional)"
                    placeholder="Felt strong today"
                    value={notes}
                    onChangeText={setNotes}
                    returnKeyType="done"
                    multiline
                    style={{ minHeight: 90, textAlignVertical: 'top' }}
                    theme={theme}
                />
                </View>
            </ScrollView>

            {/* Footer actions pinned at bottom */}
            <View style={styles.modalActions}>
                <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: theme.border }]}
                onPress={() => setShowModal(false)}
                >
                <Text style={[styles.cancelTxt, { color: theme.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: theme.primary, opacity: saving ? 0.7 : 1 }]}
                onPress={saveActivity}
                disabled={saving}
                >
                <Text style={styles.saveTxt}>{saving ? 'Saving…' : editingId ? 'Update' : 'Save'}</Text>
                </TouchableOpacity>
            </View>
            </View>
        </KeyboardAvoidingView>
        </Modal>
    </View>
  );
}

const LabeledInput = React.forwardRef((props, ref) => {
  const { label, theme, style, ...rest } = props;
  return (
    <View style={{ gap: 8, flex: 1 }}>
      <Text style={{ color: theme.textSecondary, fontSize: 13, fontWeight: '700' }}>{label}</Text>
      <TextInput
        ref={ref}
        placeholderTextColor={theme.textSecondary}
        style={[
          {
            backgroundColor: theme.surface,
            color: theme.text,
            borderWidth: 1,
            borderColor: theme.border,
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: Platform.OS === 'ios' ? 14 : 12,
            fontSize: 16,
          },
          style,
        ]}
        {...rest}
      />
    </View>
  );
});

const createStyles = (theme) =>
  StyleSheet.create({
    container: { 
      flex: 1, 
      backgroundColor: theme.background 
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
    historyButton: {
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

    heroCard: {
      margin: 16,
      backgroundColor: theme.surface,
      borderRadius: 20,
      padding: 20,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    },
    ringWrap: { justifyContent: 'center', alignItems: 'center' },
    heroText: { flex: 1, gap: 4 },
    heroLabel: { 
      color: theme.textSecondary, 
      fontWeight: '600', 
      fontSize: 12,
      textTransform: 'uppercase',
      letterSpacing: 0.5 
    },
    heroKcal: { 
      color: theme.text, 
      fontWeight: 'bold', 
      fontSize: 24 
    },
    heroSub: { 
      color: theme.textSecondary, 
      fontWeight: '600', 
      fontSize: 13 
    },

    dayPill: {
      marginHorizontal: 16,
      backgroundColor: theme.surface,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 3,
    },
    dayTxt: { 
      color: theme.text, 
      fontWeight: 'bold',
      fontSize: 16,
    },
    dayActions: { flexDirection: 'row', alignItems: 'center' },

    emptyCard: {
      marginTop: 12,
      marginHorizontal: 16,
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 24,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 3,
    },
    emptyTxt: { 
      color: theme.textSecondary,
      fontSize: 14,
      textAlign: 'center',
    },

    itemCard: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 16,
      marginTop: 12,
      marginHorizontal: 16,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 3,
    },
    itemHeader: { 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      marginBottom: 8 
    },
    itemTitle: { 
      color: theme.text, 
      fontWeight: 'bold', 
      fontSize: 18 
    },
    itemRow: { 
      flexDirection: 'row', 
      flexWrap: 'wrap', 
      gap: 12,
      marginTop: 4,
    },
    itemMetric: { 
      color: theme.textSecondary, 
      fontWeight: '500',
      fontSize: 14,
    },
    itemNotes: { 
      color: theme.textSecondary, 
      marginTop: 8, 
      fontStyle: 'italic',
      fontSize: 13,
      lineHeight: 18,
    },

    connectCard: {
      marginTop: 16,
      marginHorizontal: 16,
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 3,
    },
    connectTitle: { 
      color: theme.text, 
      fontWeight: 'bold', 
      fontSize: 16,
      marginBottom: 8,
    },
    connectText: { 
      color: theme.textSecondary, 
      marginBottom: 12,
      fontSize: 14,
      lineHeight: 20,
    },
    connectBtn: { 
      borderRadius: 12, 
      paddingVertical: 12, 
      alignItems: 'center',
      backgroundColor: theme.primary,
    },
    connectBtnTxt: { 
      fontWeight: 'bold',
      color: '#fff',
      fontSize: 15,
    },

    fab: {
      position: 'absolute',
      right: 20,
      bottom: 30,
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: theme.primary,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: theme.primary,
      shadowOpacity: 0.3,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 12,
      elevation: 6,
    },

    // Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'flex-end',
    },

    goalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    goalCard: {
      width: '85%',
      maxWidth: 400,
      backgroundColor: theme.surface,
      borderRadius: 20,
      padding: 24,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 10,
    },
    goalTitle: {
      color: theme.text,
      fontWeight: 'bold',
      fontSize: 20,
      textAlign: 'center',
      marginBottom: 4,
    },

    // Almost full-screen sheet so you can see & scroll everything
    modalCard: {
      height: '92%',
      backgroundColor: theme.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 0,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 10,
    },

    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      marginBottom: 8,
    },
    modalTitle: { 
      color: theme.text, 
      fontWeight: 'bold', 
      fontSize: 20 
    },

    typePill: { 
      paddingVertical: 12, 
      paddingHorizontal: 16, 
      borderRadius: 12,
    },
    typePillTxt: { 
      fontWeight: 'bold',
      fontSize: 14,
    },

    row: { marginBottom: 16 },

    modalActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 16,
      gap: 12,
      borderTopWidth: 1,
      borderTopColor: theme.border,
      backgroundColor: theme.surface,
    },
    cancelBtn: {
      flex: 1,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    cancelTxt: {
      color: theme.text,
      fontWeight: '600',
      fontSize: 16,
    },
    saveBtn: { 
      flex: 1, 
      paddingVertical: 16, 
      borderRadius: 12, 
      alignItems: 'center',
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 3,
    },
    saveTxt: { 
      color: '#fff', 
      fontWeight: 'bold',
      fontSize: 16,
    },
  });
