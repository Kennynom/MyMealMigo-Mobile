import { useTheme } from '@/context/ThemeContext';
import { db } from '@/lib/firebase';
import { router, useFocusEffect } from 'expo-router';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Image, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const PLACEHOLDER = require('@/assets/images/placeholder-recipe.png'); // put any 1:1 image here

export default function BrowseRecipes() {
  const { theme } = useTheme();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const styles = createStyles(theme);

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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Browse Recipes</Text>
          <Text style={styles.headerSubtitle}>Healthy & delicious</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Search recipes or tags…"
          placeholderTextColor={theme.textSecondary}
          value={search}
          onChangeText={setSearch}
          style={styles.search}
          returnKeyType="search"
        />
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        style={{ backgroundColor: theme.background }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => setLoading(true)} tintColor={theme.textSecondary} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyWrap}>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No recipes yet</Text>
              <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
                Tap the + button to submit your first recipe.
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => <RecipeCard item={item} theme={theme} />}
      />

      {/* FAB */}
      <TouchableOpacity
        onPress={() => router.push('(recipes)/new')}
        activeOpacity={0.9}
        style={styles.fab}
      >
        <Text style={styles.fabPlus}>＋</Text>
      </TouchableOpacity>
    </View>
  );
}

function RecipeCard({ item, theme }) {
  const styles = createStyles(theme);
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
      style={styles.card}
      onPress={() => router.push({ pathname: '(recipes)/[id]', params: { id: item.id } })}
    >
      <View style={styles.thumbContainer}>
        <Image source={imgPath || PLACEHOLDER} style={styles.thumb} />
      </View>
      <View style={styles.cardBody}>
        <Text numberOfLines={1} style={[styles.title, { color: theme.text }]}>{item.title || 'Untitled'}</Text>
        <Text numberOfLines={2} style={[styles.subtitle, { color: theme.textSecondary }]}>{subtitle}</Text>

        <View style={styles.metaRow}>
          {item.cook_time ? <Text style={[styles.meta, { color: theme.textSecondary }]}>{item.cook_time} min</Text> : null}
          {item.calories ? <Text style={[styles.meta, { color: theme.textSecondary }]}>• {item.calories} kcal</Text> : null}
          {item.diet_type ? <Text style={[styles.meta, { color: theme.textSecondary }]}>• {item.diet_type}</Text> : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.background,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  backText: {
    color: theme.text,
    fontSize: 20,
    fontWeight: '600',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: theme.textSecondary,
  },
  placeholder: { width: 40 },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: theme.background,
  },
  search: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: theme.background,
    color: theme.text,
    borderColor: theme.border,
  },

  card: {
    flexDirection: 'row',
    borderRadius: 16,
    marginBottom: 14,
    backgroundColor: theme.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  thumbContainer: {
    width: 92,
    height: 92,
    overflow: 'hidden',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
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
    backgroundColor: theme.primary,
    shadowColor: theme.primary,
    shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  fabPlus: { color: '#fff', fontSize: 34, lineHeight: 34, marginTop: -2 },
});
