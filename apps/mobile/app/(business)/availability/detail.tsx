import { useBusiness } from "@/src/providers/business-context";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import {
    AvailabilityException,
    clearCurrentTemplate,
    createTemplate,
    CreateTemplateData,
    fetchTemplate,
    updateTemplate,
    UpdateTemplateData,
} from "@/src/store/slices/availability-template-slice";
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

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function AvailabilityDetailScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id?: string }>();
    const dispatch = useAppDispatch();
    const { business } = useBusiness();
    const { currentTemplate, loading } = useAppSelector((state) => state.availabilityTemplates);

    const isEditMode = !!id;

    // Form state
    const [name, setName] = useState("");
    const [selectedDays, setSelectedDays] = useState<number[]>([]);
    const [startTime, setStartTime] = useState("09:00:00");
    const [endTime, setEndTime] = useState("17:00:00");
    const [slotDuration, setSlotDuration] = useState("60");
    const [capacity, setCapacity] = useState("1");
    const [imageUrl, setImageUrl] = useState("");
    const [exceptions, setExceptions] = useState<Omit<AvailabilityException, "id">[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Load template if editing
    useEffect(() => {
        if (isEditMode && id) {
            dispatch(fetchTemplate(id));
        }
        return () => {
            dispatch(clearCurrentTemplate());
        };
    }, [id, isEditMode]);

    // Populate form when template loads
    useEffect(() => {
        if (currentTemplate && isEditMode) {
            setName(currentTemplate.name);
            setSelectedDays(currentTemplate.daysOfWeek);
            setStartTime(formatTimeForInput(currentTemplate.startTime));
            setEndTime(formatTimeForInput(currentTemplate.endTime));
            setSlotDuration(currentTemplate.slotDurationMinutes.toString());
            setCapacity(currentTemplate.capacity.toString());
            setImageUrl(currentTemplate.imageUrl || "");
            setExceptions(
                currentTemplate.exceptions.map((ex) => ({
                    startDate: ex.startDate,
                    endDate: ex.endDate,
                    reason: ex.reason,
                }))
            );
        }
    }, [currentTemplate, isEditMode]);

    const formatTimeForInput = (timeStr: string): string => {
        try {
            const date = new Date(timeStr);
            const hours = date.getUTCHours().toString().padStart(2, "0");
            const minutes = date.getUTCMinutes().toString().padStart(2, "0");
            const seconds = date.getUTCSeconds().toString().padStart(2, "0");
            return `${hours}:${minutes}:${seconds}`;
        } catch {
            return timeStr;
        }
    };

    const toggleDay = (dayNumber: number) => {
        setSelectedDays((prev) =>
            prev.includes(dayNumber) ? prev.filter((d) => d !== dayNumber) : [...prev, dayNumber]
        );
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!name.trim()) {
            newErrors.name = "Name is required";
        }

        if (selectedDays.length === 0) {
            newErrors.days = "Select at least one day";
        }

        const slotDur = parseInt(slotDuration);
        if (isNaN(slotDur) || slotDur <= 0) {
            newErrors.slotDuration = "Slot duration must be greater than 0";
        }

        const cap = parseInt(capacity);
        if (isNaN(cap) || cap < 1) {
            newErrors.capacity = "Capacity must be at least 1";
        }

        // Time validation
        const startSeconds = timeToSeconds(startTime);
        const endSeconds = timeToSeconds(endTime);
        if (startSeconds >= endSeconds) {
            newErrors.time = "Start time must be before end time";
        }

        // Exception validation
        for (let i = 0; i < exceptions.length; i++) {
            const ex = exceptions[i];
            const start = new Date(ex.startDate);
            const end = new Date(ex.endDate);
            if (start > end) {
                newErrors[`exception${i}`] = "Start date must be before or equal to end date";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const timeToSeconds = (time: string): number => {
        const [h, m, s] = time.split(":").map(Number);
        return h * 3600 + m * 60 + (s || 0);
    };

    const handleSave = async () => {
        if (!validateForm()) {
            Alert.alert("Validation Error", "Please fix the errors in the form");
            return;
        }

        try {
            if (isEditMode && id) {
                const data: UpdateTemplateData = {
                    name,
                    daysOfWeek: selectedDays.sort((a, b) => a - b),
                    startTime,
                    endTime,
                    slotDurationMinutes: parseInt(slotDuration),
                    capacity: parseInt(capacity),
                    imageUrl: imageUrl || undefined,
                    exceptions: exceptions.length > 0 ? exceptions : undefined,
                };
                await dispatch(updateTemplate({ templateId: id, data })).unwrap();
                Alert.alert("Success", "Template updated successfully");
            } else {
                if (!business?.id) {
                    Alert.alert("Error", "Business ID not found. Please try again.");
                    return;
                }
                const data: CreateTemplateData = {
                    businessId: business.id,
                    name,
                    daysOfWeek: selectedDays.sort((a, b) => a - b),
                    startTime,
                    endTime,
                    slotDurationMinutes: parseInt(slotDuration),
                    capacity: parseInt(capacity),
                    imageUrl: imageUrl || undefined,
                    exceptions: exceptions.length > 0 ? exceptions : undefined,
                };
                await dispatch(createTemplate(data)).unwrap();
                Alert.alert("Success", "Template created successfully");
            }
            router.back();
        } catch (err: any) {
            Alert.alert("Error", err.message || "Failed to save template");
        }
    };

    const addException = () => {
        const today = new Date().toISOString().split("T")[0];
        setExceptions([...exceptions, { startDate: today, endDate: today, reason: "" }]);
    };

    const removeException = (index: number) => {
        setExceptions(exceptions.filter((_, i) => i !== index));
    };

    const updateException = (index: number, field: keyof typeof exceptions[0], value: string) => {
        const updated = [...exceptions];
        updated[index] = { ...updated[index], [field]: value };
        setExceptions(updated);
    };

    if (loading && isEditMode) {
        return (
            <View style={styles.container}>
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
                    <Text style={styles.title}>{isEditMode ? "Edit" : "Create"} Template</Text>
                    <TouchableOpacity onPress={handleSave}>
                        <Text style={styles.saveButton}>Save</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.form}>
                    {/* Name */}
                    <View style={styles.field}>
                        <Text style={styles.label}>Name *</Text>
                        <TextInput
                            style={[styles.input, errors.name && styles.inputError]}
                            value={name}
                            onChangeText={setName}
                            placeholder="e.g., Weekend Hours"
                        />
                        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
                    </View>

                    {/* Days of Week */}
                    <View style={styles.field}>
                        <Text style={styles.label}>Days of Week *</Text>
                        <View style={styles.daySelector}>
                            {DAY_NAMES.map((day, index) => {
                                const dayNumber = index + 1;
                                const isSelected = selectedDays.includes(dayNumber);
                                return (
                                    <TouchableOpacity
                                        key={day}
                                        style={[styles.dayButton, isSelected && styles.dayButtonSelected]}
                                        onPress={() => toggleDay(dayNumber)}
                                    >
                                        <Text style={[styles.dayButtonText, isSelected && styles.dayButtonTextSelected]}>
                                            {day}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                        {errors.days && <Text style={styles.errorText}>{errors.days}</Text>}
                    </View>

                    {/* Time Range */}
                    <View style={styles.field}>
                        <Text style={styles.label}>Time Range *</Text>
                        <View style={styles.timeRow}>
                            <View style={styles.timeField}>
                                <Text style={styles.subLabel}>Start</Text>
                                <TextInput
                                    style={[styles.input, errors.time && styles.inputError]}
                                    value={startTime}
                                    onChangeText={setStartTime}
                                    placeholder="HH:MM:SS"
                                />
                            </View>
                            <Text style={styles.timeSeparator}>—</Text>
                            <View style={styles.timeField}>
                                <Text style={styles.subLabel}>End</Text>
                                <TextInput
                                    style={[styles.input, errors.time && styles.inputError]}
                                    value={endTime}
                                    onChangeText={setEndTime}
                                    placeholder="HH:MM:SS"
                                />
                            </View>
                        </View>
                        {errors.time && <Text style={styles.errorText}>{errors.time}</Text>}
                    </View>

                    {/* Slot Duration */}
                    <View style={styles.field}>
                        <Text style={styles.label}>Slot Duration (minutes) *</Text>
                        <TextInput
                            style={[styles.input, errors.slotDuration && styles.inputError]}
                            value={slotDuration}
                            onChangeText={setSlotDuration}
                            keyboardType="numeric"
                            placeholder="60"
                        />
                        {errors.slotDuration && <Text style={styles.errorText}>{errors.slotDuration}</Text>}
                    </View>

                    {/* Capacity */}
                    <View style={styles.field}>
                        <Text style={styles.label}>Capacity *</Text>
                        <TextInput
                            style={[styles.input, errors.capacity && styles.inputError]}
                            value={capacity}
                            onChangeText={setCapacity}
                            keyboardType="numeric"
                            placeholder="1"
                        />
                        {errors.capacity && <Text style={styles.errorText}>{errors.capacity}</Text>}
                    </View>

                    {/* Image URL (optional) */}
                    <View style={styles.field}>
                        <Text style={styles.label}>Image URL (optional)</Text>
                        <TextInput
                            style={styles.input}
                            value={imageUrl}
                            onChangeText={setImageUrl}
                            placeholder="https://example.com/image.jpg"
                        />
                    </View>

                    {/* Exceptions */}
                    <View style={styles.field}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.label}>Exceptions</Text>
                            <TouchableOpacity style={styles.addButton} onPress={addException}>
                                <Text style={styles.addButtonText}>+ Add</Text>
                            </TouchableOpacity>
                        </View>
                        {exceptions.map((exception, index) => (
                            <View key={index} style={styles.exceptionCard}>
                                <View style={styles.exceptionRow}>
                                    <View style={styles.exceptionField}>
                                        <Text style={styles.subLabel}>Start Date</Text>
                                        <TextInput
                                            style={[styles.input, errors[`exception${index}`] && styles.inputError]}
                                            value={exception.startDate}
                                            onChangeText={(val) => updateException(index, "startDate", val)}
                                            placeholder="YYYY-MM-DD"
                                        />
                                    </View>
                                    <View style={styles.exceptionField}>
                                        <Text style={styles.subLabel}>End Date</Text>
                                        <TextInput
                                            style={[styles.input, errors[`exception${index}`] && styles.inputError]}
                                            value={exception.endDate}
                                            onChangeText={(val) => updateException(index, "endDate", val)}
                                            placeholder="YYYY-MM-DD"
                                        />
                                    </View>
                                </View>
                                <TextInput
                                    style={styles.input}
                                    value={exception.reason || ""}
                                    onChangeText={(val) => updateException(index, "reason", val)}
                                    placeholder="Reason (optional)"
                                />
                                <TouchableOpacity
                                    style={styles.removeButton}
                                    onPress={() => removeException(index)}
                                >
                                    <Text style={styles.removeButtonText}>Remove</Text>
                                </TouchableOpacity>
                                {errors[`exception${index}`] && (
                                    <Text style={styles.errorText}>{errors[`exception${index}`]}</Text>
                                )}
                            </View>
                        ))}
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

    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.divider,
        backgroundColor: theme.colors.bg,
    },
    title: {
        fontSize: 16,
        fontWeight: "800",
        color: theme.colors.text,
    },
    cancelButton: {
        color: theme.colors.muted,
        fontSize: 14,
        fontWeight: "700",
    },
    saveButton: {
        color: theme.colors.accent,
        fontSize: 14,
        fontWeight: "800",
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
        marginBottom: 8,
        color: theme.colors.muted,
        textTransform: "uppercase",
        letterSpacing: 0.4,
    },
    subLabel: {
        fontSize: 12,
        fontWeight: "700",
        marginBottom: 6,
        color: theme.colors.muted,
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
    inputError: {
        borderColor: theme.colors.danger,
    },
    errorText: {
        color: theme.colors.danger,
        fontSize: 12,
        marginTop: 6,
        fontWeight: "700",
    },

    daySelector: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    dayButton: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: theme.colors.divider,
        backgroundColor: theme.colors.surface,
    },
    dayButtonSelected: {
        backgroundColor: theme.colors.accent,
        borderColor: theme.colors.accent,
    },
    dayButtonText: {
        fontSize: 13,
        fontWeight: "800",
        color: theme.colors.text,
    },
    dayButtonTextSelected: {
        color: theme.colors.bg,
    },

    timeRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    timeField: {
        flex: 1,
    },
    timeSeparator: {
        fontSize: 18,
        color: theme.colors.muted,
        marginTop: 18,
    },

    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },
    addButton: {
        height: 34,
        paddingHorizontal: 12,
        borderRadius: 17,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.divider,
        alignItems: "center",
        justifyContent: "center",
    },
    addButtonText: {
        color: theme.colors.text,
        fontSize: 13,
        fontWeight: "800",
    },

    exceptionCard: {
        backgroundColor: theme.colors.card,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.divider,
        gap: 10,
    },
    exceptionRow: {
        flexDirection: "row",
        gap: 10,
    },
    exceptionField: {
        flex: 1,
    },

    removeButton: {
        height: 36,
        paddingHorizontal: 14,
        borderRadius: 18,
        backgroundColor: theme.colors.danger,
        alignSelf: "flex-start",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 2,
    },
    removeButtonText: {
        color: "#fff",
        fontSize: 13,
        fontWeight: "800",
    },
});