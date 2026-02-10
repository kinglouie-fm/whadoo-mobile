import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { ActivityTypeDefinition } from "../store/slices/activity-type-slice";
import { DynamicFormFieldRenderer } from "./DynamicFormFieldRenderer";

interface PricingSchemaRendererProps {
  typeDefinition: ActivityTypeDefinition;
  currentPricing: Record<string, any>;
  onPricingChange: (pricing: Record<string, any>) => void;
  errors?: Record<string, string>;
}

export function PricingSchemaRenderer({
  typeDefinition,
  currentPricing,
  onPricingChange,
  errors = {},
}: PricingSchemaRendererProps) {
  const handleFieldChange = (fieldName: string, value: any) => {
    onPricingChange({
      ...currentPricing,
      [fieldName]: value,
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Pricing</Text>

      <View style={styles.sectionCard}>
        {typeDefinition.pricingSchema.fields.map((field) => (
          <DynamicFormFieldRenderer
            key={field.name}
            field={field}
            value={currentPricing[field.name]}
            onChange={(value) => handleFieldChange(field.name, value)}
            error={errors[`pricing.${field.name}`]}
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
