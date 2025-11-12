// app/(tabs)/(home)/(tips)/tips-history.jsx
import manifest from '@/assets/data/content_manifest.json';
import PremiumGate from '@/components/ui/PremiumGate';
import { db } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { listHistory, listSaved, removeSavedTip, saveTip } from '@/lib/dnt/savedTips';
import { dateForDayIndex, inclusiveCountUpToToday, tipIndexForDate } from '@/lib/dnt/schedule';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function TipsHistoryScreen() {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { user } = useAuth();
  const { tab: init } = useLocalSearchParams(); // "saved" | "history"

  // plan state
  const [isPremium, setIsPremium] = useState(false);

  // lists
  // Free users: default to History tab to show lock screen, not auto-redirect to Saved
  const [tab, setTab] = useState(init === 'saved' ? 'Saved' : 'History');
  const [saved, setSaved] = useState([]);
  const [history, setHistory] = useState([]);
  const [busyId, setBusyId] = useState(null);

  // --- Fetch plan from users/{uid} - check on mount and when screen comes into focus
  const checkPremiumStatus = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const ref = doc(db, 'users', user.uid);
      const snap = await getDoc(ref);
      const data = snap.exists() ? snap.data() : {};
      const plan = data?.subscription?.plan ?? data?.role;
      const active = data?.subscription?.active ?? true;
      setIsPremium((plan === 'premium' || data?.role === 'premium') && active !== false);
    } catch {
      setIsPremium(false);
    }
  }, [user?.uid]);

  // Check premium status on mount
  useEffect(() => {
    checkPremiumStatus();
  }, [checkPremiumStatus]);

  // Re-check premium status when screen comes into focus (e.g., after upgrading)
  useFocusEffect(
    useCallback(() => {
      checkPremiumStatus();
    }, [checkPremiumStatus])
  );

  // --- Fetch saved + history documents
  useEffect(() => {
    if (!user?.uid) return;
    (async () => {
      const [s, h] = await Promise.all([listSaved(user.uid), listHistory(user.uid)]);
      setSaved(s);
      setHistory(h);
    })();
  }, [user?.uid]);

  // ----- Build canonical history from anchor → today (continuous)
  const today = new Date();
  const countUpToToday = inclusiveCountUpToToday(today);

  const canonicalHistory = useMemo(() => {
    const out = [];
    for (let i = 0; i < countUpToToday; i++) {
      const date = dateForDayIndex(i);                 // Oct 1 + i
      const tipIdx = tipIndexForDate(date, manifest.length);
      const tip = manifest[tipIdx];
      if (tip) {
        out.push({
          ...tip,
          id: tip.url,
          dateISO: date.toISOString().slice(0,10),
          dayNumberSinceAnchor: i + 1,                 // 1..N
        });
      }
    }
    return out.reverse(); // newest first (today on top)
  }, [today, countUpToToday, manifest.length]);

  // Saved policy: show ALL saved to everyone (even if not in manifest).
  const list = tab === 'Saved' ? saved : canonicalHistory;

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
        {/* History tab - Always visible, lock shows in content area */}
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'History' ? styles.tabActive : null]}
          onPress={() => setTab('History')}
        >
          <Text style={[styles.tabText, tab === 'History' ? styles.tabTextActive : null]}>
            History{isPremium ? ` (${countUpToToday})` : ''}
          </Text>
        </TouchableOpacity>

        {/* Saved tab (free for everyone) */}
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'Saved' ? styles.tabActive : null]}
          onPress={() => setTab('Saved')}
        >
          <Text style={[styles.tabText, tab === 'Saved' ? styles.tabTextActive : null]}>
            Saved ({saved.length})
          </Text>
        </TouchableOpacity>
      </View>


      {/* LIST */}
      {tab === 'History' ? (
        <PremiumGate isPremium={isPremium} featureName="full Tips History">
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
            {canonicalHistory.map((item) => (
              <View key={item.id || item.url} style={styles.card}>
                {/* Tip Content Row */}
                <TouchableOpacity onPress={() => Linking.openURL(item.url)} style={styles.rowCard}>
                  <View style={styles.thumbWrap}>
                    {item.image ? (
                      <Image source={{ uri: item.image }} style={styles.thumb} />
                    ) : (
                      <View style={styles.thumbPlaceholder}>
                        <Text style={styles.thumbEmoji}>💡</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.cardText}>
                    <Text numberOfLines={2} style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardSource}>{item.sourceTitle}</Text>
                    {item.dateISO && (
                      <Text style={styles.metaText}>
                        {item.dateISO} • Day {item.dayNumberSinceAnchor}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>

                {/* Action Buttons Row */}
                <View style={styles.actions}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => Linking.openURL(item.url)}>
                    <Text style={styles.actionText}>Open</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionBtnOutline}
                    onPress={() => handleToggleSave(item)}
                    disabled={busyId === (item.id || item.url)}
                  >
                    <Text style={styles.actionTextOutline}>
                      {saved.some(s => s.id === item.id || s.url === item.url) ? 'Unsave' : 'Save'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        </PremiumGate>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
          {saved.map((item) => (
              <View key={item.id || item.url} style={styles.card}>
                {/* Tip Content Row */}
                <TouchableOpacity onPress={() => Linking.openURL(item.url)} style={styles.rowCard}>
                  <View style={styles.thumbWrap}>
                    {item.image ? (
                      <Image source={{ uri: item.image }} style={styles.thumb} />
                    ) : (
                      <View style={styles.thumbPlaceholder}>
                        <Text style={styles.thumbEmoji}>💡</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.cardText}>
                    <Text numberOfLines={2} style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardSource}>{item.sourceTitle}</Text>

                    {/* Show date & running day number if it came from the canonical history */}
                    {item.dateISO && (
                      <Text style={styles.metaText}>
                        {item.dateISO} • Day {item.dayNumberSinceAnchor}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>

                {/* Action Buttons Row */}
                <View style={styles.actions}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => Linking.openURL(item.url)}>
                    <Text style={styles.actionText}>Open</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionBtnOutline}
                    onPress={() => handleToggleSave(item)}
                    disabled={busyId === (item.id || item.url)}
                  >
                    <Text style={styles.actionTextOutline}>
                      {saved.some(s => s.id === item.id || s.url === item.url) ? 'Unsave' : 'Save'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {list.length === 0 && tab === 'Saved' && (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>No saved tips yet.</Text>
              </View>
            )}
          </ScrollView>
        )}
    </View>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    header: {
      backgroundColor: theme.background, paddingTop: 56, paddingBottom: 12, paddingHorizontal: 16,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      borderBottomWidth: 1, borderBottomColor: theme.border,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.surface,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    backIcon: {
      color: theme.text,
      fontSize: 20,
      fontWeight: '600',
    },
    title: { color: theme.text, fontWeight: '800', fontSize: 22 },

    tabs: {
      flexDirection: 'row', gap: 8, backgroundColor: theme.background,
      padding: 12, paddingTop: 8, justifyContent: 'center',
    },
    tabBtn: {
      flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center',
      backgroundColor: theme.inactive,
    },
    tabActive: { backgroundColor: theme.primary },
    tabText: { fontWeight: '700', color: theme.textSecondary },
    tabTextActive: { color: theme.buttonText },

    upsell: {
      backgroundColor: theme.altBackground, padding: 10, marginHorizontal: 16, borderRadius: 10,
      borderWidth: 1, borderColor: theme.border,
    },
    upsellText: { color: theme.textSecondary, fontWeight: '600', textAlign: 'center' },

    card: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    rowCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.background,
      borderRadius: 12,
      padding: 12,
      marginBottom: 12,
    },
    thumbWrap: {
      width: 56,
      height: 56,
      marginRight: 12,
    },
    thumb: {
      width: 56,
      height: 56,
      borderRadius: 12,
    },
    thumbPlaceholder: {
      width: 56,
      height: 56,
      borderRadius: 12,
      backgroundColor: theme.primary + '20',
      alignItems: 'center',
      justifyContent: 'center',
    },
    thumbEmoji: { fontSize: 28 },
    cardText: { flex: 1 },
    cardTitle: {
      color: theme.text,
      fontSize: 14.5,
      fontWeight: '700',
      lineHeight: 20,
    },
    cardSource: {
      color: theme.textSecondary,
      fontSize: 12,
      marginTop: 4,
    },
    metaText: {
      color: theme.textSecondary,
      fontSize: 12,
      marginTop: 4,
    },

    actions: { flexDirection: 'row', gap: 8 },
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.primary,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 12,
    },
    actionText: { color: theme.altText, fontSize: 13, fontWeight: '600' },
    actionBtnOutline: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: theme.primary,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 12,
    },
    actionTextOutline: { color: theme.primary, fontSize: 13, fontWeight: '600' },

    empty: { padding: 32, alignItems: 'center' },
    emptyText: { color: theme.textSecondary },
  });
}
