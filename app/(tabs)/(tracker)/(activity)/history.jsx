import { MaterialIcons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { router } from 'expo-router';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { db } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';
import { ThemeContext } from '@/context/ThemeContext';
import { collection, deleteDoc, doc, onSnapshot } from 'firebase/firestore';

export default function ActivityHistoryScreen() {
  const { theme, colorScheme } = useContext(ThemeContext);
  const styles = useMemo(() => createStyles(theme), [theme, colorScheme]);
  const { user } = useAuth();

  const [list, setList] = useState([]);

  useEffect(() => {
    if (!user?.uid) return;
    const colRef = collection(db, 'users', user.uid, 'activity_log');
    const unsub = onSnapshot(colRef, (snap) => {
      const arr = [];
      snap.forEach((d) => arr.push({ id: d.id, ...(d.data() || {}) }));
      arr.sort((a, b) => (b?.createdAt?.seconds || 0) - (a?.createdAt?.seconds || 0));
      setList(arr);
    });
    return () => unsub();
  }, [user?.uid]);

  const remove = async (item) => {
    await deleteDoc(doc(db, 'users', user.uid, 'activity_log', item.id));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
          <MaterialIcons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Activity History</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView style={{ flex: 1, padding: 16 }} contentContainerStyle={{ paddingBottom: 40 }}>
        {list.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ color: theme.textSecondary }}>Nothing here yet.</Text>
          </View>
        ) : (
          list.map((it) => (
            <View key={it.id} style={styles.card}>
              <View style={styles.rowBetween}>
                <Text style={styles.title}>{it.type || 'Activity'}</Text>
                <TouchableOpacity onPress={() => remove(it)}>
                  <MaterialIcons name="delete-outline" size={20} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>
              <Text style={styles.meta}>
                {dayjs((it.createdAt?.seconds || 0) * 1000).format('MMM D, YYYY • h:mm a')}
              </Text>
              <View style={styles.metrics}>
                {it.calories != null && <Text style={styles.metric}>🔥 {it.calories} kcal</Text>}
                {it.distanceKm != null && <Text style={styles.metric}>📏 {it.distanceKm} km</Text>}
                {it.durationMin != null && <Text style={styles.metric}>⏱ {it.durationMin} min</Text>}
              </View>
              {!!it.notes && <Text style={styles.notes}>{it.notes}</Text>}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    header: {
      paddingTop: 56,
      paddingHorizontal: 16,
      paddingBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerBack: { paddingVertical: 4, paddingRight: 8 },
    headerTitle: { color: theme.text, fontSize: 20, fontWeight: '800' },

    empty: {
      marginTop: 24,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
    },
    card: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 14,
      marginBottom: 12,
    },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    title: { color: theme.text, fontWeight: '900', fontSize: 16 },
    meta: { color: theme.textSecondary, marginTop: 4 },
    metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
    metric: { color: theme.textSecondary, fontWeight: '600' },
    notes: { color: theme.textSecondary, marginTop: 6, fontStyle: 'italic' },
  });
