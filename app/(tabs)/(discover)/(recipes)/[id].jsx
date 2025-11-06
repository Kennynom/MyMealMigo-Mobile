import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, StyleSheet, useColorScheme } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const PLACEHOLDER = require('@/assets/images/placeholder-recipe.png');

export default function RecipeDetail() {
  const { id } = useLocalSearchParams();          // recipe doc id
  const scheme = useColorScheme();
  const c = colors(scheme);

  const [item, setItem] = useState(null);

  useEffect(() => {
    (async () => {
      const snap = await getDoc(doc(db, 'recipes', String(id)));
      if (snap.exists()) setItem({ id: snap.id, ...snap.data() });
    })();
  }, [id]);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Stack.Screen
        options={{
          title: item?.title || 'Recipe',
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
            source={
              item.imageURL ? { uri: item.imageURL }
              : PLACEHOLDER
            }
            style={styles.hero}
          />

          {/* Title + description */}
          <View style={[styles.block, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Text style={[styles.title, { color: c.text }]}>{item.title}</Text>
            {!!item.description && (
              <Text style={[styles.desc, { color: c.muted }]}>{item.description}</Text>
            )}

            {/* Meta */}
            <View style={styles.metaRow}>
              {item.cook_time ? <Text style={[styles.meta, { color: c.muted }]}>{item.cook_time} min</Text> : null}
              {item.servings ? <Text style={[styles.meta, { color: c.muted }]}>• {item.servings} servings</Text> : null}
              {item.calories ? <Text style={[styles.meta, { color: c.muted }]}>• {item.calories} kcal</Text> : null}
              {item.diet_type ? <Text style={[styles.meta, { color: c.muted }]}>• {item.diet_type}</Text> : null}
            </View>
            {!!item.tags?.length && (
              <Text style={[styles.tags, { color: c.muted }]}>
                {Array.isArray(item.tags) ? item.tags.join(', ') : String(item.tags)}
              </Text>
            )}
          </View>

          {/* Ingredients */}
          {!!item.ingredients?.length && (
            <View style={[styles.block, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Text style={[styles.sectionTitle, { color: c.text }]}>Ingredients</Text>
              {item.ingredients.map((ing, i) => (
                <Text key={i} style={[styles.li, { color: c.text }]}>• {ing}</Text>
              ))}
            </View>
          )}

          {/* Steps */}
          {!!item.steps?.length && (
            <View style={[styles.block, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Text style={[styles.sectionTitle, { color: c.text }]}>Steps</Text>
              {item.steps.map((s, i) => (
                <Text key={i} style={[styles.step, { color: c.text }]}>{i + 1}. {s}</Text>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: { width: '100%', height: 240, backgroundColor: '#222' },
  block: { margin: 16, padding: 16, borderRadius: 14, borderWidth: 1 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 6 },
  desc: { fontSize: 14, lineHeight: 20 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  meta: { fontSize: 12 },
  tags: { fontSize: 12, marginTop: 6 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 10 },
  li: { fontSize: 14, lineHeight: 22, marginBottom: 4 },
  step: { fontSize: 15, lineHeight: 24, marginBottom: 8 },
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
