import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function MedicationsStep({ value, onNext, onBack }) {
  const [meds, setMeds] = useState(
    typeof value?.medications === 'string'
      ? value.medications
      : Array.isArray(value?.medications)
        ? value.medications.join(', ')
        : ''
  );

  return (
    <View style={s.card}>
      <Text style={s.title}>Medications</Text>
      <Text style={s.sub}>List anything you take regularly (optional).</Text>

      <TextInput
        placeholder="e.g., Metformin 500mg daily; Vitamin D weekly"
        value={meds}
        onChangeText={setMeds}
        style={[s.input, { minHeight: 100, textAlignVertical: 'top' }]}
        multiline
      />

      <View style={s.footer}>
        <TouchableOpacity style={s.btnGhost} onPress={onBack}><Text style={s.btnGhostTxt}>Back</Text></TouchableOpacity>
        <TouchableOpacity style={s.btn} onPress={() => onNext({ medications: meds.trim() })}>
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
  input:{borderWidth:1,borderColor:'#e2e8f0',borderRadius:12,padding:12,backgroundColor:'#fff'},
  footer:{flexDirection:'row',gap:12,marginTop:12},
  btn:{flex:1,backgroundColor:'#059669',paddingVertical:14,borderRadius:12,alignItems:'center'},
  btnTxt:{color:'#fff',fontWeight:'700'},
  btnGhost:{flex:1,borderWidth:1,borderColor:'#cbd5e1',paddingVertical:14,borderRadius:12,alignItems:'center'},
  btnGhostTxt:{color:'#0f172a',fontWeight:'700'},
});
