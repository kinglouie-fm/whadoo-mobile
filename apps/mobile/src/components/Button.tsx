import { theme } from "@/src/theme/theme";
import { typography } from "@/src/theme/typography";
import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle
} from "react-native";

interface ButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

interface IconButtonProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  onPress: () => void;
  style?: ViewStyle;
  size?: number;
  color?: string;
}

export function PrimaryButton({
  title,
  onPress,
  disabled,
  loading,
  style,
}: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.primaryButton,
        (disabled || loading) && styles.disabledButton,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={theme.colors.buttonTextOnAccent} />
      ) : (
        <Text style={styles.primaryButtonText}>{title}</Text>
      )}
    </Pressable>
  );
}

export function SecondaryButton({
  title,
  onPress,
  disabled,
  style,
}: Omit<ButtonProps, "loading">) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.secondaryButton, disabled && styles.disabledButton, style]}
    >
      <Text style={styles.secondaryButtonText}>{title}</Text>
    </Pressable>
  );
}

export function DangerButton({
  title,
  onPress,
  disabled,
  style,
}: Omit<ButtonProps, "loading">) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.dangerButton, disabled && styles.disabledButton, style]}
    >
      <Text style={styles.dangerButtonText}>{title}</Text>
    </Pressable>
  );
}

export function IconButton({
  icon,
  onPress,
  style,
  size = 20,
  color,
}: IconButtonProps) {
  return (
    <Pressable onPress={onPress} style={[styles.iconButton, style]}>
      <MaterialIcons
        name={icon}
        size={size}
        color={color || theme.colors.text}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  primaryButton: {
    backgroundColor: theme.colors.accent,
    paddingVertical: 16,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    ...typography.body,
    color: theme.colors.buttonTextOnAccent,
  },
  secondaryButton: {
    backgroundColor: theme.colors.surface,
    paddingVertical: 16,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  secondaryButtonText: {
    ...typography.body,
    color: theme.colors.text,
  },
  dangerButton: {
    backgroundColor: theme.colors.danger,
    paddingVertical: 16,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  dangerButtonText: {
    ...typography.body,
    color: "#FFFFFF",
  },
  disabledButton: {
    opacity: 0.5,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
});
