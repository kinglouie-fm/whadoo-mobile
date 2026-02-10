import React, { ReactNode } from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { theme } from "@/src/theme/theme";
import { typography } from "@/src/theme/typography";

interface EmptyStateProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <MaterialIcons name={icon} size={64} color={theme.colors.muted} />
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {action && <View style={styles.action}>{action}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.xl,
  },
  title: {
    ...typography.h3,
    color: theme.colors.text,
    marginTop: theme.spacing.lg,
    textAlign: "center",
  },
  subtitle: {
    ...typography.body,
    color: theme.colors.muted,
    marginTop: theme.spacing.sm,
    textAlign: "center",
  },
  action: {
    marginTop: theme.spacing.xl,
  },
});
