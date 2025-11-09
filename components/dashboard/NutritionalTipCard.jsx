// components/dashboard/NutritionalTipCard.jsx
import { db } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';
import { ThemeContext } from '@/context/ThemeContext';
import { useDailyContent } from '@/hooks/useDailyContent';
import { listSaved, recordTipShownToday, removeSavedTip, saveTip } from '@/lib/dnt/savedTips';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { doc, getDoc } from 'firebase/firestore';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

function palette(theme) {
  return {
    cardBg: theme.surface,
    cardText: theme.text,
    cardSub: theme.textSecondary,
    accent: theme.primary,
    chip: theme.surface,
    border: theme.border || 'rgba(0,0,0,0.06)',
    chipBg: theme.primary + '15',
    rowBg: theme.background,
    thumbBg: theme.primary + '20',
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
  const [isPremium, setIsPremium] = useState(false);

// load plan/role once
useEffect(() => {
  (async () => {
    if (!user?.uid) return;
    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      const data = snap.exists() ? snap.data() : {};
      const plan = data?.subscription?.plan ?? data?.role; // support both fields
      const active = data?.subscription?.active ?? true;
      setIsPremium((plan === 'premium' || data?.role === 'premium') && active !== false);
    } catch {
      setIsPremium(false);
    }
  })();
}, [user?.uid]);
  
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

        <View style={styles.pillsRow}>
        {isPremium && (
          <Pressable
            onPress={() => router.push({ pathname: '/(tabs)/(home)/(tips)/tips-history', params: { tab: 'history' } })}
            style={styles.historyPill}
            hitSlop={10}
          >
            <Text style={styles.historyText}>History</Text>
          </Pressable>
        )}
        <Pressable
          onPress={() => router.push({ pathname: '/(tabs)/(home)/(tips)/tips-history', params: { tab: 'saved' } })}
          style={styles.historyPill}
          hitSlop={10}
        >
          <Text style={styles.historyText}>Saved</Text>
        </Pressable>
        </View>
      </View>

      <Pressable onPress={open} style={styles.rowCard} android_ripple={{ color: theme.primary + '20' }}>
        <View style={styles.thumb}>
          <Text style={{ fontSize: 28 }}>💡</Text>
        </View>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={styles.title} numberOfLines={3}>{current.title}</Text>
          <Text style={styles.source} numberOfLines={1}>{current.sourceTitle}</Text>
        </View>
        <Pressable onPress={toggleSave} hitSlop={10} style={{ padding: 6 }}>
          <MaterialIcons name={saved ? 'bookmark' : 'bookmark-border'} size={22} color={C.accent} />
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
    card: { 
      backgroundColor: C.cardBg, 
      borderRadius: 16, 
      padding: 16, 
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    header: { color: C.cardSub, fontSize: 13, fontWeight: '700', letterSpacing: 0.2 },
    pillsRow: { flexDirection: 'row', gap: 8 },
    historyPill: { 
      paddingHorizontal: 12, 
      paddingVertical: 6, 
      borderRadius: 12, 
      backgroundColor: C.chipBg 
    },
    historyText: { color: C.accent, fontSize: 12, fontWeight: '600' },
    rowCard: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      backgroundColor: C.rowBg, 
      borderRadius: 12, 
      padding: 12, 
      marginTop: 12 
    },
    thumb: { 
      width: 56, 
      height: 56, 
      borderRadius: 12, 
      backgroundColor: C.thumbBg, 
      marginRight: 12, 
      alignItems:'center', 
      justifyContent:'center' 
    },
    title: { color: C.cardText, fontSize: 14.5, lineHeight: 20, fontWeight: '700' },
    source: { color: C.cardSub, fontSize: 12, marginTop: 4 },
    footerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
    actionPill: { 
      paddingHorizontal: 16, 
      paddingVertical: 8, 
      backgroundColor: C.accent, 
      borderRadius: 12 
    },
    actionText: { color: '#fff', fontSize: 13, fontWeight: '600' }
  });
}
