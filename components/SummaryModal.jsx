import { db } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';
import { useJournal } from '@/context/JournalContext';
import { getUserMeals } from '@/utils/mealService';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

// ---------------- helpers ----------------
const REQUIRED_MEALS = ['breakfast', 'lunch', 'dinner'];
const TARGET_TOLERANCE = 50; // kcal wiggle room for “right on”

function fmtNumber(n, digits = 1) {
  return Number.isFinite(n) ? n.toFixed(digits) : '—';
}
function safeAvg(list) {
  const nums = list.filter(x => typeof x === 'number' && Number.isFinite(x));
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}
function sameDay(ts, Y, M, D) {
  const dt = ts instanceof Date ? ts : new Date(ts);
  return dt.getFullYear() === Y && dt.getMonth() === M && dt.getDate() === D;
}
function dateKey(ts) {
  const dt = ts instanceof Date ? ts : new Date(ts);
  return dt.toISOString().slice(0, 10); // YYYY-MM-DD
}

// Try many reasonable places to find the user's selected daily calorie target.
// Adjust/extend if your schema differs.
async function loadDailyTarget(uid) {
  // 1) users/{uid}
  try {
    const uSnap = await getDoc(doc(db, 'users', uid));
    if (uSnap.exists()) {
      const u = uSnap.data() || {};
      const fromUser =
        u?.profile?.dailyCalorieTarget ??
        u?.profile?.calorieGoal ??
        u?.dailyCalorieTarget ??
        u?.calorieGoal ??
        null;
      if (Number.isFinite(fromUser)) return Number(fromUser);
    }
  } catch {}

  // 2) users/{uid}/private/health_profile
  try {
    const hpSnap = await getDoc(doc(db, 'users', uid, 'private', 'health_profile'));
    if (hpSnap.exists()) {
      const hp = hpSnap.data() || {};
      const fromHP =
        hp?.goals?.dailyCalorieTarget ??
        hp?.goals?.calorieTarget ??
        hp?.nutrition?.calorieTarget ??
        hp?.dailyCalorieTarget ??
        null;
      if (Number.isFinite(fromHP)) return Number(fromHP);

      // common calculator nesting
      const fromCalc =
        hp?.calculator?.tdee?.selectedTargetKcal ??
        hp?.calculator?.tdee?.goalKcal ??
        hp?.calculator?.tdee?.calorieGoal ??
        null;
      if (Number.isFinite(fromCalc)) return Number(fromCalc);
    }
  } catch {}

  // 3) users/{uid}/private/calculators/tdee
  try {
    const tdeeSnap = await getDoc(doc(db, 'users', uid, 'private', 'calculators', 'tdee'));
    if (tdeeSnap.exists()) {
      const t = tdeeSnap.data() || {};
      const fromTdee =
        t?.selectedTargetKcal ??
        t?.goalKcal ??
        t?.calorieGoal ??
        t?.targets?.selected?.kcal ??
        null;
      if (Number.isFinite(fromTdee)) return Number(fromTdee);
    }
  } catch {}

  // 4) users/{uid}/calculators/tdee (if stored outside private)
  try {
    const tdeeSnap2 = await getDoc(doc(db, 'users', uid, 'calculators', 'tdee'));
    if (tdeeSnap2.exists()) {
      const t2 = tdeeSnap2.data() || {};
      const fromTdee2 =
        t2?.selectedTargetKcal ??
        t2?.goalKcal ??
        t2?.calorieGoal ??
        t2?.targets?.selected?.kcal ??
        null;
      if (Number.isFinite(fromTdee2)) return Number(fromTdee2);
    }
  } catch {}

  return null; // not found; UI will show “Set in Profile”
}

// Mood → emoji + label
const moodMap = [
  { min: 4.5, label: 'Very Happy', emoji: '🥰' },
  { min: 3.5, label: 'Happy', emoji: '😊' },
  { min: 2.5, label: 'Neutral', emoji: '😐' },
  { min: 1.5, label: 'Sad', emoji: '😞' },
  { min: 0,   label: 'Very Sad', emoji: '😭' },
];

// --------------- component ---------------
export default function SummaryModal({ visible, onClose, lookbackDays = 7 }) {
  const { user } = useAuth();
  const { entries } = useJournal();

  const [loading, setLoading] = useState(true);
  const [meals, setMeals] = useState([]);
  const [targetCals, setTargetCals] = useState(null);

  // today
  const today = useMemo(() => new Date(), []);
  const Y = today.getFullYear();
  const M = today.getMonth();
  const D = today.getDate();

  // Load meals + target
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!user?.uid) { setLoading(false); return; }
      setLoading(true);
      try {
        // meals
        const allMeals = await getUserMeals(user.uid);
        if (!alive) return;
        setMeals(Array.isArray(allMeals) ? allMeals : []);

        // daily target
        const t = await loadDailyTarget(user.uid);
        if (!alive) return;
        setTargetCals(Number.isFinite(t) ? Number(t) : null);
      } catch (e) {
        console.warn('SummaryModal load error:', e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [user?.uid]);

  // ---- Journal metrics (last N days) ----
  const recentEntries = useMemo(() => {
    if (!Array.isArray(entries)) return [];
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - (lookbackDays - 1));
    return entries.filter(e => {
      const dt = new Date(e.dateISO || e.date || e.createdAt || now);
      return dt >= start && dt <= now;
    });
  }, [entries, lookbackDays]);

  const avgMood = useMemo(() => {
    const nums = recentEntries
      .map(e => e?.mood)
      .filter(v => typeof v === 'number' && Number.isFinite(v));
    const v = safeAvg(nums);
    if (!Number.isFinite(v)) return null;
    return moodMap.find(m => v >= m.min) || moodMap[moodMap.length - 1];
  }, [recentEntries]);

  const avgSleepHrs = useMemo(() => {
    const nums = recentEntries
      .map(e => e?.sleepHours ?? e?.sleep ?? e?.sleep_hrs)
      .filter(v => typeof v === 'number' && Number.isFinite(v));
    const v = safeAvg(nums);
    return Number.isFinite(v) ? v : null;
  }, [recentEntries]);

  const avgHydrationL = useMemo(() => {
    const nums = recentEntries
      .map(e => e?.hydrationLiters ?? e?.hydration ?? e?.waterIntakeL)
      .filter(v => typeof v === 'number' && Number.isFinite(v));
    const v = safeAvg(nums);
    return Number.isFinite(v) ? v : null;
  }, [recentEntries]);

  // ---- Meals: today + last 7 days ----
  const {
    todayMeals,
    allThreeLogged,
    todayCals,
    lastNDaysAvg
  } = useMemo(() => {
    if (!Array.isArray(meals)) {
      return { todayMeals: [], allThreeLogged: false, todayCals: 0, lastNDaysAvg: null };
    }

    const tMeals = meals.filter(m => sameDay(m.timestamp, Y, M, D));
    const categories = new Set(
      tMeals
        .map(m => (m.mealCategory || m.category || '').toLowerCase())
        .filter(Boolean)
    );
    const hasAll = REQUIRED_MEALS.every(x => categories.has(x));

    const sumToday = tMeals.reduce((acc, m) => acc + (Number(m.calories) || 0), 0);

    // 7d map
    const map = new Map();
    for (const it of meals) {
      const kc = Number(it?.calories);
      if (!Number.isFinite(kc)) continue;
      const key = dateKey(it.timestamp);
      map.set(key, (map.get(key) || 0) + kc);
    }
    const days = [];
    for (let i = 0; i < lookbackDays; i++) {
      const dt = new Date(Y, M, D);
      dt.setDate(D - i);
      const key = dt.toISOString().slice(0, 10);
      days.push(map.get(key) || 0);
    }
    let weekly = safeAvg(days);
    if (!Number.isFinite(weekly) || weekly === null) {
      // fallback: extrapolate from today if no history
      weekly = Number.isFinite(sumToday) ? sumToday : 0;
    }

    return {
      todayMeals: tMeals,
      allThreeLogged: hasAll,
      todayCals: sumToday,
      lastNDaysAvg: Math.round(weekly),
    };
  }, [meals, Y, M, D, lookbackDays]);

  const remainingToday = useMemo(() => {
    if (!Number.isFinite(targetCals)) return null;
    return Math.max(0, Math.round(targetCals - todayCals));
  }, [targetCals, todayCals]);

  // Show note only when all 3 meals are logged and a target exists
  const remainingNote = useMemo(() => {
    if (!Number.isFinite(targetCals) || !allThreeLogged) return undefined;
    const diff = Math.round(todayCals - targetCals); // positive = over
    if (Math.abs(diff) <= TARGET_TOLERANCE) return 'Right on target today.';
    if (diff > 0) return `Over by ${diff} kcal today.`;
    return `Under by ${Math.abs(diff)} kcal today.`;
  }, [targetCals, todayCals, allThreeLogged]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={S.overlay}>
        <View style={S.sheet}>
          <View style={S.header}>
            <Text style={S.title}>Summary</Text>
            <Pressable onPress={onClose}><Text style={S.close}>✕</Text></Pressable>
          </View>

          {loading ? (
            <View style={{ padding: 24, alignItems: 'center' }}>
              <ActivityIndicator />
            </View>
          ) : (
            <ScrollView style={{ maxHeight: '80%' }} contentContainerStyle={{ paddingBottom: 20 }}>
              {/* WELLBEING */}
              <View style={S.section}>
                <Text style={S.sectionTitle}>Wellbeing</Text>
                <View style={S.grid}>
                  <Metric label="Avg mood" value={avgMood ? `${avgMood.emoji} ${avgMood.label}` : '—'} />
                  <Metric label="Avg sleep (hrs)" value={avgSleepHrs != null ? fmtNumber(avgSleepHrs, 1) : '—'} />
                  <Metric label="Avg hydration (L)" value={avgHydrationL != null ? fmtNumber(avgHydrationL, 1) : '—'} />
                </View>
              </View>

              {/* DIET & CALORIES */}
              <View style={S.section}>
                <Text style={S.sectionTitle}>Diet & Calories</Text>

                <CardRow
                  label="Your daily target"
                  value={Number.isFinite(targetCals) ? `${Math.round(targetCals)} kcal` : 'Set in Profile/Calculator'}
                />
                <CardRow label="Today’s intake" value={`${Math.round(todayCals)} kcal`} />
                <CardRow
                  label="Remaining today"
                  value={Number.isFinite(remainingToday) ? `${remainingToday} kcal` : '—'}
                  hint={remainingNote}
                />
                <CardRow
                  label={`Predicted weekly avg (${lookbackDays}d)`}
                  value={`${Math.round(lastNDaysAvg || 0)} kcal/day`}
                />
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

function Metric({ label, value }) {
  return (
    <View style={S.metric}>
      <Text style={S.metricLabel}>{label}</Text>
      <Text style={S.metricValue}>{value}</Text>
    </View>
  );
}
function CardRow({ label, value, hint }) {
  return (
    <View style={S.row}>
      <Text style={S.rowLabel}>{label}</Text>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={S.rowValue}>{value}</Text>
        {hint ? <Text style={S.rowHint}>{hint}</Text> : null}
      </View>
    </View>
  );
}

const S = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#111', borderTopLeftRadius: 18, borderTopRightRadius: 18,
    paddingBottom: 10, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.06)'
  },
  header: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: '#fff', fontSize: 18, fontWeight: '800' },
  close: { color: 'rgba(255,255,255,0.8)', fontSize: 20 },

  section: { paddingHorizontal: 16, paddingVertical: 12 },
  sectionTitle: { color: '#fff', fontWeight: '700', marginBottom: 8 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metric: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 12, minWidth: '30%', flexGrow: 1 },
  metricLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginBottom: 4 },
  metricValue: { color: '#fff', fontSize: 16, fontWeight: '800' },

  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 12, marginBottom: 8
  },
  rowLabel: { color: 'rgba(255,255,255,0.8)' },
  rowValue: { color: '#fff', fontWeight: '800' },
  rowHint: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2 },
});
