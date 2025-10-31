// components/ReflectionRow.jsx
import { ThemeContext } from "@/context/ThemeContext";
import { Feather } from "@expo/vector-icons";
import dayjs from "dayjs";
import React, { useContext } from "react";
import { Pressable, Text, View } from "react-native";

export default function ReflectionRow({ entry, onEdit, onDelete }) {
  const { theme } = useContext(ThemeContext);

  const dateLabel = dayjs(entry.dateISO).format("MMM D, YYYY");
  const snippet = entry.text || "";

  return (
    <View
      style={{
        backgroundColor: theme.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.border,
        padding: 14,
        marginBottom: 12,
      }}
    >
      <Text
        style={{
          fontWeight: "700",
          fontSize: 16,
          color: theme.text,
          marginBottom: 6,
        }}
      >
        {dateLabel}
      </Text>

      <Text style={{ color: theme.textSecondary }} numberOfLines={2}>
        {snippet}
      </Text>

      <View
        style={{
          flexDirection: "row",
          gap: 16,
          justifyContent: "flex-end",
          marginTop: 10,
        }}
      >
        <Pressable onPress={onEdit}>
          <Feather name="edit-2" size={18} color={theme.textSecondary} />
        </Pressable>
        <Pressable onPress={onDelete}>
          <Feather name="trash-2" size={18} color={theme.textSecondary} />
        </Pressable>
      </View>
    </View>
  );
}
