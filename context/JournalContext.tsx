// context/JournalContext.tsx
import { auth, db } from '@/lib/firebase';
import dayjs from 'dayjs';
import { onAuthStateChanged } from 'firebase/auth';
import {
  addDoc, collection, deleteDoc, doc, onSnapshot,
  orderBy, query, serverTimestamp, updateDoc, where,
} from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type JournalEntry = {
  id?: string;
  dateISO: string;
  mood?: number;  moodNum?: number;
  energy?: number; energyNum?: number;
  sleep?: number;  sleepNum?: number;
  stress?: number; stressNum?: number;
  hydration?: number; hydrationNum?: number;
  tags?: string[];
  text: string;
  summary?: string;
  metrics?: { calories?: number; steps?: number; weight?: number; };
  createdAt?: any;
  updatedAt?: any;
};

type RangeKey = 'DAY' | 'WEEK' | 'MONTH';
type Ctx = {
  entries: JournalEntry[];
  range: RangeKey;
  setRange: (r: RangeKey) => void;
  loading: boolean;
  addEntry: (e: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateEntry: (id: string, e: Partial<JournalEntry>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  todayEntry?: JournalEntry;
  stats: {
    streak: number;
    avgMood?: number; avgEnergy?: number; avgSleep?: number; avgStress?: number; avgHydration?: number;
  };
};

const JournalContext = createContext<Ctx | null>(null);
export const useJournal = () => {
  const ctx = useContext(JournalContext);
  if (!ctx) throw new Error('useJournal must be used within JournalProvider');
  return ctx;
};

function getRange(range: RangeKey) {
  const end = dayjs().endOf('day');
  let start = dayjs().startOf('day');
  if (range === 'WEEK') start = dayjs().subtract(6, 'day').startOf('day');
  if (range === 'MONTH') start = dayjs().subtract(29, 'day').startOf('day');
  return { startISO: start.format('YYYY-MM-DD'), endISO: end.format('YYYY-MM-DD') };
}

export const JournalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [range, setRange] = useState<RangeKey>('WEEK');
  const [uid, setUid] = useState<string | null>(auth.currentUser?.uid ?? null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUid(u?.uid ?? null));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!uid) { setEntries([]); return; }
    setLoading(true);

    const { startISO, endISO } = getRange(range);
    const col = collection(db, 'users', uid, 'private', 'health_profile', 'reflection_log');

    const q = query(
      col,
      where('dateISO', '>=', startISO),
      where('dateISO', '<=', endISO),
      orderBy('dateISO', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      const list: JournalEntry[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
      setEntries(list);
      setLoading(false);
    }, () => setLoading(false));

    return () => unsub();
  }, [range, uid]);

  const addEntry: Ctx['addEntry'] = async (e) => {
    if (!uid) throw new Error('Not signed in');
    const col = collection(db, 'users', uid, 'private', 'health_profile', 'reflection_log');
    await addDoc(col, { ...e, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  };

  const updateEntry: Ctx['updateEntry'] = async (id, e) => {
    if (!uid) throw new Error('Not signed in');
    await updateDoc(doc(db, 'users', uid, 'private', 'health_profile', 'reflection_log', id), {
      ...e, updatedAt: serverTimestamp(),
    });
  };

  const deleteEntry: Ctx['deleteEntry'] = async (id) => {
    if (!uid) throw new Error('Not signed in');
    await deleteDoc(doc(db, 'users', uid, 'private', 'health_profile', 'reflection_log', id));
  };

  const { todayEntry, stats } = useMemo(() => {
    const todayISO = dayjs().format('YYYY-MM-DD');
    const todayEntry = entries.find((e) => e.dateISO === todayISO);

    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const d = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
      if (entries.some((e) => e.dateISO === d)) streak++;
      else break;
    }

    const toNums = (arr: any[]) => arr.filter((x) => typeof x === 'number') as number[];
    const avg = (xs: number[]) => xs.length ? Number((xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(1)) : undefined;

    const moods = toNums(entries.map((e) => e.moodNum ?? e.mood));
    const energies = toNums(entries.map((e) => e.energyNum ?? e.energy));
    const sleeps = toNums(entries.map((e) => e.sleepNum ?? e.sleep));
    const stresses = toNums(entries.map((e) => e.stressNum ?? e.stress));
    const hydrations = toNums(entries.map((e) => e.hydrationNum ?? e.hydration));

    return {
      todayEntry,
      stats: {
        streak,
        avgMood: avg(moods),
        avgEnergy: avg(energies),
        avgSleep: avg(sleeps),
        avgStress: avg(stresses),
        avgHydration: avg(hydrations)
      }
    };
  }, [entries]);

  const value: Ctx = { entries, range, setRange, loading, addEntry, updateEntry, deleteEntry, todayEntry, stats };
  return <JournalContext.Provider value={value}>{children}</JournalContext.Provider>;
};
