import { db } from '@/lib/firebase';
import { Stack, useLocalSearchParams } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, useColorScheme, View } from 'react-native';

const PLACEHOLDER = require('@/assets/images/placeholder-recipe.png');

export default function FoodDetail() {
  const { id } = useLocalSearchParams();      // food doc id
  const scheme = useColorScheme();
  const c = colors(scheme);

  const [item, setItem] = useState(null);

  useEffect(() => {
    (async () => {
      const snap = await getDoc(doc(db, 'foods', String(id)));
      if (snap.exists()) setItem({ id: snap.id, ...snap.data() });
    })();
  }, [id]);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Stack.Screen
        options={{
          title: item?.name || 'Food Details',
          headerShown: true,
          headerStyle: { backgroundColor: c.bg },
          headerTintColor: c.text,
        }}
      />

      {!item ? (
        <View style={styles.center}><Text style={{ color: c.muted }}>Loading…</Text></View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Hero image */}
          <Image
            source={ item.image_url ? { uri: item.image_url } : PLACEHOLDER }
            style={styles.hero}
          />

          {/* Title + description */}
          <View style={[styles.block, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Text style={[styles.title, { color: c.text }]}>{item.name}</Text>
            <Text style={[styles.desc, { color: c.muted }]}>
              {[item.category, item.serving_size].filter(Boolean).join(' • ') || '—'}
            </Text>

            {!!item.description && (
              <Text style={[styles.desc, { color: c.muted, marginTop: 8 }]}>{item.description}</Text>
            )}
          </View>

          {/* Nutrition */}
          <View style={[styles.block, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Text style={[styles.sectionTitle, { color: c.text }]}>Nutrition (per serving)</Text>
            {row('Calories', item.calories, 'kcal', c)}
            {row('Protein', item.protein_g, 'g', c)}
            {row('Fat', item.fat_g, 'g', c)}
            {row('Carbohydrates', item.carbs_g, 'g', c)}
            {row('Fiber', item.fiber_g, 'g', c)}
            {row('Sugar', item.sugar_g, 'g', c)}
            {row('Sodium', item.sodium_mg, 'mg', c)}
            {row('Potassium', item.potassium_mg, 'mg', c)}
            {row('Calcium', item.calcium_mg, 'mg', c)}
            {row('Iron', item.iron_mg, 'mg', c)}
          </View>

          {/* Meta sections */}
          {!!item.diet_type?.length && (
            <View style={[styles.block, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Text style={[styles.sectionTitle, { color: c.text }]}>Diet Type</Text>
              <Text style={{ color: c.muted }}>{item.diet_type.join(', ')}</Text>
            </View>
          )}

          {!!item.allergens?.length && (
            <View style={[styles.block, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Text style={[styles.sectionTitle, { color: c.text }]}>Allergens</Text>
              <Text style={{ color: c.muted }}>{item.allergens.join(', ')}</Text>
            </View>
          )}

          {!!item.common_uses?.length && (
            <View style={[styles.block, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Text style={[styles.sectionTitle, { color: c.text }]}>Common Uses</Text>
              <Text style={{ color: c.muted }}>{item.common_uses.join(', ')}</Text>
            </View>
          )}

          {!!item.substitutes?.length && (
            <View style={[styles.block, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Text style={[styles.sectionTitle, { color: c.text }]}>Substitutes</Text>
              <Text style={{ color: c.muted }}>{item.substitutes.join(', ')}</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

/* helpers */
function row(label, value, unit, c) {
  return (
    <Text style={[styles.li, { color: c.text }]}>
      {label}: <Text style={{ color: c.muted }}>{value != null ? `${value} ${unit}` : '-'}</Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: { width: '100%', height: 240, backgroundColor: '#222' },
  block: { margin: 16, padding: 16, borderRadius: 14, borderWidth: 1 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 6 },
  desc: { fontSize: 14, lineHeight: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 10 },
  li: { fontSize: 14, lineHeight: 22, marginBottom: 4 },
});

function colors(scheme) {
  const dark = scheme === 'dark';
  return {
    bg: dark ? '#0B0B0D' : '#F7F7F8',
    surface: dark ? '#141418' : '#FFFFFF',
    text: dark ? '#F5F6F8' : '#121319',
    muted: dark ? 'rgba(234,236,240,0.68)' : 'rgba(21,23,28,0.68)',
    border: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
  };
}
