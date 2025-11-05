import { MaterialIcons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/context/AuthContext';
import { ThemeContext } from '@/context/ThemeContext';
import { useDailyContent } from '@/hooks/useDailyContent';
import { listSaved, removeSavedTip, saveTip } from '@/lib/dnt/savedTips';

import { db } from '@/config/firebase'; // <— adjust if your firebase export path differs
import { doc, getDoc } from 'firebase/firestore';

function palette(theme) {
  const isDark = (theme?.mode ?? 'dark') === 'dark';
  return {
    bg: theme?.background ?? (isDark ? '#0F1115' : '#FFFFFF'),
    text: theme?.text ?? (isDark ? '#FFFFFF' : '#111111'),
    sub: theme?.textSecondary ?? (isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)'),
    card: '#111',
    cardSub: 'rgba(255,255,255,0.78)',
    chip: isDark ? '#1E1E1E' : '#EDEDED',
    border: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
  };
}

function Row({ item, saved, onOpen, onToggleSave, styles, C }) {
  return (
    <View style={styles.outerCard}>
      <View style={styles.rowCard}>
        <View style={styles.thumb} />
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={styles.title} numberOfLines={3}>{item.title}</Text>
          <Text style={styles.source} numberOfLines={1}>{item.sourceTitle}</Text>
        </View>
        <Pressable onPress={onToggleSave} hitSlop={10} style={{ padding: 6 }}>
          <MaterialIcons name={saved ? 'bookmark' : 'bookmark-border'} size={22} color={C.cardSub} />
        </Pressable>
        <Pressable onPress={onOpen} hitSlop={10} style={{ padding: 6 }}>
          <MaterialIcons name="open-in-new" size={20} color={C.cardSub} />
        </Pressable>
      </View>
    </View>
  );
}

export default function TipsScreen() {
  const { user } = useAuth();
  const { theme } = useContext(ThemeContext);
  const C = useMemo(() => palette(theme), [theme]);
  const styles = useMemo(() => createStyles(C), [C]);

  const { all, loading } = useDailyContent();

  const [tab, setTab] = useState<'history' | 'saved'>('history');
  const [saved, setSaved] = useState([]);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const snap = await getDoc(doc(db, 'users', user.uid));
      setIsPremium(!!snap.data()?.isPremium);
      setSaved(await listSaved(user.uid));
    })();
  }, [user]);

  const savedIndex = useMemo(() => Object.fromEntries(saved.map(s => [s.url, true])), [saved]);

  const open = async (url) => url && WebBrowser.openBrowserAsync(url);

  const toggleSave = async (item) => {
    if (!user) return;
    if (savedIndex[item.url]) {
      await removeSavedTip(user.uid, item.url);
    } else {
      await saveTip(user.uid, item);
    }
    setSaved(await listSaved(user.uid));
  };

  // HISTORY = derive up to 60 days from pool
  const days = 60;
  const today = new Date();
  const history = Array.from({ length: Math.min(days, all.length) }, (_, i) => {
    const base = Math.max(0, today.getDate() - 1);
    const idx = (base - i + all.length) % all.length;
    return all[idx];
  });

  const savedList = saved.map(s => ({
    title: s.title, sourceTitle: s.sourceTitle, url: s.url, type: s.type, tags: s.tags || []
  }));

  const listData = tab === 'saved' ? savedList : (isPremium ? history : []);

  return (
    <View style={styles.screen}>
      <Text style={styles.h1}>Tips</Text>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        <Pressable onPress={() => setTab('history')} style={[styles.tab, tab==='history' && styles.tabActive]}>
          <Text style={styles.tabText}>History</Text>
        </Pressable>
        <Pressable onPress={() => setTab('saved')} style={[styles.tab, tab==='saved' && styles.tabActive]}>
          <Text style={styles.tabText}>Saved</Text>
        </Pressable>
      </View>

      {/* Premium lock */}
      {tab === 'history' && !isPremium ? (
        <View style={styles.lockWrap}>
          <MaterialIcons name="lock" size={36} color={C.cardSub} />
          <Text style={styles.lockText}>History is a Premium feature.</Text>
        </View>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={(item, i) => item.url + i}
          renderItem={({ item }) => (
            <Row
              item={item}
              saved={!!savedIndex[item.url]}
              onOpen={() => open(item.url)}
              onToggleSave={() => toggleSave(item)}
              styles={styles}
              C={C}
            />
          )}
          ListEmptyComponent={!loading ? <Text style={styles.empty}>No items.</Text> : null}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}
    </View>
  );
}

function createStyles(C) {
  return StyleSheet.create({
    screen: { flex: 1, padding: 16, backgroundColor: C.bg },
    h1: { fontSize: 22, fontWeight: '800', color: C.text, marginBottom: 12 },
    tabsRow: { flexDirection: 'row', marginBottom: 12 },
    tab: {
      paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12,
      backgroundColor: C.chip, borderWidth: StyleSheet.hairlineWidth, borderColor: C.border, marginRight: 8
    },
    tabActive: { backgroundColor: 'rgba(255,255,255,0.10)' },
    tabText: { color: C.text, fontWeight: '600' },

    outerCard: { backgroundColor: C.card, borderRadius: 16, padding: 10, borderWidth: StyleSheet.hairlineWidth, borderColor: C.border, marginBottom: 12 },
    rowCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 10 },
    thumb: { width: 60, height: 60, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.12)', marginRight: 12 },
    title: { color: '#fff', fontWeight: '800', fontSize: 14.5, lineHeight: 20 },
    source: { color: C.cardSub, fontSize: 12, marginTop: 4 },
    lockWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 64 },
    lockText: { color: C.cardSub, marginTop: 8, textAlign: 'center' },
    empty: { color: C.sub }
  });
}
