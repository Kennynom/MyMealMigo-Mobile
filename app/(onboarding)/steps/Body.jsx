import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function BodyStep({ value, onNext, onBack }) {
  const [height, setHeight] = useState(
    value?.heightCm?.toString?.() ?? value?.body?.heightCm?.toString?.() ?? ''
  );
  const [weight, setWeight] = useState(
    value?.weightKg?.toString?.() ?? value?.body?.weightKg?.toString?.() ?? ''
  );

  const valid = useMemo(() => {
    const h = Number(height), w = Number(weight);
    return h > 0 && h < 280 && w > 0 && w < 400;
  }, [height, weight]);

  return (
    <View style={s.card}>
      <Text style={s.title}>Body metrics</Text>
      <Text style={s.sub}>We’ll use these to estimate calories & macros.</Text>

      <Text style={s.label}>Height (cm)</Text>
      <TextInput
        placeholder="e.g., 165"
        keyboardType="numeric"
        value={height}
        onChangeText={setHeight}
        style={s.input}
      />

      <Text style={[s.label, {marginTop:12}]}>Weight (kg)</Text>
      <TextInput
        placeholder="e.g., 54"
        keyboardType="numeric"
        value={weight}
        onChangeText={setWeight}
        style={s.input}
      />

      <View style={s.footer}>
        <TouchableOpacity style={s.btnGhost} onPress={onBack}><Text style={s.btnGhostTxt}>Back</Text></TouchableOpacity>
        <TouchableOpacity
          disabled={!valid}
          style={[s.btn, !valid && s.btnDis]}
          onPress={() => onNext({ heightCm: Number(height), weightKg: Number(weight) })}
        >
          <Text style={s.btnTxt}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card:{backgroundColor:'#fff',borderRadius:16,padding:16,gap:12},
  title:{fontSize:18,fontWeight:'700',color:'#0f172a'},
  sub:{color:'#64748b'},
  label:{color:'#64748b',fontWeight:'600'},
  input:{borderWidth:1,borderColor:'#e2e8f0',borderRadius:12,padding:12,backgroundColor:'#fff'},
  footer:{flexDirection:'row',gap:12,marginTop:12},
  btn:{flex:1,backgroundColor:'#059669',paddingVertical:14,borderRadius:12,alignItems:'center'},
  btnTxt:{color:'#fff',fontWeight:'700'},
  btnGhost:{flex:1,borderWidth:1,borderColor:'#cbd5e1',paddingVertical:14,borderRadius:12,alignItems:'center'},
  btnGhostTxt:{color:'#0f172a',fontWeight:'700'},
  btnDis:{opacity:0.5},
});
