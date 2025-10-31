import React, { useState } from 'react';
import { View, Text, TextInput, Button, ScrollView, Alert, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { auth, db, storage } from '@/lib/firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { router } from 'expo-router';

export default function NewRecipe() {
  const uid = auth.currentUser?.uid;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ingredients, setIngredients] = useState(['']);
  const [steps, setSteps] = useState(['']);
  const [imageUri, setImageUri] = useState(null);
  const [saving, setSaving] = useState(false);

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission required', 'Please allow photo access.'); return; }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.85
    });
    if (!res.canceled) setImageUri(res.assets[0].uri);
  }

  async function submit() {
    if (!uid) { Alert.alert('Please log in first.'); return; }
    if (!title.trim()) { Alert.alert('Title is required'); return; }

    setSaving(true);
    try {
      const recipeRef = doc(collection(db, 'recipes'));

      let imageStoragePath = '';
      let imageURL = '';
      if (imageUri) {
        imageStoragePath = `recipes/${uid}/${recipeRef.id}/main.jpg`;
        const blob = await (await fetch(imageUri)).blob();
        await uploadBytes(ref(storage, imageStoragePath), blob, { contentType: 'image/jpeg' });
        imageURL = await getDownloadURL(ref(storage, imageStoragePath));
      }

      await setDoc(recipeRef, {
        ownerUid: uid,
        title: title.trim(),
        description: description.trim(),
        ingredients: ingredients.map(s => s.trim()).filter(Boolean).map(n => ({ name: n })),
        steps: steps.map(s => s.trim()).filter(Boolean),
        imageURL,
        imageStoragePath,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      Alert.alert('Submitted!', 'Sent to nutritionists for approval.');
      router.back();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', e?.message ?? 'Failed to submit recipe');
    } finally {
      setSaving(false);
    }
  }

  const onChangeList = (list, setList, idx, val) => {
    const copy = [...list]; copy[idx] = val; setList(copy);
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: '700' }}>Submit a Recipe</Text>

      <Text>Title</Text>
      <TextInput value={title} onChangeText={setTitle} placeholder="e.g., Chicken Salad"
                 style={{ borderWidth: 1, borderRadius: 8, padding: 10 }} />

      <Text>Description</Text>
      <TextInput value={description} onChangeText={setDescription} multiline
                 placeholder="Short description"
                 style={{ borderWidth: 1, borderRadius: 8, padding: 10, minHeight: 80 }} />

      <Text>Ingredients</Text>
      {ingredients.map((it, i) => (
        <TextInput key={i} value={it}
          onChangeText={(v)=>onChangeList(ingredients,setIngredients,i,v)}
          placeholder={`Ingredient ${i+1}`}
          style={{ borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 8 }} />
      ))}
      <Button title="Add ingredient" onPress={()=>setIngredients([...ingredients, ''])} />

      <Text>Steps</Text>
      {steps.map((it, i) => (
        <TextInput key={i} value={it}
          onChangeText={(v)=>onChangeList(steps,setSteps,i,v)}
          placeholder={`Step ${i+1}`}
          style={{ borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 8 }} />
      ))}
      <Button title="Add step" onPress={()=>setSteps([...steps, ''])} />

      <View style={{ height: 8 }} />
      <Button title={imageUri ? "Change photo" : "Pick a photo"} onPress={pickImage} />
      {imageUri && <Image source={{ uri: imageUri }} style={{ width: '100%', height: 200, borderRadius: 8, marginTop: 8 }} />}

      <View style={{ height: 12 }} />
      <Button title={saving ? "Submitting..." : "Submit for approval"} onPress={submit} disabled={saving} />
    </ScrollView>
  );
}
