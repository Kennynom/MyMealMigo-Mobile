// components/SummaryModal.jsx
import { Colors } from "@/constants/theme";
import { useJournal } from "@/context/JournalContext";
import React from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

export default function SummaryModal({ visible, onClose }) {
  const { stats } = useJournal();

  function Row({ label, value }) {
    return (
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <Text
          style={{
            fontWeight: "600",
            color: Colors.light.text,
          }}
        >
          {label}
        </Text>
        <Text
          style={{
            fontWeight: "800",
            color: Colors.light.text,
          }}
        >
          {value ?? "—"}
        </Text>
      </View>
    );
  }

  // Convert numeric mood average to emoji + word
  function moodLabel(num) {
    if (num == null) return "—";
    const val = Math.round(num);
    switch (val) {
      case 5:
        return "😁 Very Happy";
      case 4:
        return "🙂 Happy";
      case 3:
        return "😐 Neutral";
      case 2:
        return "😕 Low";
      case 1:
        return "😭 Sad";
      default:
        return "—";
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <View
          style={{
            backgroundColor: "#fff",
            width: "90%",
            borderRadius: 20,
            padding: 20,
            maxHeight: "80%",
          }}
        >
          <Text
            style={{
              fontSize: 20,
              fontWeight: "bold",
              marginBottom: 10,
              textAlign: "center",
            }}
          >
            Summary
          </Text>

          <ScrollView>
            {/* --- WELLNESS --- */}
            <Text
              style={{
                fontSize: 16,
                fontWeight: "700",
                marginTop: 10,
                marginBottom: 8,
              }}
            >
              Wellness
            </Text>

            <Row label="Avg Mood" value={moodLabel(stats.avgMood)} />
            <Row label="Avg Sleep (hrs)" value={stats.avgSleep?.toFixed(1)} />
            <Row label="Avg Stress (1-5)" value={stats.avgStress?.toFixed(1)} />
            <Row
              label="Avg Hydration (1-5)"
              value={stats.avgHydration?.toFixed(1)}
            />

            {/* --- CALORIES --- */}
            <Text
              style={{
                fontSize: 16,
                fontWeight: "700",
                marginTop: 20,
                marginBottom: 8,
              }}
            >
              Diet & Calories
            </Text>

            <Row label="Avg Daily Calories" value="~1850 kcal" />
            <Row label="Weekly Average" value="~12,950 kcal" />
            <Row label="Calories Remaining Today" value="220 kcal" />

            {/* --- ACTIVITY --- */}
            <Text
              style={{
                fontSize: 16,
                fontWeight: "700",
                marginTop: 20,
                marginBottom: 8,
              }}
            >
              Activity
            </Text>

            <Row label="Streak days" value={stats.streak} />
          </ScrollView>

          <Pressable
            onPress={onClose}
            style={{
              marginTop: 20,
              backgroundColor: Colors.light.primary,
              paddingVertical: 14,
              borderRadius: 30,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontWeight: "700",
                fontSize: 16,
              }}
            >
              Close
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
