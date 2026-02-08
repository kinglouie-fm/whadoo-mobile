import React from "react";
import { StyleSheet, Text, View } from "react-native";
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

      <View style={styles.sectionCard}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 24 },

  sectionTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: "rgba(255,255,255,0.62)",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  sectionCard: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
});
