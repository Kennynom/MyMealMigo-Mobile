// app/(tabs)/(home)/(tips)/tips-history.jsx
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { listHistory, listSaved, removeSavedTip, saveTip } from '@/lib/dnt/savedTips';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function TipsHistoryScreen() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { user } = useAuth();

  const { tab: init } = useLocalSearchParams(); // "saved" | "history"
  const [tab, setTab] = useState(init === 'saved' ? 'Saved' : 'History');

  const [saved, setSaved] = useState([]);
  const [history, setHistory] = useState([]);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    if (!user?.uid) return;
    (async () => {
      const [s, h] = await Promise.all([listSaved(user.uid), listHistory(user.uid)]);
      setSaved(s);
      setHistory(h);
    })();
  }, [user?.uid]);

  const list = tab === 'Saved' ? saved : history;

  async function handleToggleSave(item) {
    if (!user?.uid) return;
    try {
      setBusyId(item.id || item.url);
      const isInSaved = saved.some(s => (s.id === item.id) || (s.url === item.url));
      if (isInSaved) {
        await removeSavedTip(user.uid, item.id || item.url);
        setSaved(prev => prev.filter(s => s.id !== item.id));
      } else {
        // item from history → allow save
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
          style={[styles.tabBtn, tab === 'History' ? styles.tabActive : null]}
          onPress={() => setTab('History')}
        >
          <Text style={[styles.tabText, tab === 'History' ? styles.tabTextActive : null]}>History</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'Saved' ? styles.tabActive : null]}
          onPress={() => setTab('Saved')}
        >
          <Text style={[styles.tabText, tab === 'Saved' ? styles.tabTextActive : null]}>Saved</Text>
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
              {tab === 'Saved' ? "No saved tips yet." : "No history yet."}
            </Text>
          </View>
        )}
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
    cardSource: { color: theme.textSecondary, marginTop: 4, marginBottom: 8 },
    actions: { flexDirection: 'row', gap: 8 },
    actionBtn: {
      backgroundColor: theme.primary, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8,
    },
    secondaryBtn: { backgroundColor: theme.altBackground },
    actionText: { color: theme.buttonText, fontWeight: '700' },

    empty: { padding: 32, alignItems: 'center' },
    emptyText: { color: theme.textSecondary },
  });
}
