// app/(onboarding)/start.jsx
import { db } from '@/lib/firebase';
import { useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import ACIStep from './steps/ACI';
import ActivityStep from './steps/Activity';
import BodyStep from './steps/Body';
import GoalStep from './steps/Goal';
import MedicationsStep from './steps/Medications';
import ParqStep from './steps/Parq';
import SexBirthStep from './steps/SexBirth';

function ProgressBar({ step, total }) {
  const progress = (step + 1) / total;
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: progress,
      duration: 350,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const widthInterpolate = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={s.pWrap}>
      <View style={s.pTrack}>
        <Animated.View style={[s.pFill, { width: widthInterpolate }]} />
      </View>
      <Text style={s.pLabel}>Step {step + 1} of {total}</Text>
    </View>
  );
}

export default function OnboardingStart() {
  const router = useRouter();
  const [profile, setProfile] = useState({
    version: 1,
    completed: false,
    fitness: {},
    parq: { hasRedFlags: false, notes: '' },
    allergies: [],
    conditions: [],
    injuries: [],
    medications: '',
  });
  const [idx, setIdx] = useState(0);

  const steps = useMemo(
    () => [
      { key: 'sexBirth', title: 'About you',     Comp: SexBirthStep },
      { key: 'body',     title: 'Body metrics',  Comp: BodyStep },
      { key: 'aci',      title: 'Health info',   Comp: ACIStep },
      { key: 'meds',     title: 'Medications',   Comp: MedicationsStep },
      { key: 'goal',     title: 'Goal',          Comp: GoalStep },
      { key: 'activity', title: 'Activity',      Comp: ActivityStep },
      { key: 'parq',     title: 'Health check',  Comp: ParqStep },
    ],
    []
  );
  const Current = steps[idx].Comp;

  // Write private + public mirrors
  const dualSave = async (uid, data) => {
    const batch = writeBatch(db);
    const refPrivate = doc(db, 'users', uid, 'private', 'healthProfile');      // doc ✅
    const refPublic  = doc(db, 'users', uid, 'public',  'healthInformation');  // doc ✅
    batch.set(refPrivate, data, { merge: true });
    batch.set(refPublic,  data, { merge: true });
    await batch.commit();
  };

  // Save partials only if signed in; always keep local state up to date
  const savePartial = async (patch) => {
    const auth = getAuth();
    const uid = auth.currentUser && auth.currentUser.uid;

    const next = {
      ...profile,
      ...patch,
      version: 1,
      createdAt: profile.createdAt || serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    setProfile(next);

    if (!uid) return; // skip remote writes until after signup
    try {
      await dualSave(uid, next);
    } catch (e) {
      console.warn('Partial save failed:', e && e.message ? e.message : e);
    }
  };

  // If signed in: save + go Home. If not: go to Sign Up with payload.
  const finish = async () => {
    const auth = getAuth();
    const uid = auth.currentUser && auth.currentUser.uid;

    const base = {
      ...profile,
      version: 1,
      createdAt: profile.createdAt || serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    if (uid) {
      try {
        await dualSave(uid, { ...base, completed: true });
      } catch (e) {
        console.warn('Final save failed:', e && e.message ? e.message : e);
      }
      router.replace('/(tabs)/(home)');
      return;
    }

    // Not signed in → pass onboarding data to signup
    const payload = encodeURIComponent(JSON.stringify({ ...base, completed: false }));
    router.replace({
      pathname: '/(auth)/signup',
      params: { onboardingData: payload }, // string param
    });
  };

  const onNext = async (patch) => {
    await savePartial(patch);
    if (idx < steps.length - 1) setIdx((i) => i + 1);
    else await finish();
  };

  const onBack = () => {
    if (idx === 0) {
      // first step → exit onboarding to landing
      router.replace('/(auth)/landing');
      return;
    }
    setIdx((i) => Math.max(0, i - 1));
  };

  return (
    <View style={s.wrap}>
      <ProgressBar step={idx} total={steps.length} />
      <Text style={s.h1}>{steps[idx].title}</Text>
      <View style={{ flex: 1 }}>
        <Current value={profile} onNext={onNext} onBack={onBack} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, padding: 16, paddingTop: 28, backgroundColor: '#f8fafc' },
  pWrap: { marginBottom: 10 },
  pTrack: { height: 8, backgroundColor: '#e2e8f0', borderRadius: 999, overflow: 'hidden' },
  pFill: { height: '100%', backgroundColor: '#059669' },
  pLabel: { marginTop: 6, color: '#64748b', fontWeight: '600' },
  h1: { fontSize: 22, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
});
