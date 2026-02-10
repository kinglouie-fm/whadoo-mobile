import { theme } from "@/src/theme/theme";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

type Status = "active" | "cancelled" | "completed";

interface StatusBadgeProps {
  status: Status;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = getStatusConfig(status);

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.text, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

function getStatusConfig(status: Status) {
  switch (status) {
    case "active":
      return {
        label: "Active",
        bg: "rgba(205, 255, 73, 0.15)",
        color: theme.colors.accent,
      };
    case "cancelled":
      return {
        label: "Cancelled",
        bg: "rgba(255, 77, 77, 0.15)",
        color: theme.colors.danger,
      };
    case "completed":
      return {
        label: "Completed",
        bg: "rgba(16, 185, 129, 0.15)",
        color: "#10B981",
      };
  }
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
  },
});
