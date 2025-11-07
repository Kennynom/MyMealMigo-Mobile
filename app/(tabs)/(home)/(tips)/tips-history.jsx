// app/(tabs)/(home)/(tips)/tips-history.jsx
import manifest from '@/assets/data/content_manifest.json';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { listHistory, listSaved, removeSavedTip, saveTip } from '@/lib/dnt/savedTips';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

function urlToDayIndex(url) {
  if (!url) return null;
  const idx = manifest.findIndex(item => item.url === url);
  return idx >= 0 ? idx + 1 : null; // 1..N
}

function todaysCutoffDay() {
  const d = new Date().getDate(); // 1..31
  return Math.min(30, Math.max(1, d)); // cap to your 30-day cycle
}

export default function TipsHistoryScreen() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { user } = useAuth();

  const { tab: init } = useLocalSearchParams(); // "saved" | "history"
  const [tab, setTab] = useState(init === 'saved' ? 'Saved' : 'History');

  const [saved, setSaved] = useState([]);
  const [history, setHistory] = useState([]);
  const [busyId, setBusyId] = useState(null);

  // Load raw lists
  useEffect(() => {
    if (!user?.uid) return;
    (async () => {
      const [s, h] = await Promise.all([listSaved(user.uid), listHistory(user.uid)]);
      setSaved(s);
      setHistory(h);
    })();
  }, [user?.uid]);

  // Filter “up to today” using manifest order
  const cutoff = todaysCutoffDay();
  const filterUpToToday = (items) =>
    items.filter(it => {
      const idx = urlToDayIndex(it.url);
      // If URL isn’t in manifest, still show it (could be ad-hoc saved link)
      if (idx == null) return true;
      return idx <= cutoff;
    });

  const viewSaved = tab === 'Saved';
  const list = useMemo(
    () => filterUpToToday(viewSaved ? saved : history),
    [viewSaved, saved, history, cutoff]
  );

  async function handleToggleSave(item) {
    if (!user?.uid) return;
    try {
      setBusyId(item.id || item.url);
      const isInSaved = saved.some(s => (s.id === item.id) || (s.url === item.url));
      if (isInSaved) {
        await removeSavedTip(user.uid, item.id || item.url);
        setSaved(prev => prev.filter(s => s.id !== item.id && s.url !== item.url));
      } else {
        const newId = await saveTip(user.uid, item);
        setSaved(prev => [{ id: newId, ...item }, ...prev]);
      }
    } finally {
      setBusyId(null);
    }
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Tips</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* TABS */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tabBtn, !viewSaved ? styles.tabActive : null]}
          onPress={() => setTab('History')}
        >
          <Text style={[styles.tabText, !viewSaved ? styles.tabTextActive : null]}>History</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, viewSaved ? styles.tabActive : null]}
          onPress={() => setTab('Saved')}
        >
          <Text style={[styles.tabText, viewSaved ? styles.tabTextActive : null]}>Saved</Text>
        </TouchableOpacity>
      </View>

      {/* LIST */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        {list.map((item) => (
          <View key={item.id || item.url} style={styles.card}>
            <View style={styles.thumbWrap}>
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.thumb} />
              ) : (
                <View style={styles.thumbPlaceholder}><Text style={styles.thumbEmoji}>💡</Text></View>
              )}
            </View>
            <View style={styles.cardText}>
              <Text numberOfLines={2} style={styles.cardTitle}>
                {item.title}
              </Text>
              <Text style={styles.cardSource}>{item.sourceTitle}</Text>

              {/* Show "Day X of 30" if the tip exists in the manifest */}
              {urlToDayIndex(item.url) != null && (
                <Text style={styles.metaText}>Day {urlToDayIndex(item.url)} of 30</Text>
              )}

              <View style={styles.actions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => Linking.openURL(item.url)}>
                  <Text style={styles.actionText}>Open</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.secondaryBtn]}
                  onPress={() => handleToggleSave(item)}
                  disabled={busyId === (item.id || item.url)}
                >
                  <Text style={styles.actionText}>
                    {saved.some(s => s.id === item.id || s.url === item.url) ? 'Unsave' : 'Save'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}

        {list.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {viewSaved ? "No saved tips available up to today." : "No history yet."}
            </Text>
          </View>
        )}

        {/* Footnote explaining the cutoff */}
        <View style={{ padding: 12, alignItems: 'center' }}>
          <Text style={styles.cutoffNote}>Showing tips up to day {cutoff} of 30.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    header: {
      backgroundColor: theme.surface, paddingTop: 56, paddingBottom: 12, paddingHorizontal: 16,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      borderBottomWidth: 1, borderBottomColor: theme.border,
    },
    backBtn: { padding: 6 },
    backIcon: { color: theme.text, fontSize: 22 },
    title: { color: theme.text, fontWeight: '800', fontSize: 22 },

    tabs: {
      flexDirection: 'row', gap: 8, backgroundColor: theme.surface,
      padding: 12, paddingTop: 8, justifyContent: 'center',
    },
    tabBtn: {
      flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center',
      backgroundColor: theme.inactive,
    },
    tabActive: { backgroundColor: theme.primary },
    tabText: { fontWeight: '700', color: theme.textSecondary },
    tabTextActive: { color: theme.buttonText },

    card: {
      flexDirection: 'row', backgroundColor: theme.surface, borderRadius: 12,
      padding: 12, marginBottom: 12, borderWidth: 1, borderColor: theme.border,
    },
    thumbWrap: { width: 72, height: 72, marginRight: 12 },
    thumb: { width: 72, height: 72, borderRadius: 8 },
    thumbPlaceholder: {
      width: 72, height: 72, borderRadius: 8, backgroundColor: theme.altBackground,
      alignItems: 'center', justifyContent: 'center',
    },
    thumbEmoji: { fontSize: 28 },
    cardText: { flex: 1 },
    cardTitle: { color: theme.text, fontSize: 15, fontWeight: '700' },
    cardSource: { color: theme.textSecondary, marginTop: 4, marginBottom: 6 },
    metaText: { color: theme.textSecondary, fontSize: 12, marginBottom: 8 },

    actions: { flexDirection: 'row', gap: 8 },
    actionBtn: { backgroundColor: theme.primary, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 },
    secondaryBtn: { backgroundColor: theme.altBackground },
    actionText: { color: theme.buttonText, fontWeight: '700' },

    empty: { padding: 32, alignItems: 'center' },
    emptyText: { color: theme.textSecondary },
    cutoffNote: { color: theme.textSecondary, fontSize: 12, opacity: 0.8 },
  });
}
