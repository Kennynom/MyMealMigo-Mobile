import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function SexBirthStep({ value, onNext, onBack }) {
  // read from flat keys first, fallback to legacy shapes if present
  const initialSex = useMemo(() => {
    return (
      value?.sexAtBirth ??
      value?.demographics?.sexAtBirth ??
      value?.sex ?? // legacy
      ''
    );
  }, [value]);

  const initialBirth = useMemo(() => {
    return (
      value?.birthDate ??
      value?.demographics?.birthDate ??
      ''
    );
  }, [value]);

  const [sex, setSex] = useState(initialSex);
  const [birthDate, setBirthDate] = useState(initialBirth);

  const isValidDate = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d || '');
  const canNext = !!sex && isValidDate(birthDate);

  return (
    <View style={s.card}>
      <Text style={s.title}>Tell us about you</Text>
      <Text style={s.sub}>Sex and birthday help personalize targets.</Text>

      <Text style={s.label}>Sex at birth</Text>
      <View style={s.chips}>
        {['male', 'female', 'intersex', 'prefer_not_to_say'].map((opt) => (
          <TouchableOpacity
            key={opt}
            onPress={() => setSex(opt)}
            style={[s.chip, sex === opt ? s.chipSel : s.chipIdle]}
          >
            <Text style={[s.chipTxt, sex === opt && s.chipTxtSel]}>
              {opt.replace(/_/g, ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[s.label, { marginTop: 12 }]}>Birthday (YYYY-MM-DD)</Text>
      <TextInput
        placeholder="2002-05-21"
        value={birthDate}
        onChangeText={setBirthDate}
        style={s.input}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {!isValidDate(birthDate) && birthDate?.length > 0 ? (
        <Text style={s.hint}>Use format YYYY-MM-DD, e.g., 2002-05-21</Text>
      ) : null}

      <View style={s.footer}>
        <TouchableOpacity style={s.btnGhost} onPress={onBack}>
          <Text style={s.btnGhostTxt}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          disabled={!canNext}
          style={[s.btn, !canNext && s.btnDis]}
          onPress={() => onNext({ sexAtBirth: sex, birthDate })}
        >
          <Text style={s.btnTxt}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 12 },
  title: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  sub: { color: '#64748b' },
  label: { color: '#64748b', fontWeight: '600' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1 },
  chipIdle: { backgroundColor: '#fff', borderColor: '#e2e8f0' },
  chipSel: { backgroundColor: '#05966915', borderColor: '#059669' },
  chipTxt: { color: '#0f172a', fontWeight: '600' },
  chipTxtSel: { color: '#065f46' },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, backgroundColor: '#fff' },
  hint: { marginTop: 4, color: '#ef4444', fontSize: 12 },
  footer: { flexDirection: 'row', gap: 12, marginTop: 12 },
  btn: { flex: 1, backgroundColor: '#059669', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  btnTxt: { color: '#fff', fontWeight: '700' },
  btnGhost: { flex: 1, borderWidth: 1, borderColor: '#cbd5e1', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  btnGhostTxt: { color: '#0f172a', fontWeight: '700' },
  btnDis: { opacity: 0.5 },
});
