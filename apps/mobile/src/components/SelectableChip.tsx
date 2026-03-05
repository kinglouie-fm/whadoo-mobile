import React from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import { theme } from "@/src/theme/theme";
import { typography } from "@/src/theme/typography";

interface SelectableChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
}

export function SelectableChip({ label, selected, onPress, disabled }: SelectableChipProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.chip,
        selected && styles.chipSelected,
        disabled && styles.chipDisabled,
      ]}
    >
      <Text style={[styles.text, selected && styles.textSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    backgroundColor: theme.colors.surface,
  },
  chipSelected: {
    borderColor: theme.colors.accent,
    backgroundColor: "rgba(205, 255, 73, 0.1)",
  },
  chipDisabled: {
    opacity: 0.5,
  },
  text: {
    ...typography.body,
    color: theme.colors.text,
  },
  textSelected: {
    color: theme.colors.accent,
  },
});
