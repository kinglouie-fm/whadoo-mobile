import { ConfigSchemaRenderer } from "@/src/components/ConfigSchemaRenderer";
import { PackagesEditor } from "@/src/components/PackagesEditor";
import { PricingSchemaRenderer } from "@/src/components/PricingSchemaRenderer";
import { useBusiness } from "@/src/providers/business-context";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import {
    clearCurrentActivity,
    createActivity,
    CreateActivityData,
    fetchActivity,
    updateActivity,
    UpdateActivityData,
} from "@/src/store/slices/activity-slice";
import { fetchTypeDefinition, fetchTypeDefinitions } from "@/src/store/slices/activity-type-slice";
import { fetchTemplates } from "@/src/store/slices/availability-template-slice";
import { theme } from "@/src/theme/theme";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ActivityDetailScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id?: string }>();
    const dispatch = useAppDispatch();
    const { business } = useBusiness();
    const { currentActivity, loading } = useAppSelector((state) => state.activities);
    const { templates } = useAppSelector((state) => state.availabilityTemplates);
    const { typeDefinitions, currentTypeDefinition } = useAppSelector((state) => state.activityTypes);

    const isEditMode = !!id;

    // Form state
    const [title, setTitle] = useState("");
    const [typeId, setTypeId] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [city, setCity] = useState("");
    const [address, setAddress] = useState("");
    const [priceFrom, setPriceFrom] = useState("");
    const [availabilityTemplateId, setAvailabilityTemplateId] = useState("");
    const [catalogGroupId, setCatalogGroupId] = useState("");
    const [catalogGroupTitle, setCatalogGroupTitle] = useState("");
    const [catalogGroupKind, setCatalogGroupKind] = useState("");

    // Dynamic config and pricing
    const [config, setConfig] = useState<Record<string, any>>({});
    const [pricing, setPricing] = useState<Record<string, any>>({});

    const [errors, setErrors] = useState<Record<string, string>>({});

    // Load type definitions
    useEffect(() => {
        dispatch(fetchTypeDefinitions());
    }, []);

    // Load activity if editing
    useEffect(() => {
        if (isEditMode && id) {
            dispatch(fetchActivity(id));
        }
        return () => {
            dispatch(clearCurrentActivity());
        };
    }, [id, isEditMode]);

    // Load templates for picker
    useEffect(() => {
        if (business?.id) {
            dispatch(fetchTemplates(business.id));
        }
    }, [business?.id]);

    // Populate form when activity loads
    useEffect(() => {
        if (currentActivity && isEditMode) {
            setTitle(currentActivity.title);
            setTypeId(currentActivity.typeId);
            setDescription(currentActivity.description || "");
            setCategory(currentActivity.category || "");
            setCity(currentActivity.city || "");
            setAddress(currentActivity.address || "");
            setPriceFrom(currentActivity.priceFrom?.toString() || "");
            setAvailabilityTemplateId(currentActivity.availabilityTemplateId || "");
            setCatalogGroupId(currentActivity.catalogGroupId || "");
            setCatalogGroupTitle(currentActivity.catalogGroupTitle || "");
            setCatalogGroupKind(currentActivity.catalogGroupKind || "");
            setConfig(currentActivity.config || {});
            setPricing(currentActivity.pricing || {});

            // Fetch type definition for this activity
            if (currentActivity.typeId) {
                dispatch(fetchTypeDefinition(currentActivity.typeId));
            }
        }
    }, [currentActivity, isEditMode]);

    // Fetch type definition when type changes
    useEffect(() => {
        if (typeId && !isEditMode) {
            dispatch(fetchTypeDefinition(typeId));
            // Reset config and pricing when type changes
            const newConfig: Record<string, any> = {};

            // Auto-create first package for karting
            if (typeId === "karting") {
                newConfig.packages = [
                    {
                        code: "standard",
                        title: "Standard Session",
                        track_type: "indoor",
                        is_default: true,
                        sort_order: 0,
                    },
                ];
            }

            setConfig(newConfig);
            setPricing({});
        }
    }, [typeId, isEditMode]);

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!title.trim()) {
            newErrors.title = "Title is required";
        }

        if (!typeId.trim()) {
            newErrors.typeId = "Type is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validateForm()) {
            Alert.alert("Validation Error", "Please fix the errors before saving");
            return;
        }

        if (!business?.id) {
            Alert.alert("Error", "Business not found");
            return;
        }

        try {
            if (isEditMode && id) {
                const updateData: UpdateActivityData = {
                    title,
                    typeId,
                    description: description || undefined,
                    category: category || undefined,
                    city: city || undefined,
                    address: address || undefined,
                    priceFrom: priceFrom ? parseFloat(priceFrom) : undefined,
                    config,
                    pricing,
                    availabilityTemplateId: availabilityTemplateId || undefined,
                    catalogGroupId: catalogGroupId || undefined,
                    catalogGroupTitle: catalogGroupTitle || undefined,
                    catalogGroupKind: catalogGroupKind || undefined,
                };
                await dispatch(updateActivity({ activityId: id, data: updateData })).unwrap();
                Alert.alert("Success", "Activity updated successfully");
            } else {
                const createData: CreateActivityData = {
                    businessId: business.id,
                    title,
                    typeId,
                    description: description || undefined,
                    category: category || undefined,
                    city: city || undefined,
                    address: address || undefined,
                    priceFrom: priceFrom ? parseFloat(priceFrom) : undefined,
                    config,
                    pricing,
                    availabilityTemplateId: availabilityTemplateId || undefined,
                    catalogGroupId: catalogGroupId || undefined,
                    catalogGroupTitle: catalogGroupTitle || undefined,
                    catalogGroupKind: catalogGroupKind || undefined,
                };
                await dispatch(createActivity(createData)).unwrap();
                Alert.alert("Success", "Activity created successfully");
            }

            router.back();
        } catch (error: any) {
            console.error("Failed to save activity:", error);
            Alert.alert("Error", error.message || "Failed to save activity");
        }
    };

    if (loading && isEditMode) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.accent} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
            <ScrollView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Text style={styles.cancelButton}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>{isEditMode ? "Edit" : "Create"} Activity</Text>
                    <TouchableOpacity onPress={handleSave}>
                        <Text style={styles.saveButton}>Save</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.form}>
                    {/* Title */}
                    <View style={styles.field}>
                        <Text style={styles.label}>Title *</Text>
                        <TextInput
                            style={[styles.input, errors.title && styles.inputError]}
                            value={title}
                            onChangeText={setTitle}
                            placeholder="e.g., Go-Kart Racing"
                        />
                        {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
                    </View>

                    {/* Type Dropdown */}
                    <View style={styles.field}>
                        <Text style={styles.label}>Type *</Text>
                        <View style={styles.typeDropdown}>
                            {typeDefinitions.map((type) => (
                                <TouchableOpacity
                                    key={type.typeId}
                                    style={[
                                        styles.typeOption,
                                        typeId === type.typeId && styles.typeOptionSelected,
                                    ]}
                                    onPress={() => setTypeId(type.typeId)}
                                    disabled={isEditMode} // Don't allow changing type in edit mode
                                >
                                    <Text
                                        style={[
                                            styles.typeOptionText,
                                            typeId === type.typeId && styles.typeOptionTextSelected,
                                        ]}
                                    >
                                        {type.displayName}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        {errors.typeId && <Text style={styles.errorText}>{errors.typeId}</Text>}
                        {isEditMode && (
                            <Text style={styles.helperText}>Type cannot be changed after creation</Text>
                        )}
                    </View>

                    {/* Description */}
                    <View style={styles.field}>
                        <Text style={styles.label}>Description</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={description}
                            onChangeText={setDescription}
                            placeholder="Describe your activity..."
                            multiline
                            numberOfLines={4}
                        />
                    </View>

                    {/* City */}
                    <View style={styles.field}>
                        <Text style={styles.label}>City</Text>
                        <TextInput
                            style={styles.input}
                            value={city}
                            onChangeText={setCity}
                            placeholder="e.g., Amsterdam"
                        />
                    </View>

                    {/* Address */}
                    <View style={styles.field}>
                        <Text style={styles.label}>Address</Text>
                        <TextInput
                            style={styles.input}
                            value={address}
                            onChangeText={setAddress}
                            placeholder="Street address"
                        />
                    </View>

                    {/* Category */}
                    <View style={styles.field}>
                        <Text style={styles.label}>Category</Text>
                        <TextInput
                            style={styles.input}
                            value={category}
                            onChangeText={setCategory}
                            placeholder="e.g., Sports, Food, Entertainment"
                        />
                    </View>

                    {/* Price From */}
                    <View style={styles.field}>
                        <Text style={styles.label}>Price From ($)</Text>
                        <TextInput
                            style={styles.input}
                            value={priceFrom}
                            onChangeText={setPriceFrom}
                            placeholder="0.00"
                            keyboardType="decimal-pad"
                        />
                        <Text style={styles.helperText}>
                            {typeId === "karting" && config.packages?.length > 0
                                ? "Auto-calculated from packages"
                                : "Display price for discovery feed"}
                        </Text>
                    </View>

                    {/* Catalog Group Fields (for grouping multiple activities) */}
                    {typeId === "karting" && (
                        <>
                            <View style={styles.field}>
                                <Text style={styles.label}>Catalog Group ID</Text>
                                <TextInput
                                    style={styles.input}
                                    value={catalogGroupId}
                                    onChangeText={setCatalogGroupId}
                                    placeholder="e.g., acl-karting-mondercange"
                                />
                                <Text style={styles.helperText}>
                                    Group related activities (e.g., different durations)
                                </Text>
                            </View>

                            <View style={styles.field}>
                                <Text style={styles.label}>Catalog Group Title</Text>
                                <TextInput
                                    style={styles.input}
                                    value={catalogGroupTitle}
                                    onChangeText={setCatalogGroupTitle}
                                    placeholder="e.g., Karting at ActionFunCenter"
                                />
                            </View>

                            <View style={styles.field}>
                                <Text style={styles.label}>Catalog Group Kind</Text>
                                <TextInput
                                    style={styles.input}
                                    value={catalogGroupKind}
                                    onChangeText={setCatalogGroupKind}
                                    placeholder="karting"
                                />
                            </View>
                        </>
                    )}

                    {/* Dynamic Config Fields or Packages Editor */}
                    {currentTypeDefinition && (
                        <>
                            {typeId === "karting" ? (
                                <PackagesEditor
                                    packages={config.packages || []}
                                    onChange={(packages) => {
                                        setConfig({ ...config, packages });
                                        // Auto-calculate price_from
                                        const prices = packages
                                            .map((pkg) => pkg.base_price)
                                            .filter((p) => p !== undefined && p !== null);
                                        if (prices.length > 0) {
                                            setPriceFrom(Math.min(...prices).toString());
                                        }
                                    }}
                                />
                            ) : (
                                <ConfigSchemaRenderer
                                    typeDefinition={currentTypeDefinition}
                                    currentConfig={config}
                                    onConfigChange={setConfig}
                                    errors={errors}
                                />
                            )}

                            <PricingSchemaRenderer
                                typeDefinition={currentTypeDefinition}
                                currentPricing={pricing}
                                onPricingChange={setPricing}
                                errors={errors}
                            />
                        </>
                    )}

                    {/* Availability Template Picker */}
                    <View style={styles.field}>
                        <View style={styles.labelRow}>
                            <Text style={styles.label}>Availability Template</Text>
                            {!availabilityTemplateId && (
                                <View style={styles.requiredIndicator}>
                                    <Text style={styles.requiredText}>⚠️ Required to publish</Text>
                                </View>
                            )}
                        </View>
                        {templates.length > 0 ? (
                            <View style={styles.templatePicker}>
                                {templates
                                    .filter((t) => t.status === "active")
                                    .map((template) => (
                                        <TouchableOpacity
                                            key={template.id}
                                            style={[
                                                styles.templateOption,
                                                availabilityTemplateId === template.id &&
                                                styles.templateOptionSelected,
                                            ]}
                                            onPress={() => setAvailabilityTemplateId(template.id)}
                                            disabled={isEditMode && currentActivity?.status === "published"}
                                        >
                                            <Text
                                                style={[
                                                    styles.templateOptionText,
                                                    availabilityTemplateId === template.id &&
                                                    styles.templateOptionTextSelected,
                                                ]}
                                            >
                                                {template.name}
                                            </Text>
                                            <Text style={styles.templateDetails}>
                                                {template.daysOfWeek?.length || 0} days • {template.capacity} capacity
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                {availabilityTemplateId && currentActivity?.status !== "published" && (
                                    <TouchableOpacity
                                        style={styles.templateClearButton}
                                        onPress={() => setAvailabilityTemplateId("")}
                                    >
                                        <Text style={styles.templateClearText}>Clear Selection</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        ) : (
                            <View style={styles.warningBox}>
                                <Text style={styles.warningText}>
                                    ⚠️ No active templates found. Create one in the Availability tab first.
                                </Text>
                            </View>
                        )}
                        {isEditMode && currentActivity?.status === "published" && (
                            <View style={styles.infoBox}>
                                <Text style={styles.infoText}>
                                    ✓ Template is linked and cannot be changed while published
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.bg,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: theme.colors.bg,
    },

    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        backgroundColor: theme.colors.bg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.divider,
    },
    title: {
        fontSize: 16,
        fontWeight: "800",
        color: theme.colors.text,
    },
    cancelButton: {
        fontSize: 14,
        fontWeight: "700",
        color: theme.colors.muted,
    },
    saveButton: {
        fontSize: 14,
        fontWeight: "800",
        color: theme.colors.accent,
    },

    form: {
        padding: theme.spacing.lg,
    },
    field: {
        marginBottom: theme.spacing.lg,
    },

    label: {
        fontSize: 12,
        fontWeight: "800",
        color: theme.colors.muted,
        marginBottom: 8,
        textTransform: "uppercase",
        letterSpacing: 0.4,
    },
    helperText: {
        fontSize: 12,
        color: theme.colors.muted,
        marginTop: 6,
        fontWeight: "600",
    },

    input: {
        borderWidth: 1,
        borderColor: theme.colors.divider,
        borderRadius: theme.radius.lg,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 15,
        backgroundColor: theme.colors.surface,
        color: theme.colors.text,
    },
    textArea: {
        height: 110,
        textAlignVertical: "top",
    },
    inputError: {
        borderColor: theme.colors.danger,
    },
    errorText: {
        color: theme.colors.danger,
        fontSize: 12,
        marginTop: 6,
        fontWeight: "700",
    },

    typeDropdown: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    typeOption: {
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: theme.colors.divider,
        backgroundColor: theme.colors.surface,
    },
    typeOptionSelected: {
        backgroundColor: theme.colors.accent,
        borderColor: theme.colors.accent,
    },
    typeOptionText: {
        fontSize: 13,
        fontWeight: "800",
        color: theme.colors.text,
    },
    typeOptionTextSelected: {
        color: theme.colors.bg,
    },

    templatePicker: {
        marginTop: 8,
        gap: 10,
    },
    templateOption: {
        padding: theme.spacing.md,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.colors.divider,
        backgroundColor: theme.colors.card,
    },
    templateOptionSelected: {
        borderColor: theme.colors.accent,
        backgroundColor: theme.colors.surface,
    },
    templateOptionText: {
        fontSize: 14,
        fontWeight: "800",
        color: theme.colors.text,
    },
    templateOptionTextSelected: {
        color: theme.colors.text,
    },
    templateDetails: {
        fontSize: 12,
        color: theme.colors.muted,
        marginTop: 6,
        fontWeight: "600",
    },

    templateClearButton: {
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.divider,
        alignItems: "center",
        justifyContent: "center",
    },
    templateClearText: {
        fontSize: 13,
        fontWeight: "800",
        color: theme.colors.muted,
    },

    labelRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    requiredIndicator: {
        backgroundColor: "rgba(255,77,77,0.12)",
        borderWidth: 1,
        borderColor: "rgba(255,77,77,0.25)",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
    },
    requiredText: {
        fontSize: 12,
        color: theme.colors.danger,
        fontWeight: "800",
    },

    warningBox: {
        backgroundColor: "rgba(245,158,11,0.14)",
        borderWidth: 1,
        borderColor: "rgba(245,158,11,0.25)",
        padding: theme.spacing.md,
        borderRadius: theme.radius.lg,
        marginTop: 8,
    },
    warningText: {
        fontSize: 13,
        color: "#F59E0B",
        fontWeight: "700",
    },

    infoBox: {
        backgroundColor: "rgba(34,197,94,0.12)",
        borderWidth: 1,
        borderColor: "rgba(34,197,94,0.22)",
        padding: theme.spacing.md,
        borderRadius: theme.radius.lg,
        marginTop: 8,
    },
    infoText: {
        fontSize: 13,
        color: "#22C55E",
        fontWeight: "700",
    },
});