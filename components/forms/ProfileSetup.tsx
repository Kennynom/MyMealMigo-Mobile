import { db } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { arrayUnion, doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ProfileSetup({ onComplete }: { onComplete?: () => void }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [birthdayDate, setBirthdayDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [heightCm, setHeightCm] = useState<string>('');
  const [weightKg, setWeightKg] = useState<string>('');
  const [sex, setSex] = useState<'male'|'female'|''>('');
  const [goal, setGoal] = useState('');
  const [preferredIntensity, setPreferredIntensity] = useState('');
  const [equipment, setEquipment] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  // use arrays for multi-select choices
  const [allergiesItems, setAllergiesItems] = useState<string[]>([]);
  const [allergiesOther, setAllergiesOther] = useState('');
  const [allergiesCompleted, setAllergiesCompleted] = useState(true);

  const [conditionsItems, setConditionsItems] = useState<string[]>([]);
  const [conditionsOther, setConditionsOther] = useState('');

  const [injuriesItems, setInjuriesItems] = useState<string[]>([]);
  const [injuriesNotes, setInjuriesNotes] = useState('');

  const [medicationsList, setMedicationsList] = useState<string>('');

  // Horizontal paged wizard hooks must be declared unconditionally before any return
  const scrollRef = useRef<ScrollView | null>(null);
  const PAGE_WIDTH = Dimensions.get('window').width;
  const [page, setPage] = useState(0);
  const PAGES = 3;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) return;
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        const ud = userSnap.exists() ? userSnap.data() : {};

        const hpRef = doc(db, 'users', user.uid, 'private', 'health_profile');
        const hpSnap = await getDoc(hpRef);
        const hp = hpSnap.exists() ? hpSnap.data() : {};

        if (cancelled) return;

        setDisplayName(ud.name ?? user.displayName ?? '');
        const birthdayFromUser = (ud.profile && ud.profile.birthday) ?? '';
        setBirthday(birthdayFromUser as string);
        setBirthdayDate(birthdayFromUser ? new Date(birthdayFromUser) : null);
        setHeightCm(String(hp?.demographics?.heightCm ?? ud.profile?.heightCm ?? ''));
        setWeightKg(String(hp?.demographics?.weightKg ?? ud.profile?.weightKg ?? ''));
        setSex(hp?.demographics?.sexAtBirth === 'male' || hp?.demographics?.sexAtBirth === 'female' ? hp.demographics.sexAtBirth : (ud.profile?.sex === 'male' || ud.profile?.sex === 'female' ? ud.profile.sex : ''));
        setGoal(hp?.fitness?.goal ?? '');
        setPreferredIntensity(hp?.fitness?.preferredIntensity ?? '');
        setEquipment(hp?.fitness?.equipment ?? []);
        setNotes(hp?.constraints?.notes ?? '');

        // allergies/conditions/injuries
        setAllergiesItems(hp?.allergies?.items ?? []);
        setAllergiesOther(hp?.allergies?.other ?? '');
        setAllergiesCompleted(hp?.allergies?.completed ?? true);

        setConditionsItems(hp?.conditions?.items ?? []);
        setConditionsOther(hp?.conditions?.other ?? '');

        setInjuriesItems(hp?.injuries?.items ?? []);
        setInjuriesNotes(hp?.injuries?.notes ?? '');
        setMedicationsList((hp?.medications ?? []).join(', '));
      } catch (e: any) {
        setErr(e.message || 'Failed to load profile');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const toggleEquip = (key: string) => {
    setEquipment((arr) => {
      const s = new Set(arr);
      s.has(key) ? s.delete(key) : s.add(key);
      return Array.from(s);
    });
  };

  const save = async () => {
    if (!user) return;
    
    // Validation: Check required fields
    if (!displayName || !displayName.trim()) {
      setErr('Name is required');
      return;
    }
    if (!birthday) {
      setErr('Birthday is required');
      return;
    }
    if (!heightCm || !heightCm.trim()) {
      setErr('Height is required');
      return;
    }
    if (!weightKg || !weightKg.trim()) {
      setErr('Weight is required');
      return;
    }
    if (!sex || (sex !== 'male' && sex !== 'female')) {
      setErr('Sex is required');
      return;
    }
    
    setSaving(true);
    setErr(null);
    try {
      // Calculate age from birthday
      let age = null;
      if (birthday) {
        const birthDate = new Date(birthday);
        const today = new Date();
        age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
      }

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        name: displayName || null,
        profile: {
          birthday: birthday || null,
          age: age,
          heightCm: heightCm ? Number(heightCm) : null,
          weightKg: weightKg ? Number(weightKg) : null,
          sex: sex,
          updatedAt: serverTimestamp(),
        },
        updatedAt: serverTimestamp(),
      });

      const hpRef = doc(db, 'users', user.uid, 'private', 'health_profile');
      const birthYear = birthday ? new Date(birthday).getFullYear() : undefined;
      const sexAtBirth = sex;

      await setDoc(hpRef, {
        fitness: {
          ...(goal ? { goal } : {}),
          ...(preferredIntensity ? { preferredIntensity } : {}),
          ...(equipment && equipment.length ? { equipment } : {}),
        },
        // constraints: only keep notes if any
        constraints: {
          ...(notes ? { notes } : {}),
        },
        // allergies/conditions/injuries/meds
        allergies: {
          items: allergiesItems ?? [],
          other: allergiesOther ?? '',
          completed: !!allergiesCompleted,
        },
        conditions: {
          items: conditionsItems ?? [],
          other: conditionsOther ?? '',
        },
        injuries: {
          items: injuriesItems ?? [],
          notes: injuriesNotes ?? '',
        },
        medications: (medicationsList || '') ? medicationsList.split(',').map((s) => s.trim()).filter(Boolean) : [],
        updatedAt: serverTimestamp(),
      }, { merge: true });

      // Ensure a weight_log exists at the same level as calorie_logs.
      // This is intentionally idempotent: only create if missing.
      try {
        const weightLogRef = doc(db, 'users', user.uid, 'private', 'health_profile', 'weight_log', 'main');
        const weightSnap = await getDoc(weightLogRef);
        if (!weightSnap.exists()) {
          await setDoc(weightLogRef, { logs: [] });
        }

        // If user provided an initial weight during profile setup, append it as an entry.
        if (weightKg) {
          try {
            const entry = {
              date: new Date().toISOString().split('T')[0],
              weightKg: Number(weightKg),
            };
            await updateDoc(weightLogRef, { logs: arrayUnion(entry) });
          } catch (appendErr) {
            console.error('Failed to append initial weight_log entry:', appendErr);
          }
        }
      } catch (we) {
        // Don't block the onboarding if the weight log creation fails; log for debugging.
        console.error('Failed to ensure weight_log:', we);
      }

      onComplete?.();
    } catch (e: any) {
      setErr(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <ActivityIndicator />;

  const EQUIPMENT = ['none','mat','dumbbells','resistance_band','barbell','bike','treadmill'];

  const COMMON_ALLERGIES = ['peanuts','shellfish','milk','eggs','soy','wheat','tree_nuts','fish','sesame'];
  const COMMON_CONDITIONS = ['asthma','diabetes','hypertension','thyroid','anxiety','depression','eczema'];
  const COMMON_INJURIES = ['knee','shoulder','back','ankle','hip'];

  const toggleArray = (arr: string[], setArr: (v: any) => void, key: string) => {
    setArr((cur: string[]) => {
      const s = new Set(cur);
      s.has(key) ? s.delete(key) : s.add(key);
      return Array.from(s);
    });
  };

  const onScrollToPage = (p: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ x: p * PAGE_WIDTH, animated: true });
      setPage(p);
    }
  };

  const handleNext = () => {
    // Validate Page 1 fields before allowing navigation to Page 2
    if (page === 0) {
      if (!displayName || !displayName.trim()) {
        setErr('Name is required');
        return;
      }
      if (!birthday) {
        setErr('Birthday is required');
        return;
      }
      if (!heightCm || !heightCm.trim()) {
        setErr('Height is required');
        return;
      }
      if (!weightKg || !weightKg.trim()) {
        setErr('Weight is required');
        return;
      }
      if (!sex || (sex !== 'male' && sex !== 'female')) {
        setErr('Sex is required');
        return;
      }
      // Clear error if all validations pass
      setErr(null);
    }
    
    if (page < PAGES - 1) onScrollToPage(page + 1);
    else save();
  };

  const handleBack = () => { if (page > 0) onScrollToPage(page - 1); };

  return (
    <View style={{ flex: 1 }}>
      {/* Progress Tracker */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>Step {page + 1} of {PAGES}</Text>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${((page + 1) / PAGES) * 100}%` }]} />
        </View>
      </View>
      
      <Text style={styles.titleCenter}>Set up your health profile</Text>
      {err ? <Text style={styles.err}>{err}</Text> : null}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{}}
        ref={(r) => { scrollRef.current = r; }}
        horizontal
        // disable user-driven horizontal swiping; navigation is via Back/Continue buttons
        scrollEnabled={false}
        pagingEnabled
        snapToInterval={PAGE_WIDTH}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          // Use the measured layout width to compute page index (handles safe area / padding)
          const layoutW = e.nativeEvent.layoutMeasurement.width || PAGE_WIDTH;
          const p = Math.round(e.nativeEvent.contentOffset.x / layoutW);
          setPage(p);
        }}
      >
        {/* Page 1 - Basic */}
        <View style={[styles.page, { width: PAGE_WIDTH }]}> 
          <ScrollView style={{flex:1}} contentContainerStyle={{paddingBottom:60, paddingLeft:0, paddingRight:16}} nestedScrollEnabled keyboardShouldPersistTaps="handled">
            <View style={{ width: PAGE_WIDTH - 32 }}>
              <Text style={styles.sectionTitle}>Basic info</Text>
              <Text style={styles.label}>Account Name <Text style={styles.required}>*</Text></Text>
              <TextInput value={displayName} onChangeText={setDisplayName} style={styles.input} />

            <Text style={styles.label}>Birthday <Text style={styles.required}>*</Text></Text>
            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={[styles.input,{justifyContent:'center'}]}>
              <Text>{birthdayDate ? birthdayDate.toISOString().split('T')[0] : 'Select date'}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={birthdayDate ?? new Date(2000,0,1)}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(e, d) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (d) {
                    setBirthdayDate(d);
                    setBirthday(d.toISOString().split('T')[0]);
                  }
                }}
              />
            )}

            <View style={styles.row}>
              <View style={{flex:1}}>
                <Text style={styles.label}>Height (cm) <Text style={styles.required}>*</Text></Text>
                <TextInput value={heightCm} onChangeText={setHeightCm} keyboardType="numeric" style={styles.input} />
              </View>
              <View style={{width:12}} />
              <View style={{flex:1}}>
                <Text style={styles.label}>Weight (kg) <Text style={styles.required}>*</Text></Text>
                <TextInput value={weightKg} onChangeText={setWeightKg} keyboardType="numeric" style={styles.input} />
              </View>
            </View>

              <Text style={styles.label}>Sex <Text style={styles.required}>*</Text></Text>
              <View style={styles.row}>{['male','female'].map((s) => (
                <TouchableOpacity key={s} onPress={() => setSex(s as any)} style={[styles.pill, sex===s && styles.pillActive]}>
                  <Text style={sex===s?styles.pillTextActive:styles.pillText}>{s}</Text>
                </TouchableOpacity>
              ))}</View>
            </View>
          </ScrollView>
        </View>

        {/* Page 2 - Fitness */}
        <View style={[styles.page, { width: PAGE_WIDTH }]}> 
          <ScrollView style={{flex:1}} contentContainerStyle={{paddingBottom:60, paddingLeft:0, paddingRight:16}} nestedScrollEnabled keyboardShouldPersistTaps="handled">
            <View style={{ width: PAGE_WIDTH - 32 }}>
              <Text style={styles.sectionTitle}>Fitness goals</Text>
            <Text style={[styles.label,{marginTop:8}]}>Goal</Text>
            <View style={{flexDirection:'row',gap:8,marginTop:8,flexWrap:'wrap'}}>
              {[{k:'weight_loss',t:'Weight Loss'},{k:'cardio',t:'Cardio'},{k:'strength',t:'Strength'},{k:'mobility',t:'Mobility'},{k:'muscle_gain',t:'Muscle Gain'}].map((opt) => (
                <TouchableOpacity key={opt.k} onPress={() => setGoal(opt.k)} style={[styles.pill, goal===opt.k && styles.pillActive]}>
                  <Text style={goal===opt.k?styles.pillTextActive:styles.pillText}>{opt.t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label,{marginTop:12}]}>Preferred Intensity</Text>
            <View style={{flexDirection:'row',gap:8,marginTop:8}}>
              {['low','medium','high'].map((opt) => (
                <TouchableOpacity key={opt} onPress={() => setPreferredIntensity(opt)} style={[styles.pill, preferredIntensity===opt && styles.pillActive]}>
                  <Text style={preferredIntensity===opt?styles.pillTextActive:styles.pillText}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>

              <Text style={[styles.label,{marginTop:12}]}>Equipment</Text>
              <View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>
              {EQUIPMENT.map((eq) => {
                const active = equipment.includes(eq);
                return (
                  <TouchableOpacity key={eq} onPress={() => toggleEquip(eq)} style={[styles.pill, active && styles.pillActive]}>
                    <Text style={active?styles.pillTextActive:styles.pillText}>{eq.replace(/_/g,' ')}</Text>
                  </TouchableOpacity>
                );
              })}
              </View>
            </View>
          </ScrollView>
        </View>

        {/* Page 3 - Health conditions */}
        <View style={[styles.page, { width: PAGE_WIDTH }]}> 
          <ScrollView style={{flex:1}} contentContainerStyle={{paddingBottom:60, paddingLeft:0, paddingRight:16}} nestedScrollEnabled keyboardShouldPersistTaps="handled">
            <View style={{ width: PAGE_WIDTH - 32 }}>
              <Text style={styles.sectionTitle}>Health & allergies</Text>
            <Text style={[styles.label,{marginTop:8}]}>Allergies</Text>
            <View style={{flexDirection:'row',flexWrap:'wrap',gap:8,marginTop:8}}>
              {COMMON_ALLERGIES.map((a) => {
                const active = allergiesItems.includes(a);
                return (
                  <TouchableOpacity
                    key={a}
                    onPress={() =>
                      setAllergiesItems((prev) =>
                        prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
                      )
                    }
                    style={[styles.pill, active && styles.pillActive]}
                  >
                    <Text style={active ? styles.pillTextActive : styles.pillText}>{a}</Text>
                  </TouchableOpacity>
                );
              })}

              {/* Allergies */}
              <TouchableOpacity
                key="Other"
                onPress={() =>
                  setAllergiesItems((prev) => {
                    const has = prev.includes('Other');
                    if (has) {
                      setAllergiesOther(''); // clear when turning off
                      return prev.filter((x) => x !== 'Other');
                    }
                    return [...prev, 'Other'];
                  })
                }
                style={[styles.pill, allergiesItems.includes('Other') && styles.pillActive]}
              >
                <Text style={allergiesItems.includes('Other') ? styles.pillTextActive : styles.pillText}>other</Text>
              </TouchableOpacity>
            </View>
            
            {allergiesItems.includes('Other') ? (
              <>
                <Text style={[styles.label,{marginTop:8}]}>State other allergies here:</Text>
                <TextInput value={allergiesOther} onChangeText={setAllergiesOther} style={styles.input} placeholder="Other" />
              </>
            ) : null}

            {/* Conditions */}
            <Text style={[styles.label,{marginTop:12}]}>Conditions</Text>
            <View style={{flexDirection:'row',flexWrap:'wrap',gap:8,marginTop:8}}>
              {COMMON_CONDITIONS.map((c) => {
                const active = conditionsItems.includes(c);
                return (
                  <TouchableOpacity
                    key={c}
                    onPress={() =>
                      setConditionsItems((prev) =>
                        prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
                      )
                    }
                    style={[styles.pill, active && styles.pillActive]}
                  >
                    <Text style={active ? styles.pillTextActive : styles.pillText}>{c}</Text>
                  </TouchableOpacity>
                );
              })}

              {/* Other pill */}
              <TouchableOpacity
                key="Other"
                onPress={() =>
                  setConditionsItems((prev) => {
                    const has = prev.includes('Other');
                    if (has) {
                      setConditionsOther('');
                      return prev.filter((x) => x !== 'Other');
                    }
                    return [...prev, 'Other'];
                  })
                }
                style={[styles.pill, conditionsItems.includes('Other') && styles.pillActive]}
              >
                <Text style={conditionsItems.includes('Other') ? styles.pillTextActive : styles.pillText}>other</Text>
              </TouchableOpacity>
            </View>

            {conditionsItems.includes('Other') ? (
              <>
                <Text style={[styles.label,{marginTop:8}]}>State other conditions here:</Text>
                <TextInput value={conditionsOther} onChangeText={setConditionsOther} style={styles.input} placeholder="Other" />
              </>
            ) : null}
            
            {/* Injuries */}
            <Text style={[styles.label,{marginTop:12}]}>Injuries</Text>
            <View style={{flexDirection:'row',flexWrap:'wrap',gap:8,marginTop:8}}>
              {COMMON_INJURIES.map((c) => {
                const active = injuriesItems.includes(c);
                return (
                  <TouchableOpacity
                    key={c}
                    onPress={() =>
                      setInjuriesItems((prev) =>
                        prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
                      )
                    }
                    style={[styles.pill, active && styles.pillActive]}
                  >
                    <Text style={active ? styles.pillTextActive : styles.pillText}>{c}</Text>
                  </TouchableOpacity>
                );
              })}
              
              <TouchableOpacity
                key="Other"
                onPress={() =>
                  setInjuriesItems((prev) => {
                    const has = prev.includes('Other');
                    if (has) {
                      setInjuriesNotes('');
                      return prev.filter((x) => x !== 'Other');
                    }
                    return [...prev, 'Other'];
                  })
                }
                style={[styles.pill, injuriesItems.includes('Other') && styles.pillActive]}
              >
                <Text style={injuriesItems.includes('Other') ? styles.pillTextActive : styles.pillText}>other</Text>
              </TouchableOpacity>
            </View>

            {injuriesItems.includes('Other') ? (
              <>
                <Text style={[styles.label,{marginTop:8}]}>State other injuries here:</Text>
                <TextInput value={injuriesNotes} onChangeText={setInjuriesNotes} style={styles.input} placeholder="Notes" />
              </>
            ) : null}

              <Text style={[styles.label,{marginTop:12}]}>Medications</Text>
              <TextInput value={medicationsList} onChangeText={setMedicationsList} style={styles.input} placeholder="List medications (comma separated)" />
            </View>
          </ScrollView>
        </View>

      </ScrollView>

      {/* pagination dots */}
      <View style={styles.pagerRow}>
        {Array.from({ length: PAGES }).map((_, i) => (
          <View key={i} style={[styles.dot, page === i && styles.dotActive]} />
        ))}
      </View>

      {/* navigation buttons */}
      <View style={styles.navRow}>
        <TouchableOpacity onPress={handleBack} disabled={page === 0} style={[styles.navButton, page === 0 && styles.navButtonDisabled]}>
          <Text style={styles.navText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleNext} style={styles.navButtonPrimary}>
          <Text style={styles.navTextPrimary}>{page < PAGES - 1 ? 'Continue' : (saving ? 'Saving…' : 'Save and Continue')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  titleCenter: { fontSize: 18, fontWeight: '700', textAlign: 'center', paddingTop: 12, paddingBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  progressContainer: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  progressText: { fontSize: 13, fontWeight: '600', color: '#6b7280', marginBottom: 8, textAlign: 'center' },
  progressBarContainer: { height: 4, backgroundColor: '#e5e7eb', borderRadius: 2, overflow: 'hidden' },
  progressBar: { height: '100%', backgroundColor: '#059669', borderRadius: 2 },
  // page itself should not add horizontal padding; inner ScrollView provides padding
  page: { paddingTop: 16, paddingBottom: 16, flexShrink: 0, height: '100%', justifyContent: 'flex-start' },
  label: { fontSize: 13, color: '#374151', marginTop: 8 },
  required: { color: '#ef4444', fontWeight: '700' },
  input: { borderWidth: 1, borderColor: '#e5e7eb', padding: 10, borderRadius: 8, marginTop: 6 },
  row: { flexDirection: 'row', alignItems: 'center' },
  pill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#d1d5db', marginRight: 8, marginTop: 8 },
  pillActive: { backgroundColor: '#111827', borderColor: '#111827' },
  pillText: { color: '#111827' },
  pillTextActive: { color: '#fff' },
  button: { backgroundColor: '#059669', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 18 },
  buttonDisabled: { backgroundColor: '#9ca3af' },
  buttonText: { color: '#fff', fontWeight: '700' },
  pagerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 12 },
  dot: { width: 8, height: 8, borderRadius: 8, backgroundColor: '#d1d5db', marginHorizontal: 6 },
  dotActive: { backgroundColor: '#111827' },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 12 },
  navButton: { padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db', minWidth: 100, alignItems: 'center' },
  navButtonDisabled: { opacity: 0.5 },
  navButtonPrimary: { padding: 12, borderRadius: 8, backgroundColor: '#059669', minWidth: 140, alignItems: 'center' },
  navText: { color: '#111827', fontWeight: '600' },
  navTextPrimary: { color: '#fff', fontWeight: '700' },
  err: { color: '#ef4444', marginBottom: 8 }
});
