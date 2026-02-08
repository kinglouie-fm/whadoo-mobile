import React from "react";
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

export function DynamicFormFieldRenderer({
  field,
  value,
  onChange,
  error,
}: DynamicFormFieldRendererProps) {
  const renderField = () => {
    switch (field.type) {
      case "text":
      case "textarea":
        return (
          <TextInput
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
            style={[styles.input, error && styles.inputError]}
            value={value?.toString() || ""}
            onChangeText={(text) => {
              const num = parseFloat(text);
              onChange(isNaN(num) ? text : num);
            }}
            placeholder={field.placeholder || field.label}
            keyboardType="numeric"
          />
        );

      case "select":
        return (
          <View style={styles.selectContainer}>
            {field.options?.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.selectOption,
                  value === option.value && styles.selectOptionSelected,
                ]}
                onPress={() => onChange(option.value)}
              >
                <Text
                  style={[
                    styles.selectOptionText,
                    value === option.value && styles.selectOptionTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case "checkbox":
        return (
          <View style={styles.checkboxContainer}>
            <Switch
              value={value === true}
              onValueChange={onChange}
              trackColor={{ false: "#ccc", true: "#007AFF" }}
              thumbColor="#fff"
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
          {field.required && <Text style={styles.required}> *</Text>}
        </Text>
        {field.help && <Text style={styles.help}>{field.help}</Text>}
      </View>
      {renderField()}
      {error && <Text style={styles.errorText}>{error}</Text>}
      {field.min !== undefined &&
        field.max !== undefined &&
        field.type === "number" && (
          <Text style={styles.hint}>
            Range: {field.min} - {field.max}
          </Text>
        )}
    </View>
  );
}

const styles = StyleSheet.create({
  fieldContainer: {
    marginBottom: 16,
  },
  labelRow: {
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  required: {
    color: "#FF3B30",
  },
  help: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  hint: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  inputError: {
    borderColor: "#FF3B30",
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 12,
    marginTop: 4,
  },
  selectContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  selectOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#fff",
  },
  selectOptionSelected: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  selectOptionText: {
    fontSize: 14,
    color: "#333",
  },
  selectOptionTextSelected: {
    color: "#fff",
    fontWeight: "600",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  unsupported: {
    color: "#FF3B30",
    fontSize: 14,
  },
});
