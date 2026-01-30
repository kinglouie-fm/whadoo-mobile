import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { ActivityTypeDefinition } from "../store/slices/activity-type-slice";
import { DynamicFormFieldRenderer } from "./DynamicFormFieldRenderer";

interface ConfigSchemaRendererProps {
  typeDefinition: ActivityTypeDefinition;
  currentConfig: Record<string, any>;
  onConfigChange: (config: Record<string, any>) => void;
  errors?: Record<string, string>;
}

export function ConfigSchemaRenderer({
  typeDefinition,
  currentConfig,
  onConfigChange,
  errors = {},
}: ConfigSchemaRendererProps) {
  const handleFieldChange = (fieldName: string, value: any) => {
    onConfigChange({
      ...currentConfig,
      [fieldName]: value,
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Activity Details</Text>
      {typeDefinition.configSchema.fields.map((field) => (
        <DynamicFormFieldRenderer
          key={field.name}
          field={field}
          value={currentConfig[field.name]}
          onChange={(value) => handleFieldChange(field.name, value)}
          error={errors[`config.${field.name}`]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 16,
  },
});
