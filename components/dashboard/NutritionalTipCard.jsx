// components/dashboard/NutritionalTipCard.jsx
import { useAuth } from '@/context/AuthContext';
import { ThemeContext } from '@/context/ThemeContext';
import { useDailyContent } from '@/hooks/useDailyContent';
import { listSaved, recordTipShownToday, removeSavedTip, saveTip } from '@/lib/dnt/savedTips';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

function palette(theme) {
  const isDark = (theme?.mode ?? 'dark') === 'dark';
  return {
    cardBg: '#111',
    cardSub: 'rgba(255,255,255,0.78)',
    chip: isDark ? '#1E1E1E' : '#EDEDED',
    border: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
  };
}

export default function NutritionalTipCard() {
  const router = useRouter();
  const { user } = useAuth();

  // ⬅️ make sure your hook returns { current, loading, next, prev }
  // If it doesn’t yet, add prev in the hook (see note below).
  const { current, loading, next, prev } = useDailyContent();

  const { theme } = useContext(ThemeContext);
  const C = useMemo(() => palette(theme), [theme]);
  const styles = useMemo(() => createStyles(C), [C]);

  const [saved, setSaved] = useState(false);

  // Check saved state whenever tip changes
  useEffect(() => {
    (async () => {
      if (!user || !current?.url) { setSaved(false); return; }
      try {
        console.log('🔍 [TIP CARD] Fetching saved tips for user:', user.uid);
        const docs = await listSaved(user.uid);
        setSaved(docs.some(d => d.url === current.url));
        console.log('✅ [TIP CARD] Successfully fetched saved tips');
      } catch (err) {
        console.error('❌ [TIP CARD] ERROR fetching saved tips:', err.code, err.message);
        setSaved(false);
      }
    })();
  }, [user, current?.url]);

  // Record today's tip to History the first time user sees it today
  useEffect(() => {
    (async () => {
      if (!user?.uid || !current?.url) return;
      try {
        console.log('🔍 [TIP CARD] Recording tip to history for user:', user.uid);
        await recordTipShownToday(user.uid, current);
        console.log('✅ [TIP CARD] Successfully recorded tip to history');
      } catch (e) {
        console.error('❌ [TIP CARD] ERROR recording tip to history:', e.code, e.message);
      }
    })();
  }, [user?.uid, current?.url]);

  if (loading || !current) {
    return (
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MaterialIcons name="emoji-food-beverage" size={18} color={C.cardSub} style={{ marginRight: 6 }} />
            <Text style={styles.header}>Tip of the day</Text>
          </View>
        </View>
        <View style={{ height: 48 }} />
      </View>
    );
  }

  const open = async () => current.url && WebBrowser.openBrowserAsync(current.url);

  const toggleSave = async () => {
    if (!user) return;
    if (saved) {
      await removeSavedTip(user.uid, current.url);
      setSaved(false);
    } else {
      await saveTip(user.uid, current);
      setSaved(true);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <MaterialIcons name={current.type === 'video' ? 'ondemand-video' : 'emoji-food-beverage'} size={18} color={C.cardSub} style={{ marginRight: 6 }} />
          <Text style={styles.header}>Tip of the day</Text>
        </View>

        {/* History / Saved pill → your new screen */}
        <Pressable
          onPress={() => router.push('/(tabs)/(home)/(tips)/tips-history?tab=history')}
          style={styles.historyPill}
          hitSlop={10}
        >
          <Text style={styles.historyText}>History / Saved</Text>
        </Pressable>
      </View>

      <Pressable onPress={open} style={styles.rowCard} android_ripple={{ color: 'rgba(255,255,255,0.08)' }}>
        <View style={styles.thumb}>
          <Text style={{ color: '#fff', textAlign: 'center' }}>💡</Text>
        </View>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={styles.title} numberOfLines={3}>{current.title}</Text>
          <Text style={styles.source} numberOfLines={1}>{current.sourceTitle}</Text>
        </View>
        <Pressable onPress={toggleSave} hitSlop={10} style={{ padding: 6 }}>
          <MaterialIcons name={saved ? 'bookmark' : 'bookmark-border'} size={22} color={C.cardSub} />
        </Pressable>
      </Pressable>

      <View style={styles.footerRow}>
        <Pressable onPress={open} style={[styles.actionPill, { marginRight: 8 }]}>
          <Text style={styles.actionText}>Open</Text>
        </Pressable>

        <Pressable onPress={toggleSave} style={[styles.actionPill, { marginRight: 8 }]}>
          <Text style={styles.actionText}>{saved ? 'Unsave' : 'Save'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function createStyles(C) {
  return StyleSheet.create({
    card: { backgroundColor: C.cardBg, borderRadius: 16, padding: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: C.border },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    header: { color: C.cardSub, fontSize: 13, fontWeight: '700', letterSpacing: 0.2 },
    historyPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)' },
    historyText: { color: C.cardSub, fontSize: 12, fontWeight: '600' },
    rowCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 10, marginTop: 10 },
    thumb: { width: 60, height: 60, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.12)', marginRight: 12, alignItems:'center', justifyContent:'center' },
    title: { color: '#fff', fontSize: 14.5, lineHeight: 20, fontWeight: '700' },
    source: { color: C.cardSub, fontSize: 12, marginTop: 4 },
    footerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
    actionPill: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12 },
    actionText: { color: '#fff', fontSize: 12.5, fontWeight: '600' }
  });
}
