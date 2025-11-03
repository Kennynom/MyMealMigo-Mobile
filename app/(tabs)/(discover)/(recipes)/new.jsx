// app/(tabs)/(discover)/(recipes)/new.jsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  Image, ScrollView, StyleSheet, useColorScheme, Alert
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router, Stack } from 'expo-router';
import { auth, db, storage } from '@/lib/firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const PLACEHOLDER = require('@/assets/images/placeholder-recipe.png');

export default function NewRecipe() {
  const scheme = useColorScheme();
  const c = colors(scheme);

  // core fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ingredients, setIngredients] = useState(['']);
  const [steps, setSteps] = useState(['']);
  const [tags, setTags] = useState('');            // comma-separated
  const [cuisine, setCuisine] = useState('Singaporean');
  const [difficulty, setDifficulty] = useState('Easy'); // Easy | Medium | Hard
  const [diet, setDiet] = useState('Halal');       // Halal | Non-Halal
  const [cookTime, setCookTime] = useState('');
  const [servings, setServings] = useState('');
  const [calories, setCalories] = useState('');

  const [image, setImage] = useState(null);        // local uri
  const [submitting, setSubmitting] = useState(false);

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo library access to attach an image.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!res.canceled) {
      setImage(res.assets[0].uri);
    }
  }

  function addRow(type) {
    type === 'ing' ? setIngredients([...ingredients, '']) : setSteps([...steps, '']);
  }
  function removeRow(type, idx) {
    if (type === 'ing') {
      const arr = [...ingredients]; arr.splice(idx, 1);
      setIngredients(arr.length ? arr : ['']);
    } else {
      const arr = [...steps]; arr.splice(idx, 1);
      setSteps(arr.length ? arr : ['']);
    }
  }
  function setRow(type, idx, v) {
    if (type === 'ing') {
      const arr = [...ingredients]; arr[idx] = v; setIngredients(arr);
    } else {
      const arr = [...steps]; arr[idx] = v; setSteps(arr);
    }
  }

  function validate() {
    if (!title.trim()) return 'Please enter a recipe name.';
    if (!description.trim()) return 'Please add a short description.';
    const cleanIng = ingredients.map(s => s.trim()).filter(Boolean);
    const cleanSteps = steps.map(s => s.trim()).filter(Boolean);
    if (!cleanIng.length) return 'Add at least one ingredient.';
    if (!cleanSteps.length) return 'Add at least one step.';
    return null;
  }

  async function onSubmit() {
    const err = validate();
    if (err) { Alert.alert('Missing info', err); return; }
    if (!auth?.currentUser?.uid) {
      Alert.alert('Login required', 'Please log in before submitting a recipe.');
      return;
    }

    try {
      setSubmitting(true);
      const ownerUid = auth.currentUser.uid;
      const recipesCol = collection(db, 'recipes');
      const id = doc(recipesCol).id;           // new id
      let imageStoragePath = '';
      let imageURL = '';

      if (image) {
        const blob = await (await fetch(image)).blob();
        const fileRef = ref(storage, `recipes/${ownerUid}/${id}/main.jpg`);
        await uploadBytes(fileRef, blob, { contentType: 'image/jpeg' });
        imageURL = await getDownloadURL(fileRef);
        imageStoragePath = fileRef.fullPath;
      }

      const payload = {
        ownerUid,
        title: title.trim(),
        description: description.trim(),
        ingredients: ingredients.map(s => s.trim()).filter(Boolean),
        steps: steps.map(s => s.trim()).filter(Boolean),
        tags: tags.split(',').map(s => s.trim()).filter(Boolean),
        cuisine: cuisine.trim(),
        difficulty,
        cook_time: Number(cookTime) || null,
        servings: Number(servings) || null,
        calories: Number(calories) || null,
        diet_type: diet,
        imageURL,
        imageStoragePath,
        status: 'pending',                       // moderation required
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'recipes', id), payload);
      Alert.alert('Submitted!', 'Your recipe was sent for approval.');
      router.back();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Could not submit recipe. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Stack.Screen
        options={{
          title: 'Submit Recipe',
          headerShown: true,
          headerStyle: { backgroundColor: c.bg },
          headerTintColor: c.text
        }}
      />

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Image */}
        <View style={styles.heroWrap}>
          <Image source={image ? { uri: image } : PLACEHOLDER} style={styles.hero} />
          <View style={styles.heroBtns}>
            <Chip text="Pick a photo" onPress={pickImage} color={c.accent} />
          </View>
        </View>

        {/* Form */}
        <FormSection title="Basic info" c={c}>
          <LabeledInput label="Name" placeholder="e.g., Hainanese Chicken Rice"
            value={title} onChangeText={setTitle} c={c} />
          <LabeledInput label="Description" placeholder="Short description"
            value={description} onChangeText={setDescription} c={c} multiline />
          <LabeledInput label="Cuisine" placeholder="e.g., Singaporean"
            value={cuisine} onChangeText={setCuisine} c={c} />
          <LabeledInput label="Tags" placeholder="Comma-separated (e.g., spicy, seafood)"
            value={tags} onChangeText={setTags} c={c} />
        </FormSection>

        <FormSection title="Ingredients" c={c}>
          {ingredients.map((v, i) => (
            <Row key={`ing-${i}`}>
              <TextInput
                placeholder={`Ingredient ${i + 1}`}
                placeholderTextColor={c.muted}
                value={v}
                onChangeText={(t) => setRow('ing', i, t)}
                style={[styles.input, { backgroundColor: c.surface, color: c.text, borderColor: c.border }]}
              />
              <IconBtn label="−" onPress={() => removeRow('ing', i)} c={c} />
            </Row>
          ))}
          <Chip text="Add ingredient" onPress={() => addRow('ing')} color={c.accent} />
        </FormSection>

        <FormSection title="Steps" c={c}>
          {steps.map((v, i) => (
            <Row key={`step-${i}`}>
              <TextInput
                placeholder={`Step ${i + 1}`}
                placeholderTextColor={c.muted}
                value={v}
                onChangeText={(t) => setRow('step', i, t)}
                style={[styles.input, { backgroundColor: c.surface, color: c.text, borderColor: c.border }]}
                multiline
              />
              <IconBtn label="−" onPress={() => removeRow('step', i)} c={c} />
            </Row>
          ))}
          <Chip text="Add step" onPress={() => addRow('step')} color={c.accent} />
        </FormSection>

        <FormSection title="Details" c={c}>
          <Label c={c}>Difficulty</Label>
          <ChipRow>
            {['Easy','Medium','Hard'].map(opt => (
              <SelectChip key={opt} text={opt} active={difficulty===opt} onPress={()=>setDifficulty(opt)} c={c} />
            ))}
          </ChipRow>

          <Label c={c} style={{ marginTop: 12 }}>Diet Type</Label>
          <ChipRow>
            {['Halal','Non-Halal'].map(opt => (
              <SelectChip key={opt} text={opt} active={diet===opt} onPress={()=>setDiet(opt)} c={c} />
            ))}
          </ChipRow>

          <Row>
            <NumInput label="Cook time (min)" value={cookTime} onChangeText={setCookTime} c={c} />
            <View style={{ width: 10 }} />
            <NumInput label="Servings" value={servings} onChangeText={setServings} c={c} />
          </Row>
          <NumInput label="Calories" value={calories} onChangeText={setCalories} c={c} />
        </FormSection>

        <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
          <TouchableOpacity
            onPress={onSubmit}
            disabled={submitting}
            style={[styles.submitBtn, { backgroundColor: submitting ? c.disabled : c.accent }]}
          >
            <Text style={styles.submitText}>{submitting ? 'Submitting…' : 'Submit for approval'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

/* ========== UI Helpers ========== */

function FormSection({ title, c, children }) {
  return (
    <View style={{ marginHorizontal: 16, marginTop: 16 }}>
      <Text style={{ color: c.text, fontSize: 18, fontWeight: '700', marginBottom: 10 }}>{title}</Text>
      <View style={{ gap: 10 }}>{children}</View>
    </View>
  );
}
function Label({ c, style, children }) {
  return <Text style={[{ color: c.muted, fontSize: 13, marginBottom: 6 }, style]}>{children}</Text>;
}
function LabeledInput({ label, c, style, ...props }) {
  return (
    <View>
      <Label c={c}>{label}</Label>
      <TextInput
        {...props}
        style={[
          styles.input,
          { backgroundColor: c.surface, color: c.text, borderColor: c.border },
          style
        ]}
      />
    </View>
  );
}
function NumInput({ label, value, onChangeText, c }) {
  return (
    <View style={{ flex: 1 }}>
      <Label c={c}>{label}</Label>
      <TextInput
        keyboardType="numeric"
        value={value}
        onChangeText={onChangeText}
        placeholder="0"
        placeholderTextColor={c.muted}
        style={[styles.input, { backgroundColor: c.surface, color: c.text, borderColor: c.border }]}
      />
    </View>
  );
}
function Chip({ text, onPress, color }) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.chip, { backgroundColor: color }]}>
      <Text style={{ color: '#fff', fontWeight: '700' }}>{text}</Text>
    </TouchableOpacity>
  );
}
function SelectChip({ text, active, onPress, c }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.selectChip,
        { backgroundColor: active ? c.accent : c.surface, borderColor: active ? c.accent : c.border }
      ]}
    >
      <Text style={{ color: active ? '#fff' : c.text, fontWeight: '700' }}>{text}</Text>
    </TouchableOpacity>
  );
}
function ChipRow({ children }) {
  return <View style={{ flexDirection: 'row', gap: 8 }}>{children}</View>;
}
function Row({ children }) {
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>{children}</View>;
}

const styles = StyleSheet.create({
  heroWrap: { position: 'relative', marginBottom: 8 },
  hero: { width: '100%', height: 190, backgroundColor: '#222' },
  heroBtns: { position: 'absolute', bottom: 12, right: 12 },

  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  chip: { alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999 },
  selectChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, borderWidth: 1 },

  submitBtn: {
    borderRadius: 14, paddingVertical: 14, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }
  },
  submitText: { color: '#fff', fontWeight: '800', fontSize: 16 }
});

function IconBtn({ label = '−', onPress, c }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: c.surface,
        borderColor: c.border,
        borderWidth: 1,
        borderRadius: 8,
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: c.text, fontSize: 20, fontWeight: '700', lineHeight: 20 }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function colors(scheme) {
  const dark = scheme === 'dark';
  return {
    bg: dark ? '#0B0B0D' : '#F7F7F8',
    surface: dark ? '#141418' : '#FFFFFF',
    text: dark ? '#F5F6F8' : '#121319',
    muted: dark ? 'rgba(234,236,240,0.68)' : 'rgba(21,23,28,0.68)',
    border: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    accent: '#1DB954',
    disabled: dark ? '#2a2a2d' : '#cfd2d7',
  };
}
