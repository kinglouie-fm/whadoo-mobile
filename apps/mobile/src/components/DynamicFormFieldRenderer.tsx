import { theme } from "@/src/theme/theme";
import React, { useMemo } from "react";
import {
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { FieldDefinition } from "../store/slices/activity-type-slice";

interface DynamicFormFieldRendererProps {
  field: FieldDefinition;
  value: any;
  onChange: (value: any) => void;
  error?: string;
}

const stylesVars = {
  cardBg: "rgba(255,255,255,0.08)",
  inputBg: "rgba(255,255,255,0.06)",
  border: "rgba(255,255,255,0.12)",
  label: "rgba(255,255,255,0.62)",
  subText: "rgba(255,255,255,0.78)",
};

export function DynamicFormFieldRenderer({
  field,
  value,
  onChange,
  error,
}: DynamicFormFieldRendererProps) {
  const inputProps = useMemo(
    () => ({
      underlineColorAndroid: "transparent" as const, // ✅ kills blue underline on Android
      selectionColor: theme.colors.accent,
      cursorColor: theme.colors.accent,
      placeholderTextColor: stylesVars.label,
      keyboardAppearance: "dark" as const,
    }),
    [],
  );

  const renderField = () => {
    switch (field.type) {
      case "text":
      case "textarea":
        return (
          <TextInput
            {...inputProps}
            style={[
              styles.input,
              field.type === "textarea" && styles.textArea,
              error && styles.inputError,
            ]}
            value={value?.toString() || ""}
            onChangeText={onChange}
            placeholder={field.placeholder || field.label}
            multiline={field.type === "textarea"}
            numberOfLines={field.type === "textarea" ? 4 : 1}
          />
        );

      case "number":
        return (
          <TextInput
            {...inputProps}
            style={[styles.input, error && styles.inputError]}
            value={value?.toString() || ""}
            onChangeText={(text) => {
              // allow empty while typing
              if (text.trim() === "") return onChange("");
              const num = Number(text);
              onChange(Number.isFinite(num) ? num : text);
            }}
            placeholder={field.placeholder || field.label}
            keyboardType="numeric"
          />
        );

      case "select":
        return (
          <View style={styles.selectContainer}>
            {field.options?.map((option) => {
              const selected = value === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.selectOption,
                    selected && styles.selectOptionSelected,
                  ]}
                  onPress={() => onChange(option.value)}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.selectOptionText,
                      selected && styles.selectOptionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        );

      case "checkbox":
        return (
          <View style={styles.checkboxContainer}>
            <Switch
              value={value === true}
              onValueChange={onChange}
              trackColor={{
                false: "rgba(255,255,255,0.18)",
                true: theme.colors.accent,
              }}
              thumbColor={"#fff"}
            />
          </View>
        );

      default:
        return (
          <Text style={styles.unsupported}>
            Unsupported field type: {field.type}
          </Text>
        );
    }
  };

  return (
    <View style={styles.fieldContainer}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>
          {field.label}
          {field.required ? <Text style={styles.required}> *</Text> : null}
        </Text>

        {field.help ? <Text style={styles.help}>{field.help}</Text> : null}
      </View>

      {renderField()}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {field.type === "number" &&
      field.min !== undefined &&
      field.max !== undefined ? (
        <Text style={styles.hint}>
          Range: {field.min} - {field.max}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fieldContainer: {
    marginBottom: 14,
  },

  labelRow: {
    marginBottom: 8,
  },

  // match the "admin dark UI" label style you used elsewhere
  label: {
    fontSize: 12,
    fontWeight: "900",
    color: stylesVars.label,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },

  required: {
    color: theme.colors.danger,
    fontWeight: "900",
  },

  help: {
    marginTop: 6,
    fontSize: 12,
    color: stylesVars.subText,
    fontWeight: "700",
    lineHeight: 16,
  },

  hint: {
    fontSize: 12,
    color: stylesVars.label,
    marginTop: 6,
    fontWeight: "700",
  },

  input: {
    borderWidth: 1,
    borderColor: stylesVars.border,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: stylesVars.inputBg,
    color: theme.colors.text,
  },

  textArea: {
    minHeight: 110,
    textAlignVertical: "top",
  },

  inputError: {
    borderColor: theme.colors.danger,
  },

  errorText: {
    color: theme.colors.danger,
    fontSize: 12,
    marginTop: 6,
    fontWeight: "800",
  },

  selectContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  selectOption: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: stylesVars.border,
    backgroundColor: stylesVars.inputBg,
  },

  selectOptionSelected: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },

  selectOptionText: {
    fontSize: 13,
    fontWeight: "900",
    color: theme.colors.text,
  },

  // ✅ readable on accent
  selectOptionTextSelected: {
    color: "#0B0B0B",
  },

  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 2,
  },

  unsupported: {
    color: theme.colors.danger,
    fontSize: 13,
    fontWeight: "800",
  },
});
