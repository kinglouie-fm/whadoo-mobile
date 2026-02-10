import { TopBar } from "@/src/components/TopBar";
import { theme } from "@/src/theme/theme";
import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AnalyticsScreen() {
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <TopBar title="Analytics" />

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <MaterialIcons
            name="bar-chart"
            size={80}
            color={theme.colors.muted}
          />
        </View>

        <Text style={styles.title}>Analytics Coming Soon</Text>
        <Text style={styles.subtitle}>
          Track your activity views, swipes, bookings, and conversion rates.
        </Text>

        <View style={styles.featureList}>
          <FeatureItem icon="visibility" text="Activity impressions" />
          <FeatureItem icon="favorite" text="Saves and interactions" />
          <FeatureItem icon="trending-up" text="Booking conversion rates" />
          <FeatureItem icon="calendar-month" text="Peak booking times" />
        </View>
      </View>
    </SafeAreaView>
  );
}

function FeatureItem({
  icon,
  text,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  text: string;
}) {
  return (
    <View style={styles.featureItem}>
      <MaterialIcons name={icon} size={20} color={theme.colors.accent} />
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: theme.colors.text,
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: theme.colors.muted,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  featureList: {
    width: "100%",
    gap: 16,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 12,
  },
  featureText: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.text,
  },
});
