import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ParqStep({ value, onNext, onBack }) {
  const [red, setRed] = useState(!!value?.parq?.hasRedFlags);
  const [notes, setNotes] = useState(value?.parq?.notes ?? '');

  return (
    <View style={s.card}>
      <Text style={s.title}>Health check</Text>
      <Text style={s.sub}>Any dizziness, chest pain, heart issues, or other concerns?</Text>

      <Text style={s.label}>Any red flags?</Text>
      <View style={s.chips}>
        {[
          {k:true, label:'Yes'},
          {k:false,label:'No'},
        ].map(opt => (
          <TouchableOpacity
            key={opt.label}
            onPress={() => setRed(opt.k)}
            style={[s.chip, red === opt.k ? s.chipSel : s.chipIdle]}
          >
            <Text style={[s.chipTxt, red === opt.k && s.chipTxtSel]}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[s.label,{marginTop:12}]}>Notes (optional)</Text>
      <TextInput
        placeholder="Describe anything your coach should know"
        value={notes}
        onChangeText={setNotes}
        style={[s.input,{minHeight:100,textAlignVertical:'top'}]}
        multiline
      />

      <View style={s.footer}>
        <TouchableOpacity style={s.btnGhost} onPress={onBack}><Text style={s.btnGhostTxt}>Back</Text></TouchableOpacity>
        <TouchableOpacity
          style={s.btn}
          onPress={() => onNext({ parq: { hasRedFlags: !!red, notes: notes?.trim() || '' } })}
        >
          <Text style={s.btnTxt}>Finish</Text>
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
  chips:{flexDirection:'row',flexWrap:'wrap',gap:8,marginTop:4},
  chip:{paddingVertical:10,paddingHorizontal:14,borderRadius:999,borderWidth:1},
  chipIdle:{backgroundColor:'#fff',borderColor:'#e2e8f0'},
  chipSel:{backgroundColor:'#05966915',borderColor:'#059669'},
  chipTxt:{color:'#0f172a',fontWeight:'600'},
  chipTxtSel:{color:'#065f46'},
  input:{borderWidth:1,borderColor:'#e2e8f0',borderRadius:12,padding:12,backgroundColor:'#fff'},
  footer:{flexDirection:'row',gap:12,marginTop:12},
  btn:{flex:1,backgroundColor:'#059669',paddingVertical:14,borderRadius:12,alignItems:'center'},
  btnTxt:{color:'#fff',fontWeight:'700'},
  btnGhost:{flex:1,borderWidth:1,borderColor:'#cbd5e1',paddingVertical:14,borderRadius:12,alignItems:'center'},
  btnGhostTxt:{color:'#0f172a',fontWeight:'700'},
});
