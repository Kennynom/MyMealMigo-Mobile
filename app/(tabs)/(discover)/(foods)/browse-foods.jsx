import { db } from '@/lib/firebase';
import { router, useFocusEffect } from 'expo-router';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Image, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';

const PLACEHOLDER = require('@/assets/images/placeholder-recipe.png');

export default function BrowseFoods() {
  const scheme = useColorScheme();
  const c = colors(scheme);
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useFocusEffect(
    useCallback(() => {
      const q = query(collection(db, 'foods'), orderBy('name'));
      const unsub = onSnapshot(q, (snap) => {
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setFoods(items);
        setLoading(false);
      }, () => setLoading(false));
      return () => unsub();
    }, [])
  );

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return foods;
    return foods.filter(f =>
      (f.name || '').toLowerCase().includes(s) ||
      (f.category || '').toLowerCase().includes(s)
    );
  }, [foods, search]);

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <Text style={[styles.headerTitle, { color: c.text }]}>Food Dictionary</Text>
        <TextInput
          placeholder="Search foods or categories…"
          placeholderTextColor={c.muted}
          value={search}
          onChangeText={setSearch}
          style={[styles.search, { backgroundColor: c.surface, color: c.text, borderColor: c.border }]}
          returnKeyType="search"
        />
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => setLoading(true)} tintColor={c.muted} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyWrap}>
              <Text style={[styles.emptyTitle, { color: c.text }]}>No foods found</Text>
              <Text style={[styles.emptySub, { color: c.muted }]}>
                Try a different search term.
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => <FoodCard item={item} colors={c} />}
      />
    </View>
  );
}

function FoodCard({ item, colors: c }) {
  const subtitle = [item.category, item.serving_size].filter(Boolean).join(' • ');
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}
      onPress={() => router.push({ pathname: '(foods)/[id]', params: { id: item.id } })}
    >
      <Image source={item.image_url ? { uri: item.image_url } : PLACEHOLDER} style={styles.thumb} />
      <View style={styles.cardBody}>
        <Text numberOfLines={1} style={[styles.title, { color: c.text }]}>{item.name || 'Unnamed'}</Text>
        <Text numberOfLines={2} style={[styles.subtitle, { color: c.muted }]}>{subtitle || '—'}</Text>
        <View style={styles.metaRow}>
          {item.calories ? <Text style={[styles.meta, { color: c.muted }]}>{item.calories} kcal</Text> : null}
          {item.protein_g ? <Text style={[styles.meta, { color: c.muted }]}>• {item.protein_g} g protein</Text> : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 12, paddingHorizontal: 16, paddingBottom: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  headerTitle: { fontSize: 22, fontWeight: '700', marginBottom: 10 },
  search: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15 },

  card: { flexDirection: 'row', borderWidth: 1, borderRadius: 14, overflow: 'hidden', marginBottom: 14 },
  thumb: { width: 92, height: 92, backgroundColor: '#333' },
  cardBody: { flex: 1, padding: 12 },
  title: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 13, lineHeight: 18 },
  metaRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  meta: { fontSize: 12 },

  emptyWrap: { alignItems: 'center', paddingTop: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  emptySub: { fontSize: 14, textAlign: 'center', paddingHorizontal: 24 },
});

function colors(scheme) {
  const dark = scheme === 'dark';
  return {
    bg: dark ? '#0B0B0D' : '#F7F7F8',
    surface: dark ? '#141418' : '#FFFFFF',
    text: dark ? '#F5F6F8' : '#121319',
    muted: dark ? 'rgba(234,236,240,0.64)' : 'rgba(21,23,28,0.64)',
    border: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    accent: '#1DB954',
  };
}
