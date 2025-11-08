import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const ACTIVITY = [
  'Mostly sedentary',
  'Lightly active',
  'Moderately active',
  'Very active',
];

export default function ActivityStep({ value, onNext, onBack }) {
  const [lvl, setLvl] = useState(value?.fitness?.activityLevel || '');

  return (
    <View style={s.card}>
      <Text style={s.title}>How active are you most days?</Text>
      <Text style={s.sub}>Pick the closest match.</Text>

      <View style={s.chips}>
        {ACTIVITY.map((g) => (
          <TouchableOpacity
            key={g}
            onPress={() => setLvl(g)}
            style={[s.chip, lvl === g ? s.chipSel : s.chipIdle]}
          >
            <Text style={[s.chipTxt, lvl === g && s.chipTxtSel]}>{g}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={s.footer}>
        <TouchableOpacity style={s.btnGhost} onPress={onBack}><Text style={s.btnGhostTxt}>Back</Text></TouchableOpacity>
        <TouchableOpacity
          disabled={!lvl}
          style={[s.btn, !lvl && s.btnDis]}
          onPress={() => onNext({ fitness: { ...(value?.fitness || {}), activityLevel: lvl } })}
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
  chips:{flexDirection:'row',flexWrap:'wrap',gap:8,marginTop:4},
  chip:{paddingVertical:10,paddingHorizontal:14,borderRadius:999,borderWidth:1},
  chipIdle:{backgroundColor:'#fff',borderColor:'#e2e8f0'},
  chipSel:{backgroundColor:'#05966915',borderColor:'#059669'},
  chipTxt:{color:'#0f172a',fontWeight:'600'},
  chipTxtSel:{color:'#065f46'},
  footer:{flexDirection:'row',gap:12,marginTop:12},
  btn:{flex:1,backgroundColor:'#059669',paddingVertical:14,borderRadius:12,alignItems:'center'},
  btnTxt:{color:'#fff',fontWeight:'700'},
  btnGhost:{flex:1,borderWidth:1,borderColor:'#cbd5e1',paddingVertical:14,borderRadius:12,alignItems:'center'},
  btnGhostTxt:{color:'#0f172a',fontWeight:'700'},
  btnDis:{opacity:0.5},
});
