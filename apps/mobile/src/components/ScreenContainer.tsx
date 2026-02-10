import React, { ReactNode } from "react";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import { theme } from "@/src/theme/theme";
import { typography } from "@/src/theme/typography";
import { ui } from "@/src/theme/ui";

interface ScreenContainerProps {
  children: ReactNode;
  loading?: boolean;
  error?: string;
}

export function ScreenContainer({ children, loading, error }: ScreenContainerProps) {
  if (loading) {
    return (
      <View style={ui.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={ui.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return <View style={ui.container}>{children}</View>;
}

const styles = StyleSheet.create({
  errorText: {
    ...typography.body,
    color: theme.colors.muted,
    textAlign: "center",
  },
});
