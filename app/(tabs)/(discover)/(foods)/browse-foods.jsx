import { useTheme } from '@/context/ThemeContext';
import { db } from '@/lib/firebase';
import { router, useFocusEffect } from 'expo-router';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Image, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const PLACEHOLDER = require('@/assets/images/placeholder-recipe.png');

export default function BrowseFoods() {
  const { theme } = useTheme();
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const styles = createStyles(theme);

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
          <Text style={styles.headerTitle}>Food Dictionary</Text>
          <Text style={styles.headerSubtitle}>Browse and search foods</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Search foods or categories…"
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
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No foods found</Text>
              <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
                Try a different search term.
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => <FoodCard item={item} theme={theme} />}
      />
    </View>
  );
}

function FoodCard({ item, theme }) {
  const subtitle = [item.category, item.serving_size].filter(Boolean).join(' • ');
  const styles = createStyles(theme);
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      style={styles.card}
      onPress={() => router.push({ pathname: '(foods)/[id]', params: { id: item.id } })}
    >
      <View style={styles.thumbContainer}>
        <Image source={item.image_url ? { uri: item.image_url } : PLACEHOLDER} style={styles.thumb} />
      </View>
      <View style={styles.cardBody}>
        <Text numberOfLines={1} style={[styles.title, { color: theme.text }]}>{item.name || 'Unnamed'}</Text>
        <Text numberOfLines={2} style={[styles.subtitle, { color: theme.textSecondary }]}>{subtitle || '—'}</Text>
        <View style={styles.metaRow}>
          {item.calories ? <Text style={[styles.meta, { color: theme.textSecondary }]}>{item.calories} kcal</Text> : null}
          {item.protein_g ? <Text style={[styles.meta, { color: theme.textSecondary }]}>• {item.protein_g} g protein</Text> : null}
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
    backgroundColor: theme.translucent, 
    color: theme.text, 
    borderColor: theme.border
  },

  card: {
    flexDirection: 'row',
    borderRadius: 16,
    marginBottom: 14,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    backgroundColor: theme.background
  },
  thumbContainer: {
    width: 92,
    height: 92,
    overflow: 'hidden',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  thumb: { 
    width: 92, 
    height: 92, 
    backgroundColor: theme.translucent 
  },
  cardBody: { 
    flex: 1, 
    padding: 12,
  },
  title: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 13, lineHeight: 18 },
  metaRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  meta: { fontSize: 12 },
  emptyWrap: { alignItems: 'center', paddingTop: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  emptySub: { fontSize: 14, textAlign: 'center', paddingHorizontal: 24 },
});
