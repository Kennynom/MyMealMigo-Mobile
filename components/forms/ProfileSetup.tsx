import { db } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { arrayUnion, doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Platform, // 
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// ====== UI CONSTANTS (palette / spacing / radius) ======  
const PAL = {
  bg: '#58e221',           
  card: '#000000ff',
  cardAlt: '#111827',
  border: '#1f2937',
  text: '#e5e7eb',
  sub: '#cbd5e1',
  primary: '#58e221',       
  primarySoft: '#49c21a',
  dangerBg: '#3b0f13',
  danger: '#F87171',
  chip: '#111827',
  chipBorder: '#293241',
  chipActiveBg: '#e6ffe0',  
  chipActiveText: '#052e2b',
};
const R = {
  xs: 8, sm: 12, md: 16, lg: 20, xl: 24, xxl: 28,
  br: 14,    // base radius
  br2: 22,   // pill radius
};
const SHADOW = {
  card: { shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  soft: { shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
};

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
  const [sex, setSex] = useState<'male'|'female'|'other'>('other');
  const [goal, setGoal] = useState('');
  const [preferredIntensity, setPreferredIntensity] = useState('');
  const [equipment, setEquipment] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [shareWithCoach, setShareWithCoach] = useState(false);
  const [allergiesItems, setAllergiesItems] = useState<string[]>([]);
  const [allergiesOther, setAllergiesOther] = useState('');
  const [allergiesCompleted, setAllergiesCompleted] = useState(true);

  const [conditionsItems, setConditionsItems] = useState<string[]>([]);
  const [conditionsOther, setConditionsOther] = useState('');

  const [injuriesItems, setInjuriesItems] = useState<string[]>([]);
  const [injuriesNotes, setInjuriesNotes] = useState('');

  const [medicationsList, setMedicationsList] = useState<string>('');

  const [parqNotes, setParqNotes] = useState('');
  const [parq, setParq] = useState({ q1_chestPain: false, q2_dizziness: false, q3_boneJointProblem: false, q4_prescriptionMeds: false, q5_heartCondition: false, q6_bloodPressureIssue: false, q7_otherReason: false });
  const [parqRiskLevel, setParqRiskLevel] = useState<'low'|'medium'|'high'>('low');

  const [constraintHeat, setConstraintHeat] = useState(true);
  const [constraintHiImpact, setConstraintHiImpact] = useState(true);
  const [constraintOverhead, setConstraintOverhead] = useState(true);
  const [dietPlan, setDietPlan] = useState('');
  const [dietNotes, setDietNotes] = useState('');
  const [mealPrepTime, setMealPrepTime] = useState('');
  const [budget, setBudget] = useState('');

  const scrollRef = useRef<ScrollView | null>(null);
  const PAGE_WIDTH = Dimensions.get('window').width;
  const [page, setPage] = useState(0);
  const PAGES = 4;

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
        setSex(hp?.demographics?.sexAtBirth === 'male' || hp?.demographics?.sexAtBirth === 'female' ? hp.demographics.sexAtBirth : (ud.profile?.sex ?? 'other'));
        setGoal(hp?.fitness?.goal ?? '');
        setPreferredIntensity(hp?.fitness?.preferredIntensity ?? '');
        setEquipment(hp?.fitness?.equipment ?? []);
        setNotes(hp?.constraints?.notes ?? '');
        setDietPlan(hp?.constraints?.dietPlan ?? '');
        setDietNotes(hp?.constraints?.dietPlanNotes ?? '');
        setMealPrepTime(hp?.constraints?.mealPrepTime ?? '');
        setBudget(hp?.constraints?.budget ?? '');

        setAllergiesItems(hp?.allergies?.items ?? []);
        setAllergiesOther(hp?.allergies?.other ?? '');
        setAllergiesCompleted(hp?.allergies?.completed ?? true);

        setConditionsItems(hp?.conditions?.items ?? []);
        setConditionsOther(hp?.conditions?.other ?? '');

        setInjuriesItems(hp?.injuries?.items ?? []);
        setInjuriesNotes(hp?.injuries?.notes ?? '');
        setMedicationsList((hp?.medications ?? []).join(', '));

        setParqNotes(hp?.parqPlus?.notes ?? '');
        setParqRiskLevel(hp?.parqPlus?.riskLevel ?? 'low');
        setParq((p) => ({
          ...p,
          q1_chestPain: hp?.parqPlus?.q1_chestPain ?? false,
          q2_dizziness: hp?.parqPlus?.q2_dizziness ?? false,
          q3_boneJointProblem: hp?.parqPlus?.q3_boneJointProblem ?? false,
          q4_prescriptionMeds: hp?.parqPlus?.q4_prescriptionMeds ?? false,
          q5_heartCondition: hp?.parqPlus?.q5_heartCondition ?? false,
          q6_bloodPressureIssue: hp?.parqPlus?.q6_bloodPressureIssue ?? false,
          q7_otherReason: hp?.parqPlus?.q7_otherReason ?? false,
        }));

        setConstraintHeat(hp?.constraints?.heat ?? true);
        setConstraintHiImpact(hp?.constraints?.hiImpact ?? true);
        setConstraintOverhead(hp?.constraints?.overheadLifts ?? true);
        setShareWithCoach(hp?.consent?.shareWithCoach ?? false);
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
    setSaving(true);
    setErr(null);
    try {
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
          sex: sex || 'other',
          updatedAt: serverTimestamp(),
        },
        updatedAt: serverTimestamp(),
      });

      const hpRef = doc(db, 'users', user.uid, 'private', 'health_profile');
      const sexAtBirth = sex === 'male' || sex === 'female' ? sex : 'prefer_not_to_say';

      await setDoc(hpRef, {
        demographics: {                                     
          ...(heightCm ? { heightCm: Number(heightCm) } : {}),
          ...(weightKg ? { weightKg: Number(weightKg) } : {}),
          ...(sexAtBirth ? { sexAtBirth } : {}),
          ...(birthday ? { birthday } : {}),
        },
        fitness: {
          ...(goal ? { goal } : {}),
          ...(preferredIntensity ? { preferredIntensity } : {}),
          ...(equipment && equipment.length ? { equipment } : {}),
        },
        constraints: {
          ...(notes ? { notes } : {}),
          heat: constraintHeat,
          hiImpact: constraintHiImpact,
          overheadLifts: constraintOverhead,
          ...(dietPlan ? { dietPlan } : {}),
          ...(dietNotes ? { dietPlanNotes: dietNotes } : {}),
          ...(mealPrepTime ? { mealPrepTime } : {}),
          ...(budget ? { budget } : {}),
        },
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
        parqPlus: {
          notes: parqNotes ?? '',
          q1_chestPain: !!parq.q1_chestPain,
          q2_dizziness: !!parq.q2_dizziness,
          q3_boneJointProblem: !!parq.q3_boneJointProblem,
          q4_prescriptionMeds: !!parq.q4_prescriptionMeds,
          q5_heartCondition: !!parq.q5_heartCondition,
          q6_bloodPressureIssue: !!parq.q6_bloodPressureIssue,
          q7_otherReason: !!parq.q7_otherReason,
          riskLevel: parqRiskLevel,
        },
        consent: { shareWithCoach },
        updatedAt: serverTimestamp(),
      }, { merge: true });

      try {
        const weightLogRef = doc(db, 'users', user.uid, 'private', 'health_profile', 'weight_log', 'main');
        const weightSnap = await getDoc(weightLogRef);
        if (!weightSnap.exists()) {
          await setDoc(weightLogRef, { logs: [] });
        }
        if (weightKg) {
          const entry = { date: new Date().toISOString().split('T')[0], weightKg: Number(weightKg) };
          await updateDoc(weightLogRef, { logs: arrayUnion(entry) });
        }
      } catch {}

      onComplete?.();
    } catch (e: any) {
      setErr(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <SafeAreaView style={[styles.container, {justifyContent:'center', alignItems:'center'}]}>
      <ActivityIndicator size="large" color={PAL.primary} />
      <Text style={{ color: PAL.sub, marginTop: 12 }}>Loading your profile. . .</Text> 
    </SafeAreaView>
  );

  const EQUIPMENT = ['none','mat','dumbbells','resistance_band','barbell','bike','treadmill'];
  const COMMON_ALLERGIES = ['peanuts','shellfish','milk','eggs','soy','wheat','tree_nuts','fish','sesame'];
  const COMMON_CONDITIONS = ['asthma','diabetes','hypertension','thyroid','anxiety','depression','eczema'];
  const COMMON_INJURIES = ['knee','shoulder','back','ankle','hip'];
  const DIET_PLANS = ['low-carb','vegetarian','vegan','paleo','keto','mediterranean','alkaline','flexitarian','no_preference'];
  const MEAL_PREP = ['0-10min','10-20min','>20min'];
  const BUDGETS = ['low','medium','high'];

  const onScrollToPage = (p: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ x: p * PAGE_WIDTH, animated: true });
      setPage(p);
    }
  };
  const handleNext = () => { if (page < PAGES - 1) onScrollToPage(page + 1); else save(); };
  const handleBack = () => { if (page > 0) onScrollToPage(page - 1); };

  const PageHeader = ({ emoji, title, sub }: {emoji: string; title: string; sub: string}) => (
    <View style={{alignItems:'center', marginBottom: R.lg}}>
      <View style={[styles.iconCircle, SHADOW.soft]}>
        <Text style={styles.iconEmoji}>{emoji}</Text>
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionSubtitle}>{sub}</Text>
    </View>
  );

  const Pill = ({ active, children, onPress }: any) => (   
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        active && styles.pillActive,
        pressed && { opacity: 0.9 }
      ]}
      android_ripple={{ color: '#0c3', borderless: false }}
    >
      <Text style={active ? styles.pillTextActive : styles.pillText}>{children}</Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container}>  
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Health Profile</Text>
        <Text style={styles.headerSubtitle}>Let's personalize your experience</Text>

        {/* Step bar */}  
        <View style={styles.stepBar}>
          {Array.from({ length: PAGES }).map((_, i) => (
            <View key={i} style={[styles.step, i <= page && styles.stepActive]} />
          ))}
        </View>
      </View>

      {err ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{err}</Text>
        </View>
      ) : null}

      <ScrollView
        style={{ flex: 1 }}
        ref={(r) => { scrollRef.current = r; }}
        horizontal
        scrollEnabled={false}
        pagingEnabled
        snapToInterval={PAGE_WIDTH}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const layoutW = e.nativeEvent.layoutMeasurement.width || PAGE_WIDTH;
          const p = Math.round(e.nativeEvent.contentOffset.x / layoutW);
          setPage(p);
        }}
      >
        {/* Page 1 - Basic Info */}
        <View style={[styles.page, { width: PAGE_WIDTH }]}>
          <ScrollView style={{flex:1}} contentContainerStyle={styles.pageContent} nestedScrollEnabled keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={[styles.card, SHADOW.card]}> 
              <PageHeader emoji="👤" title="Basic Information" sub="Tell us about yourself" />
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Display Name</Text>
                <TextInput
                  value={displayName}
                  onChangeText={setDisplayName}
                  style={styles.input}
                  placeholder="Enter your name"
                  placeholderTextColor={PAL.sub}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Birthday</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(true)} style={[styles.input, styles.dateInput]}>
                  <Text style={birthdayDate ? styles.dateText : styles.datePlaceholder}>
                    {birthdayDate ? birthdayDate.toISOString().split('T')[0] : 'Select your birthday'}
                  </Text>
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
              </View>

              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Height (cm)</Text>
                  <TextInput
                    value={heightCm}
                    onChangeText={setHeightCm}
                    keyboardType="numeric"
                    style={styles.input}
                    placeholder="170"
                    placeholderTextColor={PAL.sub}
                  />
                </View>
                <View style={{width:16}} />
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Weight (kg)</Text>
                  <TextInput
                    value={weightKg}
                    onChangeText={setWeightKg}
                    keyboardType="numeric"
                    style={styles.input}
                    placeholder="70"
                    placeholderTextColor={PAL.sub}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Sex</Text>
                <View style={styles.pillRow}>
                  {['male','female','other'].map((s) => (
                    <Pill key={s} active={sex===s} onPress={() => setSex(s as any)}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </Pill>
                  ))}
                </View>
              </View>
            </View>
          </ScrollView>
        </View>

        {/* Page 2 - Fitness Goals */}
        <View style={[styles.page, { width: PAGE_WIDTH }]}>
          <ScrollView style={{flex:1}} contentContainerStyle={styles.pageContent} nestedScrollEnabled keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={[styles.card, SHADOW.card]}>
              <PageHeader emoji="🎯" title="Fitness Goals" sub="What are you working towards?" />
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Primary Goal</Text>
                <View style={styles.pillRow}>
                  {[
                    {k:'weight_loss',t:'Weight Loss'},
                    {k:'cardio',t:'Cardio'},
                    {k:'strength',t:'Strength'},
                    {k:'mobility',t:'Mobility'},
                    {k:'muscle_gain',t:'Muscle Gain'}
                  ].map((opt) => (
                    <Pill key={opt.k} active={goal===opt.k} onPress={() => setGoal(opt.k)}>{opt.t}</Pill>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Preferred Intensity</Text>
                <View style={styles.pillRow}>
                  {['low','medium','high'].map((opt) => (
                    <Pill key={opt} active={preferredIntensity===opt} onPress={() => setPreferredIntensity(opt)}>
                      {opt.charAt(0).toUpperCase() + opt.slice(1)}
                    </Pill>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Available Equipment</Text>
                <View style={styles.pillRow}>
                  {EQUIPMENT.map((eq) => {
                    const active = equipment.includes(eq);
                    return (
                      <Pill key={eq} active={active} onPress={() => toggleEquip(eq)}>
                        {eq.replace(/_/g,' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      </Pill>
                    );
                  })}
                </View>
              </View>
            </View>
          </ScrollView>
        </View>

        {/* Page 3 - Health & Allergies */}
        <View style={[styles.page, { width: PAGE_WIDTH }]}>
          <ScrollView style={{flex:1}} contentContainerStyle={styles.pageContent} nestedScrollEnabled keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={[styles.card, SHADOW.card]}>
              <PageHeader emoji="🏥" title="Health & Allergies" sub="Help us keep you safe" />
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Allergies</Text>
                <View style={styles.pillRow}>
                  {COMMON_ALLERGIES.map((a) => {
                    const active = allergiesItems.includes(a);
                    return (
                      <Pill key={a} active={active} onPress={() =>
                        setAllergiesItems((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a])
                      }>
                        {a.charAt(0).toUpperCase() + a.slice(1)}
                      </Pill>
                    );
                  })}
                  <Pill
                    active={allergiesItems.includes('Other')}
                    onPress={() =>
                      setAllergiesItems((prev) => {
                        const has = prev.includes('Other');
                        if (has) { setAllergiesOther(''); return prev.filter((x) => x !== 'Other'); }
                        return [...prev, 'Other'];
                      })
                    }
                  >Other</Pill>
                </View>
                {allergiesItems.includes('Other') && (
                  <TextInput
                    value={allergiesOther}
                    onChangeText={setAllergiesOther}
                    style={[styles.input, {marginTop: 12}]}
                    placeholder="Specify other allergies"
                    placeholderTextColor={PAL.sub}
                  />
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Medical Conditions</Text>
                <View style={styles.pillRow}>
                  {COMMON_CONDITIONS.map((c) => {
                    const active = conditionsItems.includes(c);
                    return (
                      <Pill key={c} active={active} onPress={() =>
                        setConditionsItems((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c])
                      }>
                        {c.charAt(0).toUpperCase() + c.slice(1)}
                      </Pill>
                    );
                  })}
                  <Pill
                    active={conditionsItems.includes('Other')}
                    onPress={() =>
                      setConditionsItems((prev) => {
                        const has = prev.includes('Other');
                        if (has) { setConditionsOther(''); return prev.filter((x) => x !== 'Other'); }
                        return [...prev, 'Other'];
                      })
                    }
                  >Other</Pill>
                </View>
                {conditionsItems.includes('Other') && (
                  <TextInput
                    value={conditionsOther}
                    onChangeText={setConditionsOther}
                    style={[styles.input, {marginTop: 12}]}
                    placeholder="Specify other conditions"
                    placeholderTextColor={PAL.sub}
                  />
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Previous Injuries</Text>
                <View style={styles.pillRow}>
                  {COMMON_INJURIES.map((c) => {
                    const active = injuriesItems.includes(c);
                    return (
                      <Pill key={c} active={active} onPress={() =>
                        setInjuriesItems((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c])
                      }>
                        {c.charAt(0).toUpperCase() + c.slice(1)}
                      </Pill>
                    );
                  })}
                  <Pill
                    active={injuriesItems.includes('Other')}
                    onPress={() =>
                      setInjuriesItems((prev) => {
                        const has = prev.includes('Other');
                        if (has) { setInjuriesNotes(''); return prev.filter((x) => x !== 'Other'); }
                        return [...prev, 'Other'];
                      })
                    }
                  >Other</Pill>
                </View>
                {injuriesItems.includes('Other') && (
                  <TextInput
                    value={injuriesNotes}
                    onChangeText={setInjuriesNotes}
                    style={[styles.input, {marginTop: 12}]}
                    placeholder="Describe other injuries"
                    placeholderTextColor={PAL.sub}
                  />
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Current Medications</Text>
                <TextInput
                  value={medicationsList}
                  onChangeText={setMedicationsList}
                  style={styles.input}
                  placeholder="List medications (comma separated)"
                  placeholderTextColor={PAL.sub}
                  multiline
                />
              </View>
            </View>
          </ScrollView>
        </View>

        {/* Page 4 - Health Screening & Preferences */}
        <View style={[styles.page, { width: PAGE_WIDTH }]}>
          <ScrollView style={{flex:1}} contentContainerStyle={styles.pageContent} nestedScrollEnabled keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={[styles.card, SHADOW.card]}>
              <PageHeader emoji="✅" title="Health Screening" sub="Final safety checks" />
              <View style={styles.inputGroup}>
                <Text style={styles.label}>PAR-Q+ Questionnaire</Text>
                <View style={styles.switchContainer}>
                  {[
                    {k:'q1_chestPain', t:'Chest pain during activity'},
                    {k:'q2_dizziness', t:'Dizziness or fainting'},
                    {k:'q3_boneJointProblem', t:'Bone/joint problems'},
                    {k:'q4_prescriptionMeds', t:'Taking prescription meds'},
                    {k:'q5_heartCondition', t:'Known heart condition'},
                    {k:'q6_bloodPressureIssue', t:'Blood pressure issues'},
                    {k:'q7_otherReason', t:'Other health concerns'},
                  ].map((it, idx, arr) => (
                    <View key={it.k} style={[styles.switchRow, idx===arr.length-1 && {borderBottomWidth:0}]}>
                      <Text style={styles.switchLabel}>{it.t}</Text>
                      <Switch
                        value={(parq as any)[it.k]}
                        onValueChange={(v) => setParq((p) => ({ ...p, [it.k]: v }))}
                        trackColor={{ false: '#374151', true: PAL.primary }}
                        thumbColor={'#f9fafb'}
                      />
                    </View>
                  ))}
                </View>
                {(parq as any).q7_otherReason && (
                  <TextInput
                    value={parqNotes}
                    onChangeText={setParqNotes}
                    style={[styles.input, {marginTop: 12}]}
                    placeholder="Please describe your concerns"
                    placeholderTextColor={PAL.sub}
                    multiline
                  />
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Exercise Constraints</Text>
                <View style={styles.switchContainer}>
                  <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>Avoid high heat activities</Text>
                    <Switch value={constraintHeat} onValueChange={setConstraintHeat} trackColor={{ false: '#374151', true: PAL.primary }} thumbColor={'#f9fafb'} />
                  </View>
                  <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>Avoid high-impact exercises</Text>
                    <Switch value={constraintHiImpact} onValueChange={setConstraintHiImpact} trackColor={{ false: '#374151', true: PAL.primary }} thumbColor={'#f9fafb'} />
                  </View>
                  <View style={[styles.switchRow, {borderBottomWidth:0}]}>
                    <Text style={styles.switchLabel}>Avoid overhead lifts</Text>
                    <Switch value={constraintOverhead} onValueChange={setConstraintOverhead} trackColor={{ false: '#374151', true: PAL.primary }} thumbColor={'#f9fafb'} />
                  </View>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Diet Preferences</Text>
                <View style={styles.pillRow}>
                  {DIET_PLANS.map((d) => (
                    <Pill key={d} active={dietPlan===d} onPress={() => setDietPlan(d)}>
                      {d.replace(/_/g,' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </Pill>
                  ))}
                  <Pill active={dietPlan === 'Other'} onPress={() => {
                    if (dietPlan === 'Other') { setDietPlan(''); setDietNotes(''); }
                    else setDietPlan('Other');
                  }}>Other</Pill>
                </View>
                {dietPlan === 'Other' && (
                  <TextInput
                    value={dietNotes}
                    onChangeText={setDietNotes}
                    style={[styles.input, {marginTop: 12}]}
                    placeholder="Describe your diet preference"
                    placeholderTextColor={PAL.sub}
                  />
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Meal Prep Time</Text>
                <View style={styles.pillRow}>
                  {MEAL_PREP.map((m) => (
                    <Pill key={m} active={mealPrepTime===m} onPress={() => setMealPrepTime(m)}>{m}</Pill>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Food Budget</Text>
                <View style={styles.pillRow}>
                  {BUDGETS.map((b) => (
                    <Pill key={b} active={budget===b} onPress={() => setBudget(b)}>{b.charAt(0).toUpperCase() + b.slice(1)}</Pill>
                  ))}
                </View>
              </View>

              <View style={styles.switchContainer}>
                <View style={[styles.switchRow, {borderBottomWidth:0}]}>
                  <Text style={styles.switchLabel}>Share profile with coach</Text>
                  <Switch value={shareWithCoach} onValueChange={setShareWithCoach} trackColor={{ false: '#374151', true: PAL.primary }} thumbColor={'#f9fafb'} />
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </ScrollView>

      {/* Pagination Dots */}
      <View style={styles.pagerRow}>
        {Array.from({ length: PAGES }).map((_, i) => (
          <View key={i} style={[styles.dot, page === i && styles.dotActive]} />
        ))}
      </View>

      {/* Navigation Buttons */}
      <View style={styles.navRow}>
        <TouchableOpacity onPress={handleBack} disabled={page === 0} style={[styles.navButton, page === 0 && styles.navButtonDisabled]}>
          <Text style={[styles.navText, page === 0 && styles.navTextDisabled]}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleNext} disabled={saving} style={[styles.navButtonPrimary, saving && {opacity:0.7}]}>
          {saving ? <ActivityIndicator color="#fff" /> : (
            <Text style={styles.navTextPrimary}>{page < PAGES - 1 ? 'Continue' : 'Complete Setup'}</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PAL.bg,                           
  },
  header: {
    paddingTop: 16,                                    
    paddingBottom: 20,
    paddingHorizontal: R.lg,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    backgroundColor: '#0d1b2a',                        
    ...SHADOW.soft,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: PAL.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 14,
    color: PAL.sub,
    textAlign: 'center',
  },
  stepBar: {                                          
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    alignSelf: 'center',
  },
  step: { width: 36, height: 6, borderRadius: 6, backgroundColor: '#1a2a3a' },

  stepActive: {
    backgroundColor: PAL.primary,
  },
  errorBanner: {
    backgroundColor: PAL.dangerBg,
    padding: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: R.br,
    borderWidth: 1,
    borderColor: '#7f1d1d',
  },
  errorText: {
    color: PAL.danger,
    fontSize: 14,
    textAlign: 'center',
  },
  page: {
    paddingTop: 12,
    flexShrink: 0,
    height: '100%',
  },
  pageContent: {
    paddingBottom: 180,                                // leave room for sticky footer
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: PAL.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1b2535',              
    padding: 20,
    width: '100%',
    maxWidth: 350,        // << make the card narrower
    alignSelf: 'center',  // << center the card in the page
    marginVertical: 10, 
    marginHorizontal: 100,
    marginLeft: 70,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: PAL.cardAlt,                      
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: PAL.border,
  },
  iconEmoji: { fontSize: 30 },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: PAL.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: PAL.sub,
    textAlign: 'center',
    marginBottom: 16,
  },
  inputGroup: { marginBottom: 18 },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: PAL.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: PAL.cardAlt,                      
    borderWidth: 1.2,
    borderColor: PAL.border,
    padding: 14,
    borderRadius: R.br,
    fontSize: 16,
    color: PAL.text,
  },
  dateInput: { justifyContent: 'center' },
  dateText: { fontSize: 16, color: PAL.text },
  datePlaceholder: { fontSize: 16, color: PAL.sub },
  row: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 18 },
  halfInput: { flex: 1 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pill: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: R.br2,
    backgroundColor: PAL.chip,
    borderWidth: 1.2,
    borderColor: PAL.chipBorder,
  },
  pillActive: { backgroundColor: PAL.primary, borderColor: PAL.primary },
  pillText: { color: PAL.text, fontSize: 14, fontWeight: '600' },
  pillTextActive: { color: '#0b1a06', fontWeight: '700' }, 
  switchContainer: {
    backgroundColor: PAL.cardAlt,
    borderRadius: R.br,
    padding: 6,
    borderWidth: 1,
    borderColor: PAL.border,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: PAL.border,
  },
  switchLabel: { fontSize: 15, color: PAL.text, flex: 1, marginRight: 12 },
  pagerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: 'transparent',                   
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#334155',
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: PAL.primary,
    width: 24,
  },
  navRow: {
    position: 'absolute',                             
    left: 0, right: 0, bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: 'rgba(11,18,32,0.85)',
    borderTopWidth: 1,
    borderTopColor: PAL.border,
    backdropFilter: 'blur(8px)' as any,               
  },
  navButton: {
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: R.br,
    borderWidth: 1.2,
    borderColor: PAL.border,
    backgroundColor: PAL.cardAlt,
    minWidth: 110,
    alignItems: 'center',
  },
  navButtonDisabled: { opacity: 0.4 },
  navButtonPrimary: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: R.br,
    backgroundColor: PAL.primary,
    minWidth: 160,
    alignItems: 'center',
    ...SHADOW.soft,
  },
  navText: { color: PAL.text, fontWeight: '600', fontSize: 16 },
  navTextDisabled: { color: PAL.sub },
  navTextPrimary: { color: '#FFFFFF', fontWeight: '800', fontSize: 16, letterSpacing: 0.3 },
});
