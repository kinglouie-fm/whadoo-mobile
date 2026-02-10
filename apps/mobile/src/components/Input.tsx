import { theme } from "@/src/theme/theme";
import { typography } from "@/src/theme/typography";
import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from "react-native";

interface FormInputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

interface TextAreaProps extends FormInputProps {
  numberOfLines?: number;
}

export function FormInput({
  label,
  error,
  containerStyle,
  style,
  ...props
}: FormInputProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, error && styles.inputError, style]}
        placeholderTextColor={theme.colors.muted}
        {...props}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

export function TextArea({
  label,
  error,
  containerStyle,
  style,
  numberOfLines = 4,
  ...props
}: TextAreaProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          styles.textArea,
          error && styles.inputError,
          style,
        ]}
        placeholderTextColor={theme.colors.muted}
        multiline
        numberOfLines={numberOfLines}
        textAlignVertical="top"
        {...props}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    ...typography.label,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.divider,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    ...typography.body,
    marginBottom: 0,
  },
  textArea: {
    minHeight: 100,
  },
  inputError: {
    borderColor: theme.colors.danger,
  },
  errorText: {
    ...typography.captionSmall,
    color: theme.colors.danger,
    marginTop: 4,
  },
});
