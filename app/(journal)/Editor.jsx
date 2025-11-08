// app/(journal)/Editor.jsx
import { Colors } from "@/constants/theme";
import { useJournal } from "@/context/JournalContext";
import dayjs from "dayjs";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
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
      <View
        style={{
          backgroundColor: Colors.light.card,
          borderRadius: 14,
          padding: 12,
          borderWidth: 1,
          borderColor: Colors.light.border,
        }}
      >
        <Text
          style={{
            fontWeight: "600",
            marginBottom: 6,
          }}
        >
          Mood
        </Text>
        <Text
          style={{
            fontSize: 12,
            color: "#666",
            marginBottom: 10,
          }}
        >
          How do you feel today?
        </Text>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          {MOOD_OPTIONS.map((opt) => {
            const active = String(opt.value) === mood;
            return (
              <Pressable
                key={opt.value}
                onPress={() =>
                  setMood(String(opt.value))
                }
                style={{
                  flex: 1,
                  backgroundColor: active
                    ? Colors.light.primary
                    : Colors.light.background,
                  borderWidth: 1,
                  borderColor: active
                    ? Colors.light.primary
                    : Colors.light.border,
                  borderRadius: 12,
                  paddingVertical: 14,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 20,
                    color: active ? "#fff" : "#000",
                  }}
                >
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
    <View
      style={{
        backgroundColor: Colors.light.card,
        borderRadius: 14,
        padding: 12,
        borderWidth: 1,
        borderColor: Colors.light.border,
      }}
    >
      <Text
        style={{ fontWeight: "600", marginBottom: 6 }}
      >
        {label}
      </Text>
      {description ? (
        <Text
          style={{
            fontSize: 12,
            color: "#666",
            marginBottom: 10,
          }}
        >
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
        style={{
          borderWidth: 1,
          borderColor: Colors.light.border,
          borderRadius: 10,
          padding: 10,
        }}
      />
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={100}
    >
      <ScrollView
        style={{
          flex: 1,
          backgroundColor: Colors.light.background,
        }}
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ padding: 16 }}>
        <Text
          style={{
            fontSize: 18,
            fontWeight: "700",
            marginBottom: 8,
          }}
        >
          Journal for {dayjs(date).format("MMM D, YYYY")}
        </Text>

        <View
          style={{
            flexDirection: "column",
            gap: 12,
          }}
        >
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
          <View
            style={{
              backgroundColor: Colors.light.card,
              borderRadius: 14,
              padding: 12,
              borderWidth: 1,
              borderColor: Colors.light.border,
            }}
          >
            <Text
              style={{
                fontWeight: "600",
                marginBottom: 6,
              }}
            >
              Water Intake
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: "#666",
                marginBottom: 10,
              }}
            >
              How much did you drink today?
              {"\n"}(Fill either Liters OR Cups)
            </Text>

            <View
              style={{
                flexDirection: "row",
                gap: 12,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 12,
                    color: "#666",
                    marginBottom: 4,
                  }}
                >
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
                  style={{
                    borderWidth: 1,
                    borderColor:
                      Colors.light.border,
                    borderRadius: 10,
                    padding: 10,
                  }}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 12,
                    color: "#666",
                    marginBottom: 4,
                  }}
                >
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
                  style={{
                    borderWidth: 1,
                    borderColor:
                      Colors.light.border,
                    borderRadius: 10,
                    padding: 10,
                  }}
                />
              </View>
            </View>
          </View>

          {/* Reflection */}
          <View
            style={{
              backgroundColor: Colors.light.card,
              borderRadius: 14,
              padding: 12,
              borderWidth: 1,
              borderColor: Colors.light.border,
            }}
          >
            <Text
              style={{
                fontWeight: "600",
                marginBottom: 6,
              }}
            >
              Reflection
            </Text>
            <TextInput
              multiline
              value={text}
              onChangeText={setText}
              placeholder="How did your day go? Anything affecting mood/eating/sleep?"
              style={{
                minHeight: 140,
                textAlignVertical: "top",
              }}
            />
          </View>

          {/* Tags */}
          <View
            style={{
              backgroundColor: Colors.light.card,
              borderRadius: 14,
              padding: 12,
              borderWidth: 1,
              borderColor: Colors.light.border,
            }}
          >
            <Text
              style={{
                fontWeight: "600",
                marginBottom: 6,
              }}
            >
              Tags (comma separated)
            </Text>
            <TextInput
              value={tags}
              onChangeText={setTags}
              placeholder="gym, study, slept late"
            />
          </View>
        </View>

        {/* Save button */}
        <Pressable
          onPress={onSave}
          style={{
            backgroundColor: Colors.light.primary,
            paddingVertical: 18,
            borderRadius: 32,
            alignItems: "center",
            marginTop: 24,
          }}
        >
          <Text
            style={{
              color: "#fff",
              fontWeight: "bold",
              fontSize: 18,
            }}
          >
            {editing ? "Save Changes" : "Add Reflection"}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}
