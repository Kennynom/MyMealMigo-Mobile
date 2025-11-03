// app/(tabs)/(logs)/view-log.jsx
import ReflectionRow from "@/components/ReflectionRow";
import SummaryModal from "@/components/SummaryModal";
import { useJournal } from "@/context/JournalContext";
import { ThemeContext } from "@/context/ThemeContext";
import { router, useLocalSearchParams } from "expo-router";
import React, {
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ViewMealLogScreen() {
  const { theme } =
    useContext(ThemeContext);
  const styles = createStyles(theme);

  const { tab: initialTabParam } = useLocalSearchParams();
  const [tab, setTab] = useState("Meal log"); // "Meal log" | "Reflection"
  const [showSummary, setShowSummary] = useState(false);

  const { entries, deleteEntry } = useJournal();

  // open Reflection tab automatically if navigated with ?tab=reflections
  useEffect(() => {
    if (initialTabParam === "reflections") {
      setTab("Reflection");
    }
  }, [initialTabParam]);

  // newest first
  const sortedReflections = useMemo(() => {
    return [...entries].sort((a, b) => {
      if (a.dateISO < b.dateISO) return 1;
      if (a.dateISO > b.dateISO) return -1;
      return 0;
    });
  }, [entries]);

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  function handleAddReflection() {
    router.push("/(journal)/Editor");
  }

  function handleEditReflection(id) {
    router.push({
      pathname: "/(journal)/Editor",
      params: { id },
    });
  }

  function handleDeleteReflection(id) {
    deleteEntry(id);
  }

  const isMealTab = tab === "Meal log";
  const isReflectionTab = tab === "Reflection";

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.mainHeader}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            {isMealTab
              ? "View Meal Log"
              : "Your Reflections"}
          </Text>

          <TouchableOpacity style={styles.profileButton}>
            <Text style={styles.profileIcon}>👤</Text>
          </TouchableOpacity>
        </View>

        {/* TAB SWITCH */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabBase,
              isMealTab && styles.activeTab,
              !isMealTab && styles.inactiveTab,
            ]}
            onPress={() => setTab("Meal log")}
          >
            <Text
              style={[
                styles.tabTextBase,
                isMealTab
                  ? styles.activeTabText
                  : styles.inactiveTabText,
              ]}
            >
              Meal log
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabBase,
              isReflectionTab && styles.activeTab,
              !isReflectionTab && styles.inactiveTab,
            ]}
            onPress={() => setTab("Reflection")}
          >
            <Text
              style={[
                styles.tabTextBase,
                isReflectionTab
                  ? styles.activeTabText
                  : styles.inactiveTabText,
              ]}
            >
              Reflection
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* DATE */}
      <View style={styles.dateContainer}>
        <Text style={styles.dateText}>{currentDate}</Text>
      </View>

      {/* BODY */}
      <ScrollView
        style={styles.scrollArea}
        showsVerticalScrollIndicator={false}
      >
        {/* -------- MEAL TAB -------- */}
        {isMealTab && (
          <>
            {["Breakfast", "Lunch", "Dinner"].map(
              (meal, idx) => (
                <View key={idx} style={styles.mealCard}>
                  <View style={styles.mealHeader}>
                    <Text style={styles.mealTitle}>
                      {meal}
                    </Text>
                    <TouchableOpacity
                      style={styles.editButton}
                    >
                      <Text style={styles.editIcon}>✏️</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.chartPlaceholder}>
                    <Text style={styles.chartText}>
                      📊 Nutrition Chart
                    </Text>
                    <Text
                      style={{
                        color: theme.textSecondary,
                        fontSize: 12,
                        marginTop: 4,
                        textAlign: "center",
                      }}
                    >
                      future: calories & macros
                    </Text>
                  </View>
                </View>
              )
            )}

            <View style={styles.bottomSpacing} />
          </>
        )}

        {/* -------- REFLECTION TAB -------- */}
        {isReflectionTab && (
          <>
            {/* LIST OF REFLECTIONS */}
            {sortedReflections.length === 0 ? (
              <View
                style={styles.emptyReflectionCard}
              >
                <Text
                  style={styles.emptyReflectionText}
                >
                  You haven't added any reflections
                  yet.
                </Text>
              </View>
            ) : (
              sortedReflections.map((entry) => (
                <ReflectionRow
                  key={entry.id}
                  entry={entry}
                  onEdit={() =>
                    handleEditReflection(entry.id)
                  }
                  onDelete={() =>
                    handleDeleteReflection(entry.id)
                  }
                />
              ))
            )}

            {/* TREND / GRAPH PLACEHOLDER */}
            <View style={styles.trendCard}>
              <Text style={styles.trendTitle}>
                Wellness Trends
              </Text>
              <View style={styles.trendBody}>
                <Text style={styles.trendEmoji}>
                  📈
                </Text>
                <Text style={styles.trendNote}>
                  This is where your mood / sleep /
                  stress / hydration over time will
                  be plotted from Smart Dashboard.
                </Text>
              </View>
            </View>

            <View style={styles.bottomSpacing} />
          </>
        )}
      </ScrollView>

      {/* ADD BUTTON (bottom CTA) */}
      <View style={styles.addButtonContainer}>
        {isMealTab ? (
          <TouchableOpacity style={styles.addButton}>
            <Text style={styles.addButtonText}>
              Add Meal
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddReflection}
          >
            <Text style={styles.addButtonText}>
              Add Reflection
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* SUMMARY BUTTON */}
      <Pressable
        onPress={() => setShowSummary(true)}
        style={[
          styles.summaryFab,
          {
            backgroundColor: theme.primary,
            shadowColor: theme.shadow,
          },
        ]}
      >
        <Text style={styles.summaryFabText}>
          Summary
        </Text>
      </Pressable>

      <SummaryModal
        visible={showSummary}
        onClose={() => setShowSummary(false)}
      />
    </View>
  );
}

const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },

    mainHeader: {
      backgroundColor: theme.surface,
      paddingHorizontal: 20,
      paddingTop: 60,
      paddingBottom: 15,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerContent: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
    },
    backButton: { padding: 5 },
    backIcon: {
      fontSize: 24,
      color: theme.text,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: theme.text,
      flex: 1,
      textAlign: "center",
      marginHorizontal: 20,
    },
    profileButton: {
      width: 32,
      height: 32,
      backgroundColor: theme.primary,
      borderRadius: 16,
      justifyContent: "center",
      alignItems: "center",
    },
    profileIcon: {
      color: "#fff",
      fontSize: 14,
    },

    tabContainer: {
      flexDirection: "row",
      backgroundColor: theme.inactive,
      borderRadius: 25,
      padding: 4,
    },
    tabBase: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 20,
      alignItems: "center",
    },
    activeTab: {
      backgroundColor: theme.primary,
    },
    inactiveTab: {
      backgroundColor: "transparent",
    },
    tabTextBase: {
      fontSize: 14,
      fontWeight: "600",
    },
    activeTabText: {
      color: "#fff",
    },
    inactiveTabText: {
      color: theme.textSecondary,
    },

    dateContainer: {
      padding: 20,
    },
    dateText: {
      fontSize: 16,
      color: theme.text,
      fontWeight: "500",
    },

    scrollArea: {
      flex: 1,
      paddingHorizontal: 20,
    },

    mealCard: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: 20,
      marginBottom: 15,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
    },
    mealHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 15,
    },
    mealTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: theme.text,
    },
    editButton: {
      padding: 5,
    },
    editIcon: {
      fontSize: 16,
      color: theme.textSecondary,
    },
    chartPlaceholder: {
      backgroundColor: theme.inactive,
      minHeight: 80,
      borderRadius: 8,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 10,
    },
    chartText: {
      color: theme.text,
      fontSize: 14,
      fontWeight: "600",
    },

    emptyReflectionCard: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 16,
      marginBottom: 16,
      alignItems: "center",
    },
    emptyReflectionText: {
      color: theme.textSecondary,
      fontSize: 14,
      textAlign: "center",
    },

    trendCard: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 16,
      marginBottom: 16,
    },
    trendTitle: {
      color: theme.text,
      fontWeight: "700",
      fontSize: 16,
      marginBottom: 8,
    },
    trendBody: {
      flexDirection: "row",
      gap: 12,
      alignItems: "flex-start",
    },
    trendEmoji: {
      fontSize: 24,
    },
    trendNote: {
      color: theme.textSecondary,
      fontSize: 13,
      lineHeight: 18,
      flex: 1,
    },

    bottomSpacing: {
      height: 80,
    },

    addButtonContainer: {
      paddingHorizontal: 20,
      paddingBottom: 40,
      backgroundColor: theme.background,
    },
    addButton: {
      backgroundColor: theme.primary,
      borderRadius: 12,
      paddingVertical: 15,
      alignItems: "center",
    },
    addButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "bold",
    },

    summaryFab: {
      position: "absolute",
      right: 20,
      bottom: 110,
      borderRadius: 999,
      paddingVertical: 10,
      paddingHorizontal: 16,
      elevation: 5,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
    },
    summaryFabText: {
      color: "#fff",
      fontWeight: "700",
      fontSize: 14,
    },
  });
