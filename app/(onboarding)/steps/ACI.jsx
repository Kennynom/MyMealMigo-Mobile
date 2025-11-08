// app/(onboarding)/steps/ACI.jsx
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ACIStep({ value, onNext, onBack }) {
  const [allergies, setAllergies]   = useState(value?.allergies || []);
  const [conditions, setConditions] = useState(value?.conditions || []);
  const [injuries, setInjuries]     = useState(value?.injuries || []);

  const toggle = (arr, setArr, item) =>
    setArr((prev) => (prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]));

  const canNext = true;

  return (
    <View style={s.wrap}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={s.title}>Health info</Text>
        <Text style={s.sub}>Select anything that applies. You can edit later.</Text>

        {/* Allergies */}
        <Text style={s.section}>Allergies</Text>
        <View style={s.chips}>
          {['peanuts','shellfish','milk','eggs','soy','wheat','tree nuts','fish','sesame','other'].map((opt) => {
            const active = allergies.includes(opt);
            return (
              <TouchableOpacity
                key={opt}
                onPress={() => toggle(allergies, setAllergies, opt)}
                style={[s.chip, active ? s.chipSel : s.chipIdle]}
              >
                <Text style={[s.chipTxt, active && s.chipTxtSel]}>{opt}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Conditions */}
        <Text style={s.section}>Conditions</Text>
        <View style={s.chips}>
          {['asthma','diabetes','hypertension','thyroid','anxiety','depression','eczema','other'].map((opt) => {
            const active = conditions.includes(opt);
            return (
              <TouchableOpacity
                key={opt}
                onPress={() => toggle(conditions, setConditions, opt)}
                style={[s.chip, active ? s.chipSel : s.chipIdle]}
              >
                <Text style={[s.chipTxt, active && s.chipTxtSel]}>{opt}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Injuries */}
        <Text style={s.section}>Injuries</Text>
        <View style={s.chips}>
          {['knee','shoulder','back','ankle','hip','other'].map((opt) => {
            const active = injuries.includes(opt);
            return (
              <TouchableOpacity
                key={opt}
                onPress={() => toggle(injuries, setInjuries, opt)}
                style={[s.chip, active ? s.chipSel : s.chipIdle]}
              >
                <Text style={[s.chipTxt, active && s.chipTxtSel]}>{opt}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Footer buttons */}
      <View style={s.footer}>
        <TouchableOpacity style={s.btnGhost} onPress={onBack}>
          <Text style={s.btnGhostTxt}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.btn, !canNext && s.btnDis]}
          onPress={() => onNext({ allergies, conditions, injuries })}
          disabled={!canNext}
        >
          <Text style={s.btnTxt}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 120 }, // extra bottom padding for footer
  title: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  sub: { color: '#64748b', marginTop: 4, marginBottom: 8 },
  section: { marginTop: 16, marginBottom: 6, fontWeight: '700', color: '#0f172a' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1 },
  chipIdle: { backgroundColor: '#fff', borderColor: '#e2e8f0' },
  chipSel: { backgroundColor: '#05966915', borderColor: '#059669' },
  chipTxt: { color: '#0f172a', fontWeight: '600' },
  chipTxtSel: { color: '#065f46' },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  btn: {
    flex: 1,
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnTxt: { color: '#fff', fontWeight: '700' },
  btnGhost: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnGhostTxt: { color: '#0f172a', fontWeight: '700' },
  btnDis: { opacity: 0.5 },
});
