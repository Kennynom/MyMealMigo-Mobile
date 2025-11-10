import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, useColorScheme, RefreshControl, TextInput } from 'react-native';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useFocusEffect } from 'expo-router';
import { router } from 'expo-router';

const PLACEHOLDER = require('@/assets/images/placeholder-recipe.png'); // put any 1:1 image here

export default function BrowseRecipes() {
  const scheme = useColorScheme();
  const c = colors(scheme);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useFocusEffect(
    useCallback(() => {
      const q = query(
        collection(db, 'recipes'),
        where('status', '==', 'approved'),
        orderBy('createdAt', 'desc')
      );
      const unsub = onSnapshot(q, (snap) => {
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setRecipes(items);
        setLoading(false);
      });
      return () => unsub();
    }, [])
  );

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return recipes;
    return recipes.filter(r =>
      (r.title || '').toLowerCase().includes(s) ||
      (Array.isArray(r.tags) ? r.tags.join(' ').toLowerCase().includes(s) : false)
    );
  }, [recipes, search]);

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <Text style={[styles.headerTitle, { color: c.text }]}>Browse Recipes</Text>
        <TextInput
          placeholder="Search recipes or tags…"
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
              <Text style={[styles.emptyTitle, { color: c.text }]}>No recipes yet</Text>
              <Text style={[styles.emptySub, { color: c.muted }]}>
                Tap the + button to submit your first recipe.
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => <RecipeCard item={item} colors={c} />}
      />

      {/* FAB */}
      <TouchableOpacity
        onPress={() => router.push('(recipes)/new')}
        activeOpacity={0.9}
        style={[styles.fab, { backgroundColor: c.accent, shadowColor: c.accent }]}
      >
        <Text style={styles.fabPlus}>＋</Text>
      </TouchableOpacity>
    </View>
  );
}

function RecipeCard({ item, colors: c }) {
  const imgPath = item.imageURL
    ? { uri: item.imageURL }
    : item.imageStoragePath
      ? { uri: item.imageStoragePath.startsWith('http') ? item.imageStoragePath : undefined } // if you later expose a downloadURL
      : PLACEHOLDER;

  const subtitle =
    (item.description || '').trim() ||
    (Array.isArray(item.tags) ? item.tags.join(', ') : '');

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}
      onPress={() => router.push({ pathname: '(recipes)/[id]', params: { id: item.id } })}
    >
      <Image source={imgPath || PLACEHOLDER} style={styles.thumb} />
      <View style={styles.cardBody}>
        <Text numberOfLines={1} style={[styles.title, { color: c.text }]}>{item.title || 'Untitled'}</Text>
        <Text numberOfLines={2} style={[styles.subtitle, { color: c.muted }]}>{subtitle}</Text>

        <View style={styles.metaRow}>
          {item.cook_time ? <Text style={[styles.meta, { color: c.muted }]}>{item.cook_time} min</Text> : null}
          {item.calories ? <Text style={[styles.meta, { color: c.muted }]}>• {item.calories} kcal</Text> : null}
          {item.diet_type ? <Text style={[styles.meta, { color: c.muted }]}>• {item.diet_type}</Text> : null}
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

  fab: {
    position: 'absolute', right: 20, bottom: 28,
    width: 64, height: 64, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center',
    shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 8 },
  },
  fabPlus: { color: '#fff', fontSize: 34, lineHeight: 34, marginTop: -2 },
});

function colors(scheme) {
  const dark = scheme === 'dark';
  return {
    bg: dark ? '#0B0B0D' : '#F7F7F8',
    surface: dark ? '#141418' : '#FFFFFF',
    text: dark ? '#F5F6F8' : '#121319',
    muted: dark ? 'rgba(234,236,240,0.64)' : 'rgba(21,23,28,0.64)',
    border: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    accent: '#1DB954', // change if you want your brand color
  };
}
