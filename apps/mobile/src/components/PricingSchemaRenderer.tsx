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
