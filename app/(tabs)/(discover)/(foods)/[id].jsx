import { useTheme } from '@/context/ThemeContext';
import { db } from '@/lib/firebase';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const PLACEHOLDER = require('@/assets/images/placeholder-recipe.png');

export default function FoodDetail() {
  const { id } = useLocalSearchParams();      // food doc id
  const { theme } = useTheme();

  const [item, setItem] = useState(null);
  const styles = createStyles(theme);

  useEffect(() => {
    (async () => {
      const snap = await getDoc(doc(db, 'foods', String(id)));
      if (snap.exists()) setItem({ id: snap.id, ...snap.data() });
    })();
  }, [id]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {item?.name || 'Food Details'}
          </Text>
          <Text style={styles.headerSubtitle}>Nutrition information</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      {!item ? (
        <View style={styles.center}><Text style={{ color: theme.textSecondary }}>Loading…</Text></View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Hero image */}
          <Image
            source={ item.image_url ? { uri: item.image_url } : PLACEHOLDER }
            style={styles.hero}
          />

          {/* Title + description */}
          <View style={styles.block}>
            <Text style={styles.title}>{item.name}</Text>
            <Text style={styles.desc}>
              {[item.category, item.serving_size].filter(Boolean).join(' • ') || '—'}
            </Text>

            {!!item.description && (
              <Text style={[styles.desc, { marginTop: 8 }]}>{item.description}</Text>
            )}
          </View>

          {/* Nutrition */}
          <View style={styles.block}>
            <Text style={styles.sectionTitle}>Nutrition (per serving)</Text>
            {row('Calories', item.calories, 'kcal', theme, styles)}
            {row('Protein', item.protein_g, 'g', theme, styles)}
            {row('Fat', item.fat_g, 'g', theme, styles)}
            {row('Carbohydrates', item.carbs_g, 'g', theme, styles)}
            {row('Fiber', item.fiber_g, 'g', theme, styles)}
            {row('Sugar', item.sugar_g, 'g', theme, styles)}
            {row('Sodium', item.sodium_mg, 'mg', theme, styles)}
            {row('Potassium', item.potassium_mg, 'mg', theme, styles)}
            {row('Calcium', item.calcium_mg, 'mg', theme, styles)}
            {row('Iron', item.iron_mg, 'mg', theme, styles)}
          </View>

          {/* Meta sections */}
          {!!item.diet_type?.length && (
            <View style={styles.block}>
              <Text style={styles.sectionTitle}>Diet Type</Text>
              <Text style={styles.desc}>{item.diet_type.join(', ')}</Text>
            </View>
          )}

          {!!item.allergens?.length && (
            <View style={styles.block}>
              <Text style={styles.sectionTitle}>Allergens</Text>
              <Text style={styles.desc}>{item.allergens.join(', ')}</Text>
            </View>
          )}

          {!!item.common_uses?.length && (
            <View style={styles.block}>
              <Text style={styles.sectionTitle}>Common Uses</Text>
              <Text style={styles.desc}>{item.common_uses.join(', ')}</Text>
            </View>
          )}

          {!!item.substitutes?.length && (
            <View style={styles.block}>
              <Text style={styles.sectionTitle}>Substitutes</Text>
              <Text style={styles.desc}>{item.substitutes.join(', ')}</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

/* helpers */
function row(label, value, unit, theme, styles) {
  return (
    <Text style={[styles.li, { color: theme.text }]}>
      {label}: <Text style={{ color: theme.textSecondary }}>{value != null ? `${value} ${unit}` : '-'}</Text>
    </Text>
  );
}

const createStyles = (theme) => StyleSheet.create({
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
    paddingHorizontal: 8,
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: { width: '100%', height: 240, backgroundColor: '#333' },
  block: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: theme.background,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 6,
    color: theme.text,
  },
  desc: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.textSecondary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: theme.text,
  },
  li: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 4,
  },
});
