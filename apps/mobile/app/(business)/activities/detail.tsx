import { useBusiness } from "@/src/lib/use-business";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import {
    clearCurrentActivity,
    createActivity,
    CreateActivityData,
    fetchActivity,
    updateActivity,
    UpdateActivityData,
} from "@/src/store/slices/activity-slice";
import { fetchTemplates } from "@/src/store/slices/availability-template-slice";
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

    // Simple config fields
    const [duration, setDuration] = useState("");
    const [maxParticipants, setMaxParticipants] = useState("");

    const [errors, setErrors] = useState<Record<string, string>>({});

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

            // Extract simple config fields
            setDuration(currentActivity.config?.duration?.toString() || "");
            setMaxParticipants(currentActivity.config?.maxParticipants?.toString() || "");
        }
    }, [currentActivity, isEditMode]);

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
            Alert.alert("Validation Error", "Please fix the errors in the form");
            return;
        }

        try {
            const config = {
                ...(duration ? { duration: parseInt(duration) } : {}),
                ...(maxParticipants ? { maxParticipants: parseInt(maxParticipants) } : {}),
            };

            if (isEditMode && id) {
                const data: UpdateActivityData = {
                    title,
                    typeId,
                    description: description || undefined,
                    category: category || undefined,
                    city: city || undefined,
                    address: address || undefined,
                    priceFrom: priceFrom ? parseFloat(priceFrom) : undefined,
                    availabilityTemplateId: availabilityTemplateId || undefined,
                    config,
                };
                await dispatch(updateActivity({ activityId: id, data })).unwrap();
                Alert.alert("Success", "Activity updated successfully");
            } else {
                if (!business?.id) {
                    Alert.alert("Error", "Business ID not found. Please try again.");
                    return;
                }
                const data: CreateActivityData = {
                    businessId: business.id,
                    title,
                    typeId,
                    description: description || undefined,
                    category: category || undefined,
                    city: city || undefined,
                    address: address || undefined,
                    priceFrom: priceFrom ? parseFloat(priceFrom) : undefined,
                    availabilityTemplateId: availabilityTemplateId || undefined,
                    config,
                };
                await dispatch(createActivity(data)).unwrap();
                Alert.alert("Success", "Activity created successfully");
            }
            router.back();
        } catch (err: any) {
            Alert.alert("Error", err.message || "Failed to save activity");
        }
    };

    if (loading && isEditMode) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#007AFF" />
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

                    {/* Type */}
                    <View style={styles.field}>
                        <Text style={styles.label}>Type *</Text>
                        <TextInput
                            style={[styles.input, errors.typeId && styles.inputError]}
                            value={typeId}
                            onChangeText={setTypeId}
                            placeholder="e.g., karting, cooking_class, escape_room"
                        />
                        {errors.typeId && <Text style={styles.errorText}>{errors.typeId}</Text>}
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
                    </View>

                    {/* Duration (config field) */}
                    <View style={styles.field}>
                        <Text style={styles.label}>Duration (minutes)</Text>
                        <TextInput
                            style={styles.input}
                            value={duration}
                            onChangeText={setDuration}
                            placeholder="60"
                            keyboardType="numeric"
                        />
                    </View>

                    {/* Max Participants (config field) */}
                    <View style={styles.field}>
                        <Text style={styles.label}>Max Participants</Text>
                        <TextInput
                            style={styles.input}
                            value={maxParticipants}
                            onChangeText={setMaxParticipants}
                            placeholder="10"
                            keyboardType="numeric"
                        />
                    </View>

                    {/* Availability Template Picker */}
                    <View style={styles.field}>
                        <Text style={styles.label}>Availability Template</Text>
                        <Text style={styles.helperText}>Required to publish</Text>
                        {templates.length > 0 ? (
                            <View style={styles.templatePicker}>
                                {templates
                                    .filter((t) => t.status === "active")
                                    .map((template) => (
                                        <TouchableOpacity
                                            key={template.id}
                                            style={[
                                                styles.templateOption,
                                                availabilityTemplateId === template.id && styles.templateOptionSelected,
                                            ]}
                                            onPress={() => setAvailabilityTemplateId(template.id)}
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
                                        </TouchableOpacity>
                                    ))}
                                {availabilityTemplateId && (
                                    <TouchableOpacity
                                        style={styles.templateClearButton}
                                        onPress={() => setAvailabilityTemplateId("")}
                                    >
                                        <Text style={styles.templateClearText}>Clear Selection</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        ) : (
                            <Text style={styles.helperText}>
                                No active templates found. Create one in the Availability tab first.
                            </Text>
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
        backgroundColor: "#fff",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#e0e0e0",
    },
    title: {
        fontSize: 18,
        fontWeight: "bold",
    },
    cancelButton: {
        color: "#007AFF",
        fontSize: 16,
    },
    saveButton: {
        color: "#007AFF",
        fontSize: 16,
        fontWeight: "600",
    },
    form: {
        padding: 16,
    },
    field: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 8,
        color: "#333",
    },
    helperText: {
        fontSize: 12,
        color: "#666",
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    textArea: {
        minHeight: 100,
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
    templatePicker: {
        gap: 8,
    },
    templateOption: {
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#ccc",
        backgroundColor: "#fff",
    },
    templateOptionSelected: {
        backgroundColor: "#007AFF",
        borderColor: "#007AFF",
    },
    templateOptionText: {
        fontSize: 14,
        color: "#333",
    },
    templateOptionTextSelected: {
        color: "#fff",
        fontWeight: "600",
    },
    templateClearButton: {
        padding: 8,
        alignItems: "center",
    },
    templateClearText: {
        color: "#FF3B30",
        fontSize: 14,
    },
});
