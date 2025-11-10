// app/(tabs)/(discover)/(recipes)/new.jsx
import { useTheme } from '@/context/ThemeContext';
import { auth, db, storage } from '@/lib/firebase';
import * as ImagePicker from 'expo-image-picker';
import { router, Stack } from 'expo-router';
import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import React, { useState } from 'react';
import {
  Alert,
  Image, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity,
  View
} from 'react-native';

const PLACEHOLDER = require('@/assets/images/placeholder-recipe.png');

export default function NewRecipe() {
  const { theme } = useTheme();

  const styles = createStyles(theme);

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
          <Text style={styles.headerTitle}>Submit Recipe</Text>
          <Text style={styles.headerSubtitle}>Share your creation</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Image */}
        <View style={styles.heroWrap}>
          <Image source={image ? { uri: image } : PLACEHOLDER} style={styles.hero} />
          <View style={styles.heroBtns}>
            <Chip text="Pick a photo" onPress={pickImage} theme={theme} />
          </View>
        </View>

        {/* Form */}
        <FormSection title="Basic info" theme={theme}>
          <LabeledInput label="Name" placeholder="e.g., Hainanese Chicken Rice"
            value={title} onChangeText={setTitle} theme={theme} />
          <LabeledInput label="Description" placeholder="Short description"
            value={description} onChangeText={setDescription} theme={theme} multiline />
          <LabeledInput label="Cuisine" placeholder="e.g., Singaporean"
            value={cuisine} onChangeText={setCuisine} theme={theme} />
          <LabeledInput label="Tags" placeholder="Comma-separated (e.g., spicy, seafood)"
            value={tags} onChangeText={setTags} theme={theme} />
        </FormSection>

        <FormSection title="Ingredients" theme={theme}>
          {ingredients.map((v, i) => (
            <Row key={`ing-${i}`}>
              <TextInput
                placeholder={`Ingredient ${i + 1}`}
                placeholderTextColor={theme.textSecondary}
                value={v}
                onChangeText={(t) => setRow('ing', i, t)}
                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
              />
              <IconBtn label="−" onPress={() => removeRow('ing', i)} theme={theme} />
            </Row>
          ))}
          <Chip text="Add ingredient" onPress={() => addRow('ing')} theme={theme} />
        </FormSection>

        <FormSection title="Steps" theme={theme}>
          {steps.map((v, i) => (
            <Row key={`step-${i}`}>
              <TextInput
                placeholder={`Step ${i + 1}`}
                placeholderTextColor={theme.textSecondary}
                value={v}
                onChangeText={(t) => setRow('step', i, t)}
                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                multiline
              />
              <IconBtn label="−" onPress={() => removeRow('step', i)} theme={theme} />
            </Row>
          ))}
          <Chip text="Add step" onPress={() => addRow('step')} theme={theme} />
        </FormSection>

        <FormSection title="Details" theme={theme}>
          <Label theme={theme}>Difficulty</Label>
          <ChipRow>
            {['Easy','Medium','Hard'].map(opt => (
              <SelectChip key={opt} text={opt} active={difficulty===opt} onPress={()=>setDifficulty(opt)} theme={theme} />
            ))}
          </ChipRow>

          <Label theme={theme} style={{ marginTop: 12 }}>Diet Type</Label>
          <ChipRow>
            {['Halal','Non-Halal'].map(opt => (
              <SelectChip key={opt} text={opt} active={diet===opt} onPress={()=>setDiet(opt)} theme={theme} />
            ))}
          </ChipRow>

          <Row>
            <NumInput label="Cook time (min)" value={cookTime} onChangeText={setCookTime} theme={theme} />
            <View style={{ width: 10 }} />
            <NumInput label="Servings" value={servings} onChangeText={setServings} theme={theme} />
          </Row>
          <NumInput label="Calories" value={calories} onChangeText={setCalories} theme={theme} />
        </FormSection>

        <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
          <TouchableOpacity
            onPress={onSubmit}
            disabled={submitting}
            style={[styles.submitBtn, { backgroundColor: submitting ? theme.border : theme.primary }]}
          >
            <Text style={styles.submitText}>{submitting ? 'Submitting…' : 'Submit for approval'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

/* ========== UI Helpers ========== */

function FormSection({ title, theme, children }) {
  return (
    <View style={{ marginHorizontal: 16, marginTop: 16 }}>
      <Text style={{ color: theme.text, fontSize: 18, fontWeight: '700', marginBottom: 10 }}>{title}</Text>
      <View style={{ gap: 10 }}>{children}</View>
    </View>
  );
}
function Label({ theme, style, children }) {
  return <Text style={[{ color: theme.textSecondary, fontSize: 13, marginBottom: 6 }, style]}>{children}</Text>;
}
function LabeledInput({ label, theme, style, ...props }) {
  return (
    <View>
      <Label theme={theme}>{label}</Label>
      <TextInput
        {...props}
        style={[
          { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
          { backgroundColor: theme.background, color: theme.text, borderColor: theme.border },
          style
        ]}
      />
    </View>
  );
}
function NumInput({ label, value, onChangeText, theme }) {
  return (
    <View style={{ flex: 1 }}>
      <Label theme={theme}>{label}</Label>
      <TextInput
        keyboardType="numeric"
        value={value}
        onChangeText={onChangeText}
        placeholder="0"
        placeholderTextColor={theme.textSecondary}
        style={[
          { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
          { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }
        ]}
      />
    </View>
  );
}
function Chip({ text, onPress, theme }) {
  return (
    <TouchableOpacity 
      onPress={onPress} 
      style={[
        { alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999 },
        { backgroundColor: theme.primary }
      ]}
    >
      <Text style={{ color: '#fff', fontWeight: '700' }}>{text}</Text>
    </TouchableOpacity>
  );
}
function SelectChip({ text, active, onPress, theme }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, borderWidth: 1 },
        { backgroundColor: active ? theme.primary : theme.surface, borderColor: active ? theme.primary : theme.border }
      ]}
    >
      <Text style={{ color: active ? '#fff' : theme.text, fontWeight: '700' }}>{text}</Text>
    </TouchableOpacity>
  );
}
function ChipRow({ children }) {
  return <View style={{ flexDirection: 'row', gap: 8 }}>{children}</View>;
}
function Row({ children }) {
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>{children}</View>;
}

const createStyles = (theme) => StyleSheet.create({
  // Header styles
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
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  backText: {
    fontSize: 24,
    color: theme.text,
    fontWeight: 'bold',
  },
  headerCenter: { flex: 1, alignItems: 'center', paddingHorizontal: 12 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: theme.text },
  headerSubtitle: { fontSize: 13, marginTop: 2, color: theme.textSecondary },
  placeholder: { width: 40 },

  // Form styles
  heroWrap: { position: 'relative', marginBottom: 8 },
  hero: { width: '100%', height: 190, backgroundColor: '#222' },
  heroBtns: { position: 'absolute', bottom: 12, right: 12 },

  submitBtn: {
    borderRadius: 14, paddingVertical: 14, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }
  },
  submitText: { color: '#fff', fontWeight: '800', fontSize: 16 }
});

function IconBtn({ label = '−', onPress, theme }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: theme.surface,
        borderColor: theme.border,
        borderWidth: 1,
        borderRadius: 8,
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: theme.text, fontSize: 20, fontWeight: '700', lineHeight: 20 }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}
