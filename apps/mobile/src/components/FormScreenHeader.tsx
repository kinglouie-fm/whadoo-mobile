import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { theme } from "@/src/theme/theme";
import { typography } from "@/src/theme/typography";

interface FormScreenHeaderProps {
  title: string;
  onCancel: () => void;
  onSave: () => void;
  canSave?: boolean;
}

export function FormScreenHeader({ title, onCancel, onSave, canSave = true }: FormScreenHeaderProps) {
  return (
    <View style={styles.header}>
      <Pressable onPress={onCancel}>
        <Text style={styles.cancelText}>Cancel</Text>
      </Pressable>
      <Text style={styles.title}>{title}</Text>
      <Pressable onPress={onSave} disabled={!canSave}>
        <Text style={[styles.saveText, !canSave && styles.saveTextDisabled]}>Save</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
    backgroundColor: theme.colors.bg,
  },
  title: {
    ...typography.h4,
    color: theme.colors.text,
  },
  cancelText: {
    ...typography.body,
    color: theme.colors.text,
  },
  saveText: {
    ...typography.body,
    color: theme.colors.accent,
  },
  saveTextDisabled: {
    opacity: 0.5,
  },
});
