// app/(journal)/Editor.jsx
import { ThemeContext } from "@/context/ThemeContext";
import { useJournal } from "@/context/JournalContext";
import dayjs from "dayjs";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useContext, useMemo, useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const MOOD_OPTIONS = [
  { value: 5, label: "😁" }, // very good
  { value: 4, label: "🙂" },
  { value: 3, label: "😐" },
  { value: 2, label: "😕" },
  { value: 1, label: "😭" }, // very bad
];

export default function Editor() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme } = useContext(ThemeContext);
  const styles = useMemo(() => createStyles(theme), [theme]);

  const idParam = Array.isArray(params.id) ? params.id[0] : params.id;
  const dateParam =
    typeof params.dateISO === "string" ? params.dateISO : null;

  const { entries, addEntry, updateEntry } = useJournal();

  const editing = useMemo(
    () => entries.find((e) => e.id === idParam),
    [entries, idParam]
  );

  const [date] = useState(dateParam ?? dayjs().format("YYYY-MM-DD"));

  // ----- form state -----
  const [mood, setMood] = useState(
    editing?.mood ? String(editing.mood) : ""
  );

  const [sleepHours, setSleepHours] = useState(
    editing?.sleepHours ? String(editing.sleepHours) : ""
  );

  const [stress, setStress] = useState(
    editing?.stress ? String(editing.stress) : ""
  );

  // NEW hydration split
  const [hydrationLiters, setHydrationLiters] = useState(
    editing?.hydrationLiters
      ? String(editing.hydrationLiters)
      : ""
  );
  const [hydrationCups, setHydrationCups] = useState(
    editing?.hydrationCups
      ? String(editing.hydrationCups)
      : ""
  );

  const [tags, setTags] = useState(
    editing?.tags?.join(", ") ?? ""
  );
  const [text, setText] = useState(editing?.text ?? "");

  // ----- helpers -----
  const toFloat = (s) => {
    if (!s && s !== 0) return undefined;
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : undefined;
  };

  const toInt = (s) => {
    if (!s && s !== 0) return undefined;
    const n = parseInt(s, 10);
    return Number.isFinite(n) ? n : undefined;
  };

  async function onSave() {
    // parse to numbers
    const moodNum = toInt(mood);
    const sleepNum = toFloat(sleepHours);
    const stressNum = toInt(stress);
    const litersNum = toFloat(hydrationLiters);
    const cupsNum = toFloat(hydrationCups);

    // ---- validation ----
    // mood:
    if (!moodNum) {
      Alert.alert("Missing mood", "Please select your mood.");
      return;
    }

    // sleep hours:
    if (!sleepNum || sleepNum < 1 || sleepNum > 10) {
      Alert.alert(
        "Sleep?",
        "Please enter how many hours you slept (1–10)."
      );
      return;
    }

    // stress:
    if (!stressNum || stressNum < 1 || stressNum > 5) {
      Alert.alert(
        "Stress?",
        "Please enter stress level from 1 (low) to 5 (high)."
      );
      return;
    }

    // hydration: require at least one, liters OR cups
    const hasHydration =
      (typeof litersNum === "number" && !isNaN(litersNum)) ||
      (typeof cupsNum === "number" && !isNaN(cupsNum));

    if (!hasHydration) {
      Alert.alert(
        "Water?",
        "Add how much water you drank (liters or cups)."
      );
      return;
    }

    // reflection text:
    if (!text.trim()) {
      Alert.alert(
        "Reflection?",
        "Please write a short reflection."
      );
      return;
    }

    // ---- build payload WITHOUT undefined fields ----
    const payload = {
      dateISO: date,
      text: text.trim(),
      tags: tags
        ? tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
      mood: moodNum,
      sleepHours: sleepNum,
      stress: stressNum,
    };

    // only attach hydration values if they exist
    if (
      typeof litersNum === "number" &&
      !isNaN(litersNum)
    ) {
      payload.hydrationLiters = litersNum;
    }
    if (
      typeof cupsNum === "number" &&
      !isNaN(cupsNum)
    ) {
      payload.hydrationCups = cupsNum;
    }

    try {
      if (editing?.id) {
        await updateEntry(editing.id, payload);
      } else {
        await addEntry(payload);
      }
      router.back();
    } catch (err) {
      Alert.alert("Save failed", String(err));
    }
  }

  // mood picker component
  function MoodPicker() {
    return (
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Mood</Text>
        <Text style={styles.cardDescription}>
          How do you feel today?
        </Text>

        <View style={styles.moodRow}>
          {MOOD_OPTIONS.map((opt) => {
            const active = String(opt.value) === mood;
            return (
              <Pressable
                key={opt.value}
                onPress={() => setMood(String(opt.value))}
                style={[
                  styles.moodButton,
                  active && styles.moodButtonActive
                ]}
              >
                <Text style={styles.moodEmoji}>
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  // small numeric card
  const NumberCard = ({
    label,
    description,
    value,
    setValue,
    keyboardType = "numeric",
    placeholder,
  }) => (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>{label}</Text>
      {description ? (
        <Text style={styles.cardDescription}>
          {description}
        </Text>
      ) : null}
      <TextInput
        keyboardType={keyboardType}
        value={value}
        onChangeText={(t) =>
          setValue(t.replace(/[^0-9.]/g, ""))
        }
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        style={styles.input}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {editing ? "Edit Reflection" : "Add Reflection"}
          </Text>
          <Text style={styles.headerSubtitle}>
            {dayjs(date).format("MMM D, YYYY")}
          </Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={100}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formContainer}>
            {/* Mood */}
            <MoodPicker />

            {/* Sleep */}
            <NumberCard
              label="Sleep"
              description="How many hours did you sleep? (1–10)"
              value={sleepHours}
              setValue={setSleepHours}
              placeholder="e.g. 7.5"
            />

            {/* Stress */}
            <NumberCard
              label="Stress"
              description="How stressed did you feel? (1=low, 5=high)"
              value={stress}
              setValue={setStress}
              placeholder="1–5"
            />

            {/* Hydration */}
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Water Intake</Text>
              <Text style={styles.cardDescription}>
                How much did you drink today?{"\n"}
                (Fill either Liters OR Cups)
              </Text>

              <View style={styles.hydrationRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>
                    Liters (L)
                  </Text>
                  <TextInput
                    keyboardType="numeric"
                    value={hydrationLiters}
                    onChangeText={(t) =>
                      setHydrationLiters(
                        t.replace(/[^0-9.]/g, "")
                      )
                    }
                    placeholder="e.g. 2.0"
                    placeholderTextColor={theme.textSecondary}
                    style={styles.input}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>
                    Cups
                  </Text>
                  <TextInput
                    keyboardType="numeric"
                    value={hydrationCups}
                    onChangeText={(t) =>
                      setHydrationCups(
                        t.replace(/[^0-9.]/g, "")
                      )
                    }
                    placeholder="e.g. 8"
                    placeholderTextColor={theme.textSecondary}
                    style={styles.input}
                  />
                </View>
              </View>
            </View>

            {/* Reflection */}
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Reflection</Text>
              <TextInput
                multiline
                value={text}
                onChangeText={setText}
                placeholder="How did your day go? Anything affecting mood/eating/sleep?"
                placeholderTextColor={theme.textSecondary}
                style={styles.textArea}
              />
            </View>

            {/* Tags */}
            <View style={styles.card}>
              <Text style={styles.cardLabel}>
                Tags (comma separated)
              </Text>
              <TextInput
                value={tags}
                onChangeText={setTags}
                placeholder="gym, study, slept late"
                placeholderTextColor={theme.textSecondary}
                style={styles.input}
              />
            </View>

            {/* Save button */}
            <Pressable
              onPress={onSave}
              style={styles.saveButton}
            >
              <Text style={styles.saveButtonText}>
                {editing ? "Save Changes" : "Add Reflection"}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const createStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: theme.background,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  backText: {
    color: theme.text,
    fontSize: 20,
    fontWeight: '600',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: theme.textSecondary,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  formContainer: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: theme.surface,
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 12,
    color: theme.textSecondary,
    marginBottom: 12,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  moodButton: {
    flex: 1,
    backgroundColor: theme.background,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  moodButtonActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  moodEmoji: {
    fontSize: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: theme.text,
    backgroundColor: theme.background,
  },
  inputLabel: {
    fontSize: 12,
    color: theme.textSecondary,
    marginBottom: 6,
  },
  hydrationRow: {
    flexDirection: 'row',
    gap: 12,
  },
  textArea: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: theme.text,
    backgroundColor: theme.background,
    minHeight: 140,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: theme.primary,
    paddingVertical: 18,
    borderRadius: 32,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
});
